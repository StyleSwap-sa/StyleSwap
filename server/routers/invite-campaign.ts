import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  users, 
  referralTracking, 
  referralLinks,
  userCredits,
  transactions
} from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

/**
 * INVITE2GET5 Campaign Router
 * 
 * Handles the referral campaign where:
 * - Users get a unique invite code to share
 * - When 2 friends sign up using their code, they get 5 bonus credits
 * - Friends who sign up get 2 bonus credits (ME2 code)
 */

export const inviteCampaignRouter = router({
  /**
   * Generate a unique invite code for the current user
   * Users can share this code to invite friends
   */
  generateInviteCode: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user already has an active invite code
      const existingLink = await db
        .select()
        .from(referralLinks)
        .where(
          and(
            eq(referralLinks.userId, ctx.user.id),
            eq(referralLinks.platform, "invite-campaign"),
            eq(referralLinks.isActive, true)
          )
        )
        .limit(1);

      if (existingLink.length > 0) {
        // Return existing code with stats
        const stats = await getInviteStats(ctx.user.id);
        return {
          success: true,
          inviteCode: existingLink[0].referralCode,
          shareUrl: `${process.env.VITE_APP_URL || "https://styleswap.co.za"}/join?invite=${existingLink[0].referralCode}`,
          stats,
        };
      }

      // Generate new invite code
      const inviteCode = `INVITE-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
      const shareUrl = `${process.env.VITE_APP_URL || "https://styleswap.co.za"}/join?invite=${inviteCode}`;

      // Create a dummy outfit reference (required by schema)
      // For invite campaigns, we'll use outfit ID 0 as a placeholder
      const result = await db
        .insert(referralLinks)
        .values({
          userId: ctx.user.id,
          outfitId: 0, // Placeholder for invite campaign
          referralCode: inviteCode,
          shortUrl: shareUrl,
          platform: "invite-campaign",
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        })
        .returning();

      const stats = await getInviteStats(ctx.user.id);

      return {
        success: true,
        inviteCode,
        shareUrl,
        stats,
      };
    } catch (error) {
      console.error("Error generating invite code:", error);
      throw error;
    }
  }),

  /**
   * Get invite campaign statistics for the current user
   */
  getInviteStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getInviteStats(ctx.user.id);
    } catch (error) {
      console.error("Error getting invite stats:", error);
      throw error;
    }
  }),

  /**
   * Track when a new user signs up with an invite code
   * Automatically awards credits to both referrer and referee
   */
  trackInviteSignup: publicProcedure
    .input(
      z.object({
        inviteCode: z.string(),
        newUserId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Find the referral link for this invite code
        const referralLink = await db
          .select()
          .from(referralLinks)
          .where(
            and(
              eq(referralLinks.referralCode, input.inviteCode),
              eq(referralLinks.platform, "invite-campaign"),
              eq(referralLinks.isActive, true)
            )
          )
          .limit(1);

        if (!referralLink.length) {
          return {
            success: false,
            message: "Invalid invite code",
          };
        }

        const referrerId = referralLink[0].userId;

        // Record the referral tracking
        await db.insert(referralTracking).values({
          referralLinkId: referralLink[0].id,
          referredUserId: input.newUserId,
          referrerUserId: referrerId,
          platform: "invite-campaign",
          conversionStatus: "signed_up",
          convertedAt: new Date(),
        });

        // Award 2 credits to the new user (ME2 code)
        await awardCreditsToUser(input.newUserId, 2, "ME2 coupon: Invited via referral");

        // Check if referrer has reached 2 referrals - if so, award 5 credits
        const referralCount = await db
          .select({ count: sql`COUNT(*)` })
          .from(referralTracking)
          .where(
            and(
              eq(referralTracking.referrerUserId, referrerId),
              eq(referralTracking.conversionStatus, "signed_up")
            )
          );

        const count = Number(referralCount[0].count);

        if (count === 2) {
          // Award 5 credits to referrer
          await awardCreditsToUser(referrerId, 5, "INVITE2GET5 coupon: Reached 2 referrals");
        }

        return {
          success: true,
          message: "Signup tracked successfully",
          creditsAwarded: 2,
          referrerBonusAwarded: count === 2,
        };
      } catch (error) {
        console.error("Error tracking invite signup:", error);
        throw error;
      }
    }),

  /**
   * Get leaderboard of top inviters
   */
  getTopInviters: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const topInviters = await db
          .select({
            userId: referralTracking.referrerUserId,
            userName: users.name,
            referralCount: sql`COUNT(${referralTracking.id})`,
            creditsEarned: sql`COUNT(${referralTracking.id}) / 2 * 5`, // 5 credits per 2 referrals
          })
          .from(referralTracking)
          .innerJoin(users, eq(referralTracking.referrerUserId, users.id))
          .where(
            and(
              eq(referralTracking.platform, "invite-campaign"),
              eq(referralTracking.conversionStatus, "signed_up")
            )
          )
          .groupBy(referralTracking.referrerUserId, users.name)
          .orderBy(sql`COUNT(${referralTracking.id}) DESC`)
          .limit(input.limit);

        return {
          success: true,
          topInviters,
        };
      } catch (error) {
        console.error("Error getting top inviters:", error);
        throw error;
      }
    }),
});

/**
 * Helper function to get invite statistics for a user
 */
async function getInviteStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await db
    .select({
      totalInvites: sql`COUNT(${referralTracking.id})`,
      creditsEarned: sql`CASE WHEN COUNT(${referralTracking.id}) >= 2 THEN 5 ELSE 0 END`,
    })
    .from(referralTracking)
    .where(
      and(
        eq(referralTracking.referrerUserId, userId),
        eq(referralTracking.platform, "invite-campaign"),
        eq(referralTracking.conversionStatus, "signed_up")
      )
    );

  return {
    totalInvites: Number(stats[0]?.totalInvites || 0),
    creditsEarned: Number(stats[0]?.creditsEarned || 0),
    creditsRemaining: Math.max(0, 2 - Number(stats[0]?.totalInvites || 0)),
  };
}

/**
 * Helper function to award credits to a user
 */
async function awardCreditsToUser(
  userId: number,
  credits: number,
  reason: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update user credits
  const userCredit = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (userCredit.length === 0) {
    // Create new credit record
    await db.insert(userCredits).values({
      userId,
      totalCredits: credits,
    });
  } else {
    // Update existing credits
    await db
      .update(userCredits)
      .set({
        totalCredits: sql`${userCredits.totalCredits} + ${credits}`,
      })
      .where(eq(userCredits.userId, userId));
  }

  // Record transaction
  await db.insert(transactions).values({
    userId,
    amount: credits.toString(),
    status: "completed",
    reason,
  });
}
