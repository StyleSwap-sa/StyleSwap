import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  generateReferralCode,
  awardReferrerCredits,
  awardRefereeCredits,
  getReferralStats,
} from "../db.referral";

import { getDb } from "../db";
import { boutiqueUsers, boutiques } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const referralRouter = router({
  /**
   * Get referral code and statistics for current boutique
   */
  getMyReferralCode: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get current boutique for user
      const boutiqueUser = await db
        .select()
        .from(boutiqueUsers)
        .where(eq(boutiqueUsers.userId, ctx.user.id))
        .limit(1);

      if (!boutiqueUser.length) {
        throw new Error("User is not associated with any boutique");
      }

      const boutiqueId = boutiqueUser[0].boutiqueId;
      const stats = await getReferralStats(boutiqueId);

      return {
        success: true,
        referralCode: stats.referralCode,
        totalReferrals: stats.totalReferrals,
        totalCreditsEarned: stats.totalCreditsEarned,
        shareUrl: `${process.env.VITE_FRONTEND_URL || "https://styleswap.co.za"}/boutique-signup?referral=${stats.referralCode}`,
      };
    } catch (error) {
      console.error("Error getting referral code:", error);
      throw error;
    }
  }),

  /**
   * Apply referral code during boutique signup
   * Awards credits to both referrer and referee
   */
  applyReferralCode: protectedProcedure
    .input(
      z.object({
        referralCode: z.string().min(1),
        newBoutiqueId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Parse referral code to get referrer boutique ID
        // Format: STYLESWAP-BOUTIQUE-{ID}
        const parts = input.referralCode.split("-");
        if (parts.length !== 3 || parts[0] !== "STYLESWAP" || parts[1] !== "BOUTIQUE") {
          throw new Error("Invalid referral code format");
        }

        const referrerBoutiqueId = parseInt(parts[2], 10);
        if (isNaN(referrerBoutiqueId)) {
          throw new Error("Invalid referral code");
        }

        // Verify referrer boutique exists
        const referrerBoutique = await db
          .select()
          .from(boutiques)
          .where(eq(boutiques.id, referrerBoutiqueId))
          .limit(1);

        if (!referrerBoutique.length) {
          throw new Error("Referral code is invalid or expired");
        }

        // Award credits to referrer
        await awardReferrerCredits(referrerBoutiqueId, 10);

        // Award credits to referee (new boutique)
        await awardRefereeCredits(input.newBoutiqueId, 0);

        return {
          success: true,
          message: "Referral applied successfully!",
          referrerRewardCredits: 10,
          refereeRewardCredits: 0,
        };
      } catch (error) {
        console.error("Error applying referral code:", error);
        throw error;
      }
    }),

  /**
   * Get referral history for current boutique
   */
  getReferralHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get current boutique for user
      const boutiqueUser = await db
        .select()
        .from(boutiqueUsers)
        .where(eq(boutiqueUsers.userId, ctx.user.id))
        .limit(1);

      if (!boutiqueUser.length) {
        throw new Error("User is not associated with any boutique");
      }

      const boutiqueId = boutiqueUser[0].boutiqueId;
      const stats = await getReferralStats(boutiqueId);

      return {
        success: true,
        boutiqueId,
        referralCode: stats.referralCode,
        totalReferrals: stats.totalReferrals,
        totalCreditsEarned: stats.totalCreditsEarned,
        referralRewardPerSignup: 10,
        newBoutiqueRewardPerSignup: 0,
      };
    } catch (error) {
      console.error("Error getting referral history:", error);
      throw error;
    }
  }),

  /**
   * Copy referral code to clipboard (helper)
   */
  copyReferralCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "Referral code copied to clipboard",
        code: input.code,
      };
    }),
});
