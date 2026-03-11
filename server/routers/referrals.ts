import { z } from "zod";
import { referralLinks, referralTracking, users, savedOutfits } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import crypto from "crypto";

function generateReferralCode(): string {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

function generateShareUrl(referralCode: string, platform: string): string {
  const baseUrl = process.env.VITE_APP_URL || "https://styleswap.co.za";
  return `${baseUrl}/referral/${referralCode}?platform=${platform}`;
}

export const referralsRouter = router({
  // Generate a referral link for sharing an outfit
  generateReferralLink: protectedProcedure
    .input(
      z.object({
        outfitId: z.number(),
        platform: z.enum(["whatsapp", "instagram", "tiktok", "twitter"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify outfit exists and belongs to user
      const outfit = await ctx.db
        .select()
        .from(savedOutfits)
        .where(
          and(
            eq(savedOutfits.id, input.outfitId),
            eq(savedOutfits.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!outfit || outfit.length === 0) {
        throw new Error("Outfit not found");
      }

      // Check if referral link already exists for this outfit and platform
      const existingLink = await ctx.db
        .select()
        .from(referralLinks)
        .where(
          and(
            eq(referralLinks.outfitId, input.outfitId),
            eq(referralLinks.userId, ctx.user.id),
            eq(referralLinks.platform, input.platform),
            eq(referralLinks.isActive, true)
          )
        )
        .limit(1);

      if (existingLink && existingLink.length > 0) {
        return {
          referralCode: existingLink[0].referralCode,
          shareUrl: generateShareUrl(
            existingLink[0].referralCode,
            input.platform
          ),
          shortUrl: existingLink[0].shortUrl,
        };
      }

      // Generate new referral link
      const referralCode = generateReferralCode();
      const shareUrl = generateShareUrl(referralCode, input.platform);

      const result = await ctx.db
        .insert(referralLinks)
        .values({
          userId: ctx.user.id,
          outfitId: input.outfitId,
          referralCode,
          shortUrl: shareUrl,
          platform: input.platform,
          isActive: true,
        })
        .returning();

      return {
        referralCode,
        shareUrl,
        shortUrl: result[0].shortUrl,
      };
    }),

  // Track referral link click
  trackReferralClick: publicProcedure
    .input(
      z.object({
        referralCode: z.string(),
        platform: z.string().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find referral link
      const link = await ctx.db
        .select()
        .from(referralLinks)
        .where(eq(referralLinks.referralCode, input.referralCode))
        .limit(1);

      if (!link || link.length === 0) {
        throw new Error("Invalid referral code");
      }

      const referralLink = link[0];

      // Increment clicks
      await ctx.db
        .update(referralLinks)
        .set({
          clicks: (referralLink.clicks || 0) + 1,
        })
        .where(eq(referralLinks.id, referralLink.id));

      // Track the click
      await ctx.db.insert(referralTracking).values({
        referralLinkId: referralLink.id,
        referrerUserId: referralLink.userId,
        platform: input.platform || referralLink.platform,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        conversionStatus: "clicked",
      });

      // Return outfit details for preview
      const outfit = await ctx.db
        .select()
        .from(savedOutfits)
        .where(eq(savedOutfits.id, referralLink.outfitId))
        .limit(1);

      const referrer = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, referralLink.userId))
        .limit(1);

      return {
        outfit: outfit[0],
        referrer: referrer[0],
        referralCode: input.referralCode,
      };
    }),

  // Track signup from referral
  trackReferralSignup: publicProcedure
    .input(
      z.object({
        referralCode: z.string(),
        newUserId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find referral link
      const link = await ctx.db
        .select()
        .from(referralLinks)
        .where(eq(referralLinks.referralCode, input.referralCode))
        .limit(1);

      if (!link || link.length === 0) {
        throw new Error("Invalid referral code");
      }

      const referralLink = link[0];

      // Update referral link signup count
      await ctx.db
        .update(referralLinks)
        .set({
          signups: (referralLink.signups || 0) + 1,
        })
        .where(eq(referralLinks.id, referralLink.id));

      // Update tracking record
      await ctx.db
        .update(referralTracking)
        .set({
          referredUserId: input.newUserId,
          conversionStatus: "signed_up",
          convertedAt: new Date(),
        })
        .where(
          and(
            eq(referralTracking.referralLinkId, referralLink.id),
            eq(referralTracking.referredUserId, null)
          )
        );

      return {
        success: true,
        referralCode: input.referralCode,
      };
    }),

  // Get referral statistics for a user
  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const links = await ctx.db
      .select()
      .from(referralLinks)
      .where(eq(referralLinks.userId, ctx.user.id));

    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const totalSignups = links.reduce(
      (sum, link) => sum + (link.signups || 0),
      0
    );

    return {
      totalLinks: links.length,
      totalClicks,
      totalSignups,
      conversionRate:
        totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(2) : 0,
      links,
    };
  }),

  // Get referral details for a specific outfit
  getReferralDetails: protectedProcedure
    .input(z.object({ outfitId: z.number() }))
    .query(async ({ ctx, input }) => {
      const links = await ctx.db
        .select()
        .from(referralLinks)
        .where(
          and(
            eq(referralLinks.outfitId, input.outfitId),
            eq(referralLinks.userId, ctx.user.id)
          )
        );

      return links;
    }),

  // Get public referral link info (for non-authenticated users)
  getPublicReferralInfo: publicProcedure
    .input(z.object({ referralCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const link = await ctx.db
        .select()
        .from(referralLinks)
        .where(eq(referralLinks.referralCode, input.referralCode))
        .limit(1);

      if (!link || link.length === 0) {
        throw new Error("Invalid referral code");
      }

      const referralLink = link[0];

      // Get outfit details
      const outfit = await ctx.db
        .select()
        .from(savedOutfits)
        .where(eq(savedOutfits.id, referralLink.outfitId))
        .limit(1);

      // Get referrer details
      const referrer = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, referralLink.userId))
        .limit(1);

      return {
        outfit: outfit[0],
        referrer: referrer[0],
        referralCode: input.referralCode,
      };
    }),
});
