import { TRPCError } from "@trpc/server";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../db";
// ✅ Correct path (go up two levels from server/middleware to root)
import { boutiques, boutiqueSubscriptions } from "../../drizzle/schema";

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
 * Get user's boutique and subscription status
 */
export async function getUserBoutiqueSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    console.log("[Subscription] Looking for boutique with ownerId:", userId);
    
    // Get user's boutique using Drizzle
    const boutiqueResult = await db
      .select({
        id: boutiques.id,
        name: boutiques.name,
        status: boutiques.status,
      })
      .from(boutiques)
      .where(eq(boutiques.ownerId, userId))
      .limit(1);

    console.log("[Subscription] Boutique result:", boutiqueResult.length);

    if (!boutiqueResult.length) {
      return null;
    }

    const boutique = boutiqueResult[0];

    // Get boutique subscription using Drizzle
    const subscriptionResult = await db
      .select()
      .from(boutiqueSubscriptions)
      .where(eq(boutiqueSubscriptions.boutiqueId, boutique.id))
      .limit(1);

    console.log("[Subscription] Subscription found:", !!subscriptionResult[0]);

    return {
      boutique,
      subscription: subscriptionResult[0] || null,
    };
  } catch (error) {
    console.error("[Subscription] Error fetching boutique subscription:", error);
    return null;
  }
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

  // Note: Payment validation is optional. If you don't have a payments table yet,
  // you can skip this check or comment it out.

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

  await db
    .update(boutiqueSubscriptions)
    .set({ status: "suspended", updatedAt: new Date().toISOString() })
    .where(eq(boutiqueSubscriptions.boutiqueId, boutiqueId));
}

/**
 * Reactivate boutique subscription (after payment)
 */
export async function reactivateSubscription(boutiqueId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(boutiqueSubscriptions)
    .set({ status: "active", updatedAt: new Date().toISOString() })
    .where(eq(boutiqueSubscriptions.boutiqueId, boutiqueId));
}

/**
 * Cancel boutique subscription
 */
export async function cancelSubscription(boutiqueId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(boutiqueSubscriptions)
    .set({ status: "cancelled", autoRenew: 0, updatedAt: new Date().toISOString() })
    .where(eq(boutiqueSubscriptions.boutiqueId, boutiqueId));
}