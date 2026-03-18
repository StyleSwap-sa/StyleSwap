import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

/**
 * Subscription status enum
 */
export enum SubscriptionStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

/**
 * Subscription validation result
 */
export interface SubscriptionValidationResult {
  isValid: boolean;
  status: SubscriptionStatus;
  boutiqueId?: number;
  planName?: string;
  expiresAt?: string;
  reason?: string;
}

/**
 * Get user's boutique subscription status
 */
export async function getUserBoutiqueSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get user's boutique
  const boutiqueResult = await db.query.raw(
    `SELECT b.id, b.name, b.status FROM boutiques b 
     JOIN users u ON u.id = ? 
     WHERE b.ownerId = u.id OR b.id IN (
       SELECT boutiqueId FROM boutiqueStaff WHERE userId = ?
     )
     LIMIT 1`,
    [userId, userId]
  );

  if (!boutiqueResult?.[0]) {
    return null;
  }

  const boutique = boutiqueResult[0];

  // Get boutique subscription
  const subscriptionResult = await db.query.raw(
    `SELECT * FROM boutiqueSubscriptions WHERE boutiqueId = ? LIMIT 1`,
    [boutique.id]
  );

  return {
    boutique,
    subscription: subscriptionResult?.[0] || null,
  };
}

/**
 * Validate if user's boutique has an active paid subscription
 */
export async function validateSubscription(
  userId: number
): Promise<SubscriptionValidationResult> {
  const db = await getDb();
  if (!db) {
    return {
      isValid: true,
      status: SubscriptionStatus.ACTIVE,
      reason: "Database unavailable - allowing access",
    };
  }

  // Get user's boutique subscription
  const boutiqueData = await getUserBoutiqueSubscription(userId);

  if (!boutiqueData) {
    return {
      isValid: false,
      status: SubscriptionStatus.INACTIVE,
      reason: "User is not associated with any boutique",
    };
  }

  const { boutique, subscription } = boutiqueData;

  // Check if boutique is active
  if (boutique.status !== "active") {
    return {
      isValid: false,
      status: SubscriptionStatus.SUSPENDED,
      boutiqueId: boutique.id,
      reason: `Boutique is ${boutique.status}`,
    };
  }

  // Check if subscription exists
  if (!subscription) {
    return {
      isValid: false,
      status: SubscriptionStatus.INACTIVE,
      boutiqueId: boutique.id,
      reason: "Boutique has no active subscription",
    };
  }

  // Check subscription status
  if (subscription.status !== "active") {
    return {
      isValid: false,
      status: subscription.status as SubscriptionStatus,
      boutiqueId: boutique.id,
      planName: subscription.planName,
      reason: `Subscription is ${subscription.status}`,
    };
  }

  // Check subscription expiration
  const now = new Date();
  const expiresAt = new Date(subscription.usagePeriodEnd + "T23:59:59Z");

  if (now > expiresAt && subscription.autoRenew === 0) {
    return {
      isValid: false,
      status: SubscriptionStatus.EXPIRED,
      boutiqueId: boutique.id,
      planName: subscription.planName,
      expiresAt: subscription.usagePeriodEnd,
      reason: "Subscription has expired",
    };
  }

  // Check if payment is up to date
  const paymentResult = await db.query.raw(
    `SELECT * FROM payments 
     WHERE boutiqueId = ? AND status = 'completed' 
     ORDER BY createdAt DESC LIMIT 1`,
    [boutique.id]
  );

  if (!paymentResult?.[0]) {
    return {
      isValid: false,
      status: SubscriptionStatus.INACTIVE,
      boutiqueId: boutique.id,
      planName: subscription.planName,
      reason: "No payment found for subscription",
    };
  }

  const lastPayment = paymentResult[0];
  const paymentDate = new Date(lastPayment.createdAt);
  const daysSincePayment = Math.floor(
    (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // For monthly subscriptions, check if payment is within 30 days
  if (
    subscription.billingCycle === "monthly" &&
    daysSincePayment > 30 &&
    subscription.autoRenew === 1
  ) {
    return {
      isValid: false,
      status: SubscriptionStatus.EXPIRED,
      boutiqueId: boutique.id,
      planName: subscription.planName,
      reason: "Monthly subscription payment is overdue",
    };
  }

  // For annual subscriptions, check if payment is within 365 days
  if (
    subscription.billingCycle === "annual" &&
    daysSincePayment > 365 &&
    subscription.autoRenew === 1
  ) {
    return {
      isValid: false,
      status: SubscriptionStatus.EXPIRED,
      boutiqueId: boutique.id,
      planName: subscription.planName,
      reason: "Annual subscription payment is overdue",
    };
  }

  // Subscription is valid
  return {
    isValid: true,
    status: SubscriptionStatus.ACTIVE,
    boutiqueId: boutique.id,
    planName: subscription.planName,
    expiresAt: subscription.usagePeriodEnd,
  };
}

/**
 * Enforce subscription check - throws error if subscription is invalid
 */
export async function enforceSubscriptionCheck(userId: number): Promise<void> {
  const validation = await validateSubscription(userId);

  if (!validation.isValid) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Cannot access try-on feature: ${validation.reason}. Please renew your subscription to continue.`,
    });
  }
}

/**
 * Get subscription details for user
 */
export async function getSubscriptionDetails(userId: number) {
  const validation = await validateSubscription(userId);
  const boutiqueData = await getUserBoutiqueSubscription(userId);

  return {
    validation,
    boutique: boutiqueData?.boutique,
    subscription: boutiqueData?.subscription,
  };
}

/**
 * Suspend boutique subscription (for non-payment)
 */
export async function suspendSubscription(boutiqueId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.query.raw(
    `UPDATE boutiqueSubscriptions SET status = 'suspended', updatedAt = NOW() WHERE boutiqueId = ?`,
    [boutiqueId]
  );
}

/**
 * Reactivate boutique subscription (after payment)
 */
export async function reactivateSubscription(boutiqueId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.query.raw(
    `UPDATE boutiqueSubscriptions SET status = 'active', updatedAt = NOW() WHERE boutiqueId = ?`,
    [boutiqueId]
  );
}

/**
 * Cancel boutique subscription
 */
export async function cancelSubscription(boutiqueId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.query.raw(
    `UPDATE boutiqueSubscriptions SET status = 'cancelled', autoRenew = 0, updatedAt = NOW() WHERE boutiqueId = ?`,
    [boutiqueId]
  );
}
