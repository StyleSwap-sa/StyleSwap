import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {users} from "../../drizzle/schema";
import {
  affiliateLinks,
  affiliateCommissions,
  affiliatePayoutBatches,
  userCredits,
  transactions,
} from "../../drizzle/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import {
  getAffiliateSettings,
  updateAffiliateSettings,
  SETTING_KEYS,
} from "../affiliate/settings";
import {
  generatePayoutBatch,
  markPayoutBatchPaid,
} from "../affiliate/payouts";
// import { db as _db } from "../_core/db-shim"; // never used; kept out

/**
 * Idempotent 5-credit approval bonus. Deliberately avoids a unique
 * constraint on usercredits (which has a pre-existing duplicate for user 1
 * and is out of scope). Uses transactions.reason as the idempotency key
 * inside a transaction, plus SELECT ... FOR UPDATE.
 */
async function grantApprovalBonus(userId: number): Promise<void> {
  const database = await getDb();
  if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  await database.transaction(async (tx) => {
    const already = await tx
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.reason, "affiliate_approval_bonus")
        )
      )
      .limit(1);
    if (already.length > 0) return;

    const credits = await tx
      .select({ id: userCredits.id })
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .orderBy(desc(userCredits.id))
      .limit(1)
      .for("update");

    if (credits.length === 0) {
      await tx.insert(userCredits).values({
        userId,
        totalCredits: 5,
        usedCredits: 0,
        remainingCredits: 5,
      });
    } else {
      await tx
        .update(userCredits)
        .set({
          totalCredits: sql`${userCredits.totalCredits} + 5`,
          remainingCredits: sql`${userCredits.remainingCredits} + 5`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userCredits.id, credits[0].id));
    }

    await tx.insert(transactions).values({
      userId,
      amount: 5,
      status: "completed",
      reason: "affiliate_approval_bonus",
    });
  });
}

export const affiliateAdminRouter = router({
  /** List applications + affiliates, filterable. */
  list: adminProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "approved", "rejected", "suspended"])
          .optional(),
        limit: z.number().int().min(1).max(200).default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const where = input.status
        ? eq(affiliateLinks.status, input.status)
        : undefined;
      const rows = await db
        .select()
        .from(affiliateLinks)
        .where(where)
        .orderBy(desc(affiliateLinks.appliedAt))
        .limit(input.limit);
      return rows;
    }),

  /** Approve an application. Grants 5 credits idempotently. */
  approve: adminProcedure
    .input(z.object({ affiliateId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const rows = await db
        .select()
        .from(affiliateLinks)
        .where(eq(affiliateLinks.id, input.affiliateId))
        .limit(1);
      if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      const a = rows[0];
      if (a.status === "approved") return { success: true, alreadyApproved: true };

      const slug = "a_" + randomBytes(5).toString("hex");

      await db
        .update(affiliateLinks)
        .set({
          status: "approved",
          referralSlug: slug,
          approvedAt: new Date().toISOString(),
          approvedBy: ctx.user.id,
          updatedAt: new Date().toISOString() ,
        })
        .where(eq(affiliateLinks.id, a.id));

      await grantApprovalBonus(a.userId);

      return {
        success: true,
        referralSlug: slug,
        shareUrl: `${process.env.VITE_APP_URL || "https://styleswap.co.za"}/a/${slug}`,
      };
    }),

  /** Reject an application. */
  reject: adminProcedure
    .input(
      z.object({
        affiliateId: z.number().int().positive(),
        reason: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(affiliateLinks)
        .set({
          status: "rejected",
          rejectedReason: input.reason,
          updatedAt: new Date().toISOString() ,
        })
        .where(eq(affiliateLinks.id, input.affiliateId));
      return { success: true };
    }),

  /** Read settings. */
  getSettings: adminProcedure.query(async () => {
    return await getAffiliateSettings();
  }),

  /** Update settings. Audited. */
  updateSettings: adminProcedure
    .input(
      z.object({
        starterRate: z.number().min(0).max(100).optional(),
        growthRate: z.number().min(0).max(100).optional(),
        creatorRate: z.number().min(0).max(100).optional(),
        growthMonthlyThreshold: z.number().min(0).optional(),
        creatorMonthlyThreshold: z.number().min(0).optional(),
        retailerPackageRate: z.number().min(0).max(100).optional(),
        businessTimezone: z.string().min(1).max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await updateAffiliateSettings(input, ctx.user.id);
      return updated;
    }),

  /** Generate a payout batch for a specific affiliate and period. */
  generatePayoutBatch: adminProcedure
    .input(
      z.object({
        affiliateLinkId: z.number().int().positive(),
        periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .mutation(async ({ input }) => {
      const r = await generatePayoutBatch(
        input.affiliateLinkId,
        input.periodStart,
        input.periodEnd
      );
      if (!r) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No approved commissions in that period",
        });
      }
      return { batchId: r.batchId };
    }),

  /** Mark a batch paid. */
  markBatchPaid: adminProcedure
    .input(z.object({ batchId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      return await markPayoutBatchPaid(input.batchId, ctx.user.id);
    }),

      /** List all payout batches, joined with affiliate name for the UI */
  listPayoutBatches: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    // Note: Assuming you have `affiliateLinks` and `users` imported at the top
    return await db
      .select({
        id: affiliatePayoutBatches.id,
        affiliateName: affiliateLinks.affiliateName,
        periodStart: affiliatePayoutBatches.periodStart,
        periodEnd: affiliatePayoutBatches.periodEnd,
        totalAmountCents: affiliatePayoutBatches.totalAmountCents,
        commissionCount: affiliatePayoutBatches.commissionCount,
        status: affiliatePayoutBatches.status,
        createdAt: affiliatePayoutBatches.createdAt,
      })
      .from(affiliatePayoutBatches)
      .innerJoin(affiliateLinks, eq(affiliatePayoutBatches.affiliateLinkId, affiliateLinks.id))
      .orderBy(desc(affiliatePayoutBatches.createdAt));
  }),

  /** Reverse a commission (refund / chargeback). */
  reverseCommission: adminProcedure
    .input(
      z.object({
        commissionId: z.number().int().positive(),
        reason: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(affiliateCommissions)
        .set({
          status: "reversed",
          reversedAt: new Date().toISOString(),
          reversedReason: input.reason,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(affiliateCommissions.id, input.commissionId));
      return { success: true };
    }),
});