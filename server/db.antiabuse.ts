import { eq, and, lt, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { couponRedemptions, referralTracking, fraudFlags, users } from "../drizzle/schema";

/**
 * Check if a user has already redeemed a coupon
 */
export async function hasUserRedeemedCoupon(userId: number): Promise<boolean> {
  const db = getDb();
  const result = await db
    .select()
    .from(couponRedemptions)
    .where(eq(couponRedemptions.userId, userId))
    .limit(1);
  
  return result.length > 0;
}

/**
 * Check if an IP address has redeemed a coupon recently (rate limiting)
 */
export async function getRecentCouponRedemptionsByIP(
  ipAddress: string,
  minutesAgo: number = 60
): Promise<number> {
  const db = getDb();
  const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  
  const result = await db
    .select()
    .from(couponRedemptions)
    .where(
      and(
        eq(couponRedemptions.ipAddress, ipAddress),
        gte(couponRedemptions.createdAt, cutoffTime)
      )
    );
  
  return result.length;
}

/**
 * Check if a device has redeemed a coupon (device fingerprinting)
 */
export async function getDeviceFingerprint(deviceId: string): Promise<number> {
  const db = getDb();
  const result = await db
    .select()
    .from(couponRedemptions)
    .where(eq(couponRedemptions.deviceId, deviceId));
  
  return result.length;
}

/**
 * Flag a user for suspicious activity
 */
export async function flagUserForFraud(
  userId: number,
  reason: string,
  severity: "low" | "medium" | "high"
): Promise<void> {
  const db = getDb();
  
  await db.insert(fraudFlags).values({
    userId,
    reason,
    severity,
    status: "pending_review",
  });
}

/**
 * Check if a user has been flagged for fraud
 */
export async function getUserFraudFlags(userId: number): Promise<any[]> {
  const db = getDb();
  
  return await db
    .select()
    .from(fraudFlags)
    .where(
      and(
        eq(fraudFlags.userId, userId),
        eq(fraudFlags.status, "pending_review")
      )
    );
}

/**
 * Check if referrer has completed actual try-ons (anti-referral abuse)
 */
export async function hasReferrerCompletedTryOns(referrerId: number): Promise<boolean> {
  const db = getDb();
  
  // Get referral tracking record
  const referralRecord = await db
    .select()
    .from(referralTracking)
    .where(eq(referralTracking.referrerId, referrerId))
    .limit(1);
  
  if (referralRecord.length === 0) {
    return false;
  }
  
  // Check if referrer has actual try-on usage
  // This would be verified through tryOnResults table
  return referralRecord[0].tryOnUsageCount > 0;
}

/**
 * Check for multi-accounting fraud (same device/IP creating multiple accounts)
 */
export async function detectMultiAccountingFraud(
  ipAddress: string,
  deviceId: string
): Promise<number> {
  const db = getDb();
  
  // Count users created from the same IP/device combination
  const result = await db
    .select()
    .from(couponRedemptions)
    .where(
      and(
        eq(couponRedemptions.ipAddress, ipAddress),
        eq(couponRedemptions.deviceId, deviceId)
      )
    );
  
  return result.length;
}

/**
 * Implement cooldown period for referral credit claims
 */
export async function checkReferralCooldown(
  referrerId: number,
  cooldownHours: number = 24
): Promise<boolean> {
  const db = getDb();
  const cutoffTime = new Date(Date.now() - cooldownHours * 60 * 60 * 1000).toISOString();
  
  const recentClaims = await db
    .select()
    .from(referralTracking)
    .where(
      and(
        eq(referralTracking.referrerId, referrerId),
        gte(referralTracking.updatedAt, cutoffTime)
      )
    );
  
  return recentClaims.length === 0; // True if no recent claims (cooldown passed)
}

/**
 * Log coupon redemption with fraud detection metadata
 */
export async function logCouponRedemption(
  userId: number,
  couponId: number,
  ipAddress: string,
  deviceId: string,
  userAgent: string
): Promise<void> {
  const db = getDb();
  
  await db.insert(couponRedemptions).values({
    userId,
    couponId,
    ipAddress,
    deviceId,
    userAgent,
    redeemedAt: new Date().toISOString(),
  });
}

/**
 * Get fraud risk score for a user
 */
export async function calculateFraudRiskScore(
  userId: number,
  ipAddress: string,
  deviceId: string
): Promise<number> {
  let riskScore = 0;
  
  // Check if user already redeemed a coupon (high risk)
  if (await hasUserRedeemedCoupon(userId)) {
    riskScore += 50;
  }
  
  // Check if IP has multiple recent redemptions (medium risk)
  const recentRedemptions = await getRecentCouponRedemptionsByIP(ipAddress, 60);
  if (recentRedemptions > 3) {
    riskScore += 30;
  }
  
  // Check for multi-accounting (high risk)
  const multiAccountCount = await detectMultiAccountingFraud(ipAddress, deviceId);
  if (multiAccountCount > 2) {
    riskScore += 40;
  }
  
  // Check fraud flags (high risk)
  const fraudFlagsResult = await getUserFraudFlags(userId);
  if (fraudFlagsResult.length > 0) {
    riskScore += 60;
  }
  
  return Math.min(riskScore, 100); // Cap at 100
}
