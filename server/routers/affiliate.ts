import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  affiliateLinks,
  affiliateAttributions,
  affiliateTracking,
  affiliateCommissions,
} from "../../drizzle/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { recordClick } from "../affiliate/attribution";

function generateAffiliateCode(): string {
  return "AFF-" + randomBytes(6).toString("hex").toUpperCase();
}

function generateReferralSlug(): string {
  return "a_" + randomBytes(5).toString("hex");
}

export const affiliateRouter = router({
  /** Customer applies to become an affiliate. Creates a pending row. */
  applyForAffiliate: protectedProcedure
    .input(
      z.object({
        affiliateName: z.string().min(2).max(255),
        description: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const existing = await db
        .select({ id: affiliateLinks.id })
        .from(affiliateLinks)
        .where(eq(affiliateLinks.userId, ctx.user.id))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already applied or are an affiliate.",
        });
      }

      const affiliateCode = generateAffiliateCode();
      await db.insert(affiliateLinks).values({
        userId: ctx.user.id,
        affiliateCode,
        affiliateName: input.affiliateName,
        description: input.description,
        status: "pending",
      });

      // Notify admin (best-effort — never throws to the caller)
      try {
        const { sendEmail } = await import("../email-service");
        const adminEmail = process.env.ADMIN_EMAIL || "admin@thatone.co.za";
        await sendEmail({
          to: adminEmail,
          subject: `New affiliate application: ${input.affiliateName}`,
          html: `<p>A new affiliate application has been submitted.</p>
                 <p><b>Applicant user id:</b> ${ctx.user.id}</p>
                 <p><b>Name:</b> ${input.affiliateName}</p>
                 <p><b>Description:</b> ${input.description ?? "(none)"}</p>
                 <p>Review in the admin console.</p>`,
        });
      } catch (err) {
        console.error("[affiliate.applyForAffiliate] admin notification failed:", err);
      }

      return { success: true };
    }),

  /** Self-view: caller's own affiliate record, or null. */
  getMyAffiliate: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const rows = await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.userId, ctx.user.id))
      .limit(1);
    if (rows.length === 0) return null;

    const a = rows[0];
    return {
      id: a.id,
      status: a.status,
      affiliateName: a.affiliateName,
      referralSlug: a.referralSlug,
      shareUrl: a.referralSlug
        ? `${process.env.VITE_APP_URL || "https://getthatone.co.za"}/a/${a.referralSlug}`
        : null,
      appliedAt: a.appliedAt,
      approvedAt: a.approvedAt,
      rejectedReason: a.rejectedReason,
    };
  }),

  /** Self-view: caller's commissions. Paginated. */
  getMyCommissions: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { items: [], totals: { approved: 0, paid: 0, pending: 0, reversed: 0 } };

      const me = await db
        .select({ id: affiliateLinks.id })
        .from(affiliateLinks)
        .where(eq(affiliateLinks.userId, ctx.user.id))
        .limit(1);
      if (me.length === 0) {
        return { items: [], totals: { approved: 0, paid: 0, pending: 0, reversed: 0 } };
      }
      const affiliateLinkId = me[0].id;

      const items = await db
        .select({
          id: affiliateCommissions.id,
          packageId: affiliateCommissions.packageId,
          purchaseCategory: affiliateCommissions.purchaseCategory,
          qualifyingAmountCents: affiliateCommissions.qualifyingAmountCents,
          commissionAmountCents: affiliateCommissions.commissionAmountCents,
          appliedRate: affiliateCommissions.appliedRate,
          tier: affiliateCommissions.tier,
          status: affiliateCommissions.status,
          createdAt: affiliateCommissions.createdAt,
        })
        .from(affiliateCommissions)
        .where(eq(affiliateCommissions.affiliateLinkId, affiliateLinkId))
        .orderBy(desc(affiliateCommissions.createdAt))
        .limit(input.limit);

      const totals = { approved: 0, paid: 0, pending: 0, reversed: 0 };
      for (const it of items) {
        totals[it.status] += it.commissionAmountCents;
      }

      return { items, totals };
    }),

  /**
   * Public click tracker. Records the click. Returns nothing sensitive.
   * Rate-limited at the HTTP layer (see server/_core/index.ts) — the
   * affiliate router does not implement its own limiter.
   */
  trackClick: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(64),
        source: z.string().max(50).optional(),
        ipAddress: z.string().max(45).optional(),
        userAgent: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const link = await db
        .select({ id: affiliateLinks.id })
        .from(affiliateLinks)
        .where(
          and(
            eq(affiliateLinks.referralSlug, input.slug),
            eq(affiliateLinks.status, "approved")
          )
        )
        .limit(1);
      if (link.length === 0) return { success: false };

      await recordClick({
        affiliateLinkId: link[0].id,
        source: input.source,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      return { success: true };
    }),
});