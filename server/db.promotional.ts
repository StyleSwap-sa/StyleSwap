import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { count, eq } from "drizzle-orm";
import { addCreditsAdmin } from "./db.credits";

/**
 * Promotional system for first 100 signups
 * - First 100 new users get 2 free try-ons (2 credits)
 * - After 100 signups, no promotional credits are given
 */

const PROMO_SIGNUP_LIMIT = 100;
const PROMO_CREDITS_AMOUNT = 2;

/**
 * Get the current total signup count
 */
export async function getTotalSignupCount(): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ count: count() })
    .from(users);

  return result[0]?.count || 0;
}

/**
 * Check if a user is eligible for promotional credits (first 100 signups)
 * Returns true if this is a new user AND we haven't reached 100 signups yet
 */
export async function isEligibleForPromoCredits(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the user
  const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (userRecord.length === 0) {
    return false;
  }

  const user = userRecord[0];

  // Check if user was just created (created within last 5 seconds)
  // This helps identify new users vs existing users logging in
  const createdAt = new Date(user.createdAt);
  const now = new Date();
  const timeDiffSeconds = (now.getTime() - createdAt.getTime()) / 1000;
  
  // If user was created more than 5 seconds ago, they're not new
  if (timeDiffSeconds > 5) {
    return false;
  }

  // Check if we're still within the 100 signup limit
  const totalSignups = await getTotalSignupCount();
  
  // We need to check if this user is within the first 100
  // Since they were just created, we check if total count <= 100
  return totalSignups <= PROMO_SIGNUP_LIMIT;
}

/**
 * Grant promotional credits to a new user (if eligible)
 * Called during OAuth callback for new users
 */
export async function grantPromotionalCredits(userId: number): Promise<{ granted: boolean; creditsAmount: number; totalSignups: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const totalSignups = await getTotalSignupCount();
    
    // Check if we're still within the promotional period
    if (totalSignups > PROMO_SIGNUP_LIMIT) {
      console.log(`[Promo] Signup limit (${PROMO_SIGNUP_LIMIT}) reached. No promotional credits granted.`);
      return {
        granted: false,
        creditsAmount: 0,
        totalSignups,
      };
    }

    // Grant promotional credits
    await addCreditsAdmin(
      userId,
      PROMO_CREDITS_AMOUNT,
      `Promotional signup bonus: First 100 users get ${PROMO_CREDITS_AMOUNT} free try-ons`
    );

    console.log(`[Promo] ✓ Granted ${PROMO_CREDITS_AMOUNT} promotional credits to user ${userId}. Total signups: ${totalSignups}/${PROMO_SIGNUP_LIMIT}`);

    return {
      granted: true,
      creditsAmount: PROMO_CREDITS_AMOUNT,
      totalSignups,
    };
  } catch (error) {
    console.error("[Promo] Failed to grant promotional credits:", error);
    return {
      granted: false,
      creditsAmount: 0,
      totalSignups: await getTotalSignupCount(),
    };
  }
}

/**
 * Get promotional status for display in UI
 */
export async function getPromotionalStatus(): Promise<{
  isActive: boolean;
  spotsRemaining: number;
  totalSignups: number;
  message: string;
}> {
  const totalSignups = await getTotalSignupCount();
  const spotsRemaining = Math.max(0, PROMO_SIGNUP_LIMIT - totalSignups);
  const isActive = spotsRemaining > 0;

  let message = "";
  if (isActive) {
    if (spotsRemaining <= 10) {
      message = `🔥 Only ${spotsRemaining} spots left! First 100 users get 2 free try-ons.`;
    } else {
      message = `✨ Get 2 free try-ons! Limited to first 100 users. ${spotsRemaining} spots remaining.`;
    }
  } else {
    message = "Promotional offer has ended. Thank you for your interest!";
  }

  return {
    isActive,
    spotsRemaining,
    totalSignups,
    message,
  };
}
