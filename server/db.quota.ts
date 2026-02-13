import { and, eq, lte } from "drizzle-orm";
import { getDb } from "./db";

/**
 * Plan configuration with monthly limits
 */
export const PLAN_CONFIG: Record<string, { name: string; monthlyLimit: number }> = {
  "pkg_100_credits": { name: "Boutique Starter", monthlyLimit: 100 },
  "pkg_200_credits": { name: "Boutique Growth", monthlyLimit: 200 },
  "pkg_500_credits": { name: "Store Pro", monthlyLimit: 500 },
  "pkg_1000_credits": { name: "Store Scale", monthlyLimit: 1000 },
  "pkg_5000_credits": { name: "Retailer Pro", monthlyLimit: 5000 },
  "pkg_20000_credits": { name: "Enterprise Retail", monthlyLimit: 20000 },
};

/**
 * Get current month boundaries
 */
function getMonthBoundaries() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: monthStart.toISOString().split('T')[0],
    end: monthEnd.toISOString().split('T')[0],
  };
}

/**
 * Get or create boutique subscription
 */
export async function getBoutiqueSubscription(boutiqueId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.query.raw(
    `SELECT * FROM boutiqueSubscriptions WHERE boutiqueId = ? LIMIT 1`,
    [boutiqueId]
  );
  
  return result?.[0] || null;
}

/**
 * Create or update boutique subscription
 */
export async function createOrUpdateBoutiqueSubscription(
  boutiqueId: number,
  planId: string,
  billingCycle: "monthly" | "annual" = "monthly"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const planConfig = PLAN_CONFIG[planId];
  if (!planConfig) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  
  const boundaries = getMonthBoundaries();
  
  // Check if subscription already exists
  const existing = await getBoutiqueSubscription(boutiqueId);
  
  if (existing) {
    await db.query.raw(
      `UPDATE boutiqueSubscriptions SET planId = ?, planName = ?, monthlyLimit = ?, billingCycle = ?, status = 'active', updatedAt = NOW() WHERE boutiqueId = ?`,
      [planId, planConfig.name, planConfig.monthlyLimit, billingCycle, boutiqueId]
    );
  } else {
    await db.query.raw(
      `INSERT INTO boutiqueSubscriptions (boutiqueId, planId, planName, monthlyLimit, currentMonthUsage, usagePeriodStart, usagePeriodEnd, status, billingCycle, autoRenew) VALUES (?, ?, ?, ?, 0, ?, ?, 'active', ?, 1)`,
      [boutiqueId, planId, planConfig.name, planConfig.monthlyLimit, boundaries.start, boundaries.end, billingCycle]
    );
  }
  
  return getBoutiqueSubscription(boutiqueId);
}

/**
 * Check monthly quota for a user
 */
export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetDate: string;
  reason?: string;
}

export async function checkMonthlyQuota(
  userId: number,
  boutiqueId: number
): Promise<QuotaCheckResult> {
  const db = await getDb();
  if (!db) {
    return {
      allowed: true,
      remaining: 999999,
      limit: 999999,
      resetDate: "",
      reason: "Database unavailable",
    };
  }
  
  // Get boutique subscription
  const subscription = await getBoutiqueSubscription(boutiqueId);
  
  if (!subscription) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      resetDate: "",
      reason: "Boutique has no active subscription",
    };
  }
  
  if (subscription.status !== "active") {
    return {
      allowed: false,
      remaining: 0,
      limit: subscription.monthlyLimit,
      resetDate: subscription.usagePeriodEnd,
      reason: `Subscription is ${subscription.status}`,
    };
  }
  
  // Get current month usage for user
  const boundaries = getMonthBoundaries();
  
  const usageResult = await db.query.raw(
    `SELECT tryOnCount FROM userMonthlyUsage WHERE userId = ? AND boutiqueId = ? AND usagePeriodStart = ? LIMIT 1`,
    [userId, boutiqueId, boundaries.start]
  );
  
  const currentUsage = usageResult?.[0]?.tryOnCount || 0;
  const remaining = subscription.monthlyLimit - currentUsage;
  const allowed = remaining > 0;
  
  return {
    allowed,
    remaining: Math.max(0, remaining),
    limit: subscription.monthlyLimit,
    resetDate: subscription.usagePeriodEnd,
    reason: allowed ? undefined : "Monthly quota exceeded",
  };
}

/**
 * Get or create monthly usage record
 */
export async function getOrCreateMonthlyUsage(
  userId: number,
  boutiqueId: number
) {
  const db = await getDb();
  if (!db) return null;
  
  const boundaries = getMonthBoundaries();
  
  // Check if record exists for current month
  const existing = await db.query.raw(
    `SELECT * FROM userMonthlyUsage WHERE userId = ? AND boutiqueId = ? AND usagePeriodStart = ? LIMIT 1`,
    [userId, boutiqueId, boundaries.start]
  );
  
  if (existing?.[0]) {
    return existing[0];
  }
  
  // Create new record for current month
  await db.query.raw(
    `INSERT INTO userMonthlyUsage (userId, boutiqueId, usagePeriodStart, usagePeriodEnd, tryOnCount) VALUES (?, ?, ?, ?, 0)`,
    [userId, boutiqueId, boundaries.start, boundaries.end]
  );
  
  // Return newly created record
  const newRecord = await db.query.raw(
    `SELECT * FROM userMonthlyUsage WHERE userId = ? AND boutiqueId = ? AND usagePeriodStart = ? LIMIT 1`,
    [userId, boutiqueId, boundaries.start]
  );
  
  return newRecord?.[0] || null;
}

/**
 * Increment monthly usage
 */
export async function incrementMonthlyUsage(
  userId: number,
  boutiqueId: number,
  amount: number = 1
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Get or create usage record
  const usage = await getOrCreateMonthlyUsage(userId, boutiqueId);
  if (!usage) return;
  
  // Increment try-on count
  await db.query.raw(
    `UPDATE userMonthlyUsage SET tryOnCount = tryOnCount + ?, updatedAt = NOW() WHERE id = ?`,
    [amount, usage.id]
  );
  
  // Log access
  await logFeatureAccess({
    userId,
    boutiqueId,
    featureName: "try_on_generation",
    accessGranted: true,
    reason: `Used ${amount} try-on(s)`,
  });
}

/**
 * Decrement monthly usage (for refunds)
 */
export async function decrementMonthlyUsage(
  userId: number,
  boutiqueId: number,
  amount: number = 1
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Get usage record
  const usage = await getOrCreateMonthlyUsage(userId, boutiqueId);
  if (!usage) return;
  
  // Decrement try-on count (but don't go below 0)
  const newCount = Math.max(0, usage.tryOnCount - amount);
  
  await db.query.raw(
    `UPDATE userMonthlyUsage SET tryOnCount = ?, updatedAt = NOW() WHERE id = ?`,
    [newCount, usage.id]
  );
  
  // Log access
  await logFeatureAccess({
    userId,
    boutiqueId,
    featureName: "try_on_refund",
    accessGranted: true,
    reason: `Refunded ${amount} try-on(s)`,
  });
}

/**
 * Reset monthly usage (for manual corrections)
 */
export async function resetMonthlyUsage(
  userId: number,
  boutiqueId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const boundaries = getMonthBoundaries();
  
  await db.query.raw(
    `UPDATE userMonthlyUsage SET tryOnCount = 0, updatedAt = NOW() WHERE userId = ? AND boutiqueId = ? AND usagePeriodStart = ?`,
    [userId, boutiqueId, boundaries.start]
  );
  
  // Log access
  await logFeatureAccess({
    userId,
    boutiqueId,
    featureName: "usage_reset",
    accessGranted: true,
    reason: "Manual reset",
  });
}

/**
 * Log feature access attempt
 */
export interface FeatureAccessLogInput {
  userId?: number;
  boutiqueId: number;
  featureName: string;
  accessGranted: boolean;
  reason?: string;
}

export async function logFeatureAccess(log: FeatureAccessLogInput): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.query.raw(
    `INSERT INTO featureAccessLogs (userId, boutiqueId, featureName, accessGranted, reason) VALUES (?, ?, ?, ?, ?)`,
    [log.userId || null, log.boutiqueId, log.featureName, log.accessGranted ? 1 : 0, log.reason || null]
  );
}

/**
 * Get feature access logs for a boutique
 */
export async function getBoutiqueAccessLogs(
  boutiqueId: number,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) return [];
  
  const logs = await db.query.raw(
    `SELECT * FROM featureAccessLogs WHERE boutiqueId = ? ORDER BY createdAt DESC LIMIT ?`,
    [boutiqueId, limit]
  );
  
  return logs || [];
}
