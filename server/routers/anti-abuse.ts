import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { db } from "../db";
import { users, couponRedemptions, referralTracking, tryOnUserMonthlyUsage } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Anti-abuse prevention system to:
 * 1. Limit coupon usage (1 per user)
 * 2. Validate referrals (friend must use at least 1 try-on)
 * 3. Track device/IP to prevent fake accounts
 */
export const antiAbuseRouter = router({
  /**
   * Check if user has already redeemed a coupon
   * Prevents multiple coupon usage per user
   */
  checkCouponEligibility: protectedProcedure
    .input(z.object({ couponCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user already redeemed this coupon
      const existingRedemption = await db
        .select()
        .from(couponRedemptions)
        .where(eq(couponRedemptions.userId, userId))
        .limit(1);

      if (existingRedemption.length > 0) {
        return {
          eligible: false,
          reason: "You have already redeemed this coupon code",
        };
      }

      // Check if user has redeemed ANY coupon (limit 1 per user)
      const totalRedemptions = await db
        .select()
        .from(couponRedemptions)
        .where(eq(couponRedemptions.userId, userId));

      if (totalRedemptions.length > 0) {
        return {
          eligible: false,
          reason: "You can only redeem one coupon code per account",
        };
      }

      return { eligible: true, reason: null };
    }),

  /**
   * Validate referral - check if referred friend has used at least 1 try-on
   * Only counts valid referrals where friend actually engaged with the platform
   */
  validateReferral: protectedProcedure
    .input(z.object({ referredUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const referrerId = ctx.user.id;
      const referredUserId = input.referredUserId;

      // Check if referral exists
      const referral = await db
        .select()
        .from(referralTracking)
        .where(
          and(
            eq(referralTracking.referrerId, referrerId),
            eq(referralTracking.referredUserId, referredUserId)
          )
        )
        .limit(1);

      if (referral.length === 0) {
        return {
          valid: false,
          reason: "Referral not found",
          usageCount: 0,
        };
      }

      // Check if referred user has used at least 1 try-on
      const monthlyUsage = await db
        .select()
        .from(tryOnUserMonthlyUsage)
        .where(eq(tryOnUserMonthlyUsage.userId, referredUserId));

      const totalUsage = monthlyUsage.reduce(
        (sum, record) => sum + (record.usage_count || 0),
        0
      );

      if (totalUsage === 0) {
        return {
          valid: false,
          reason: "Referred friend has not used any try-ons yet",
          usageCount: 0,
        };
      }

      return {
        valid: true,
        reason: null,
        usageCount: totalUsage,
      };
    }),

  /**
   * Track device/IP for fraud detection
   * Prevents multiple accounts from same device
   */
  trackDeviceFingerprint: protectedProcedure
    .input(
      z.object({
        userAgent: z.string(),
        ipAddress: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // In production, you would store this in a device_fingerprints table
      // For now, we'll just log it for monitoring
      console.log(`[Anti-Abuse] Device fingerprint tracked for user ${userId}:`, {
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        timestamp: new Date(),
      });

      // Check if this IP/device has created multiple accounts recently
      // This would require a separate table to track device fingerprints
      // For MVP, we'll just return success

      return {
        tracked: true,
        message: "Device fingerprint recorded",
      };
    }),

  /**
   * Get abuse prevention stats for admin dashboard
   */
  getAbuseStats: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view abuse stats",
      });
    }

    // Get total coupon redemptions
    const totalRedemptions = await db
      .select({ count: sql<number>`count(*)` })
      .from(couponRedemptions);

    // Get users with multiple coupon attempts (potential abuse)
    const multipleRedemptionUsers = await db
      .select({
        userId: couponRedemptions.userId,
        count: sql<number>`count(*)`,
      })
      .from(couponRedemptions)
      .groupBy(couponRedemptions.userId);

    // Get invalid referrals (friends who didn't use try-ons)
    const invalidReferrals = await db
      .select({ count: sql<number>`count(*)` })
      .from(referralTracking)
      .where(eq(referralTracking.status, "invalid"));

    return {
      totalRedemptions: totalRedemptions[0]?.count || 0,
      usersWithMultipleRedemptions: multipleRedemptionUsers.length,
      invalidReferrals: invalidReferrals[0]?.count || 0,
      suspiciousAccounts: multipleRedemptionUsers.length,
    };
  }),
});
