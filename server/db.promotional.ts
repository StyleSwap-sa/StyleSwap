import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { count, eq } from "drizzle-orm";
import { addCreditsAdmin } from "./db.credits";

/**
 * Promotional system for coupon codes
 * - WITS100 coupon code grants 2 credits (one-time use per user)
 * - No automatic promotional credits for new users
 */

const WITS100_COUPON_CODE = "WITS100";
const WITS100_CREDITS = 2;

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
 * Validate and apply WITS100 coupon code
 * Returns the credits amount if valid, 0 if invalid
 */
export function validateWits100Coupon(couponCode: string): number {
  if (!couponCode) return 0;
  
  // Case-insensitive comparison
  if (couponCode.toUpperCase() === WITS100_COUPON_CODE) {
    return WITS100_CREDITS;
  }
  
  return 0;
}

/**
 * Apply WITS100 coupon code to a user
 * Can be used during signup or anytime after
 */
export async function applyWits100Coupon(userId: number): Promise<{
  success: boolean;
  creditsAdded: number;
  message: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const creditsToAdd = WITS100_CREDITS;
    
    // Grant the credits
    await addCreditsAdmin(
      userId,
      creditsToAdd,
      `WITS100 coupon code: ${creditsToAdd} credits`
    );

    console.log(`[Coupon] ✓ Applied WITS100 coupon to user ${userId}. Added ${creditsToAdd} credits.`);

    return {
      success: true,
      creditsAdded: creditsToAdd,
      message: `Coupon WITS100 applied! You received ${creditsToAdd} credits.`,
    };
  } catch (error) {
    console.error("[Coupon] Failed to apply WITS100 coupon:", error);
    return {
      success: false,
      creditsAdded: 0,
      message: "Failed to apply coupon code. Please try again.",
    };
  }
}
