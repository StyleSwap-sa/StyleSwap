import { eq, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { userCredits, couponRedemptions } from "../drizzle/schema";

/**
 * Influencer launch codes.
 * Each code maps to a fixed number of credits. Add/remove codes here only —
 * nothing else needs to change to add a new code later.
 */
const COUPON_CODES: Record<string, number> = {
  STYLE5: 5,
  STYLE10: 10,
  STYLE15: 15,
  STYLE20: 20,
  STYLE25: 25,
  STYLE30: 30,
};

/**
 * Returns the credit value of a code, or 0 if it isn't a recognized code.
 */
export function validateCouponCode(rawCode: string): number {
  const code = rawCode.trim().toUpperCase();
  return COUPON_CODES[code] ?? 0;
}

/**
 * Redeems a coupon code for a user. Safe to call concurrently for the same
 * user/code — the unique index on (userId, code) is the actual guarantee;
 * everything else here just produces a friendly message in the common case.
 */
export async function applyCouponCode(
  userId: number,
  rawCode: string
): Promise<{ success: boolean; creditsAdded: number; message: string }> {
  const code = rawCode.trim().toUpperCase();
  const creditsValue = COUPON_CODES[code];

  if (!creditsValue) {
    return { success: false, creditsAdded: 0, message: "Invalid coupon code" };
  }

  const db = await getDb();
  if (!db) {
    return {
      success: false,
      creditsAdded: 0,
      message: "Service temporarily unavailable. Please try again shortly.",
    };
  }

  try {
    const alreadyUsed = await db.transaction(async (tx) => {
      // Friendly pre-check (not the safety guarantee — see catch block below
      // for the real, race-safe enforcement via the unique index).
      const existing = await tx
        .select({ id: couponRedemptions.id })
        .from(couponRedemptions)
        .where(
          and(eq(couponRedemptions.userId, userId), eq(couponRedemptions.code, code))
        );

      if (existing.length > 0) {
        return true;
      }

      // This insert is what actually enforces "once per user per code":
      // if two requests race, the unique index rejects the second one and
      // we catch that below as a 23505 (unique_violation).
      await tx.insert(couponRedemptions).values({
        userId,
        code,
        creditsAdded: creditsValue,
      });

      const existingCredits = await tx
        .select({ id: userCredits.id })
        .from(userCredits)
        .where(eq(userCredits.userId, userId));

      if (existingCredits.length === 0) {
        await tx.insert(userCredits).values({
          userId,
          totalCredits: creditsValue,
          usedCredits: 0,
          remainingCredits: creditsValue,
        });
      } else {
        await tx
          .update(userCredits)
          .set({
            totalCredits: sql`${userCredits.totalCredits} + ${creditsValue}`,
            remainingCredits: sql`${userCredits.remainingCredits} + ${creditsValue}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(userCredits.userId, userId));
      }

      return false;
    });

    if (alreadyUsed) {
      return {
        success: false,
        creditsAdded: 0,
        message: "You've already used this coupon code",
      };
    }

    return {
      success: true,
      creditsAdded: creditsValue,
      message: `Success! ${creditsValue} credits added to your account.`,
    };
  } catch (error: any) {
    // Unique violation on (userId, code): two requests redeemed at once.
    if (error?.code === "23505") {
      return {
        success: false,
        creditsAdded: 0,
        message: "You've already used this coupon code",
      };
    }
    console.error("[Promotional] applyCouponCode error:", error);
    return {
      success: false,
      creditsAdded: 0,
      message: "Failed to apply coupon code. Please try again.",
    };
  }
}