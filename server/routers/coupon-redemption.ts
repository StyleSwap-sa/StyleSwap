import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { couponCodes, couponRedemptions, userCredits } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  hasUserRedeemedCoupon,
  getRecentCouponRedemptionsByIP,
  detectMultiAccountingFraud,
  flagUserForFraud,
  calculateFraudRiskScore,
  logCouponRedemption,
} from "../db.antiabuse";

export const couponRedemptionRouter = router({
  /**
   * Redeem a coupon code with comprehensive anti-abuse checks
   */
  redeemCoupon: protectedProcedure
    .input(
      z.object({
        couponCode: z.string().min(1).max(50),
        ipAddress: z.string(),
        deviceId: z.string(),
        userAgent: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      try {
        // 1. Check if coupon code exists and is valid
        const coupon = await db
          .select()
          .from(couponCodes)
          .where(
            and(
              eq(couponCodes.code, input.couponCode),
              eq(couponCodes.isActive, true)
            )
          )
          .limit(1);

        if (coupon.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invalid or expired coupon code",
          });
        }

        const couponData = coupon[0];

        // 2. Check if coupon has reached max redemptions
        const redemptionCount = await db
          .select()
          .from(couponRedemptions)
          .where(eq(couponRedemptions.couponId, couponData.id));

        if (
          couponData.maxRedemptions &&
          redemptionCount.length >= couponData.maxRedemptions
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Coupon has reached maximum redemptions",
          });
        }

        // 3. ANTI-ABUSE CHECK: User already redeemed a coupon (1 per user limit)
        if (await hasUserRedeemedCoupon(userId)) {
          await flagUserForFraud(
            userId,
            "Attempted to redeem multiple coupons",
            "high"
          );
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have already redeemed a coupon",
          });
        }

        // 4. ANTI-ABUSE CHECK: Rate limiting by IP (5 attempts per hour)
        const recentRedemptions = await getRecentCouponRedemptionsByIP(
          input.ipAddress,
          60
        );
        if (recentRedemptions >= 5) {
          await flagUserForFraud(
            userId,
            `IP ${input.ipAddress} attempted excessive coupon redemptions`,
            "medium"
          );
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many coupon redemption attempts. Please try again later.",
          });
        }

        // 5. ANTI-ABUSE CHECK: Multi-accounting detection (same device/IP)
        const multiAccountCount = await detectMultiAccountingFraud(
          input.ipAddress,
          input.deviceId
        );
        if (multiAccountCount > 2) {
          await flagUserForFraud(
            userId,
            `Multi-accounting detected: Device ${input.deviceId} from IP ${input.ipAddress}`,
            "high"
          );
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Suspicious activity detected. Please contact support.",
          });
        }

        // 6. Calculate fraud risk score
        const riskScore = await calculateFraudRiskScore(
          userId,
          input.ipAddress,
          input.deviceId
        );

        if (riskScore > 70) {
          await flagUserForFraud(
            userId,
            `High fraud risk score: ${riskScore}`,
            "high"
          );
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Account flagged for suspicious activity. Please contact support.",
          });
        }

        // 7. Log the redemption attempt
        await logCouponRedemption(
          userId,
          couponData.id,
          input.ipAddress,
          input.deviceId,
          input.userAgent
        );

        // 8. Credit the user with the coupon credits
        const creditsToAdd = couponData.creditsGranted || 0;

        // Get or create user credits record
        const userCreditsRecord = await db
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, userId))
          .limit(1);

        if (userCreditsRecord.length === 0) {
          // Create new record
          await db.insert(userCredits).values({
            userId,
            totalCredits: creditsToAdd,
            usedCredits: 0,
            remainingCredits: creditsToAdd,
          });
        } else {
          // Update existing record
          const current = userCreditsRecord[0];
          const newTotal = current.totalCredits + creditsToAdd;
          const newRemaining = current.remainingCredits + creditsToAdd;

          await db
            .update(userCredits)
            .set({
              totalCredits: newTotal,
              remainingCredits: newRemaining,
            })
            .where(eq(userCredits.userId, userId));
        }

        return {
          success: true,
          creditsAdded: creditsToAdd,
          message: `Successfully redeemed coupon! ${creditsToAdd} credits added to your account.`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("[Coupon Redemption] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to redeem coupon. Please try again.",
        });
      }
    }),

  /**
   * Get coupon details without redeeming (for preview)
   */
  getCouponDetails: protectedProcedure
    .input(z.object({ couponCode: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();

      const coupon = await db
        .select()
        .from(couponCodes)
        .where(
          and(
            eq(couponCodes.code, input.couponCode),
            eq(couponCodes.isActive, true)
          )
        )
        .limit(1);

      if (coupon.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coupon not found",
        });
      }

      const couponData = coupon[0];
      const redemptionCount = await db
        .select()
        .from(couponRedemptions)
        .where(eq(couponRedemptions.couponId, couponData.id));

      return {
        code: couponData.code,
        description: couponData.description,
        creditsGranted: couponData.creditsGranted,
        maxRedemptions: couponData.maxRedemptions,
        currentRedemptions: redemptionCount.length,
        isAvailable:
          !couponData.maxRedemptions ||
          redemptionCount.length < couponData.maxRedemptions,
      };
    }),
});
