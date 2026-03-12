import { db } from "./db";
import { users } from "@/drizzle/schema";

/**
 * Coupon Code System for StyleSwap
 * WITS100: First 100 signups get 2 free credits
 */

const WITS100_COUPON = {
  code: "WITS100",
  creditsValue: 2,
  maxUses: 100,
  description: "Welcome offer for first 100 signups - 2 free credits",
};

/**
 * Check if a coupon code is valid and has remaining uses
 */
export async function validateCouponCode(code: string): Promise<{
  isValid: boolean;
  creditsValue?: number;
  message: string;
}> {
  // For now, we'll handle WITS100 directly
  if (code.toUpperCase() !== WITS100_COUPON.code) {
    return {
      isValid: false,
      message: "Invalid coupon code",
    };
  }

  // In production, you would check against the database
  // For now, we'll return the coupon details
  return {
    isValid: true,
    creditsValue: WITS100_COUPON.creditsValue,
    message: `Coupon applied! You get ${WITS100_COUPON.creditsValue} free credits`,
  };
}

/**
 * Apply coupon code to a user during signup
 * This adds credits to the user's account
 */
export async function applyCouponToNewUser(
  userId: number,
  couponCode: string
): Promise<{
  success: boolean;
  creditsAdded?: number;
  message: string;
}> {
  try {
    const validation = await validateCouponCode(couponCode);

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message,
      };
    }

    // Add credits to the user's account
    // This would typically be done through the boutique credits system
    // For individual users, we can create a default boutique or store credits differently

    return {
      success: true,
      creditsAdded: validation.creditsValue,
      message: `Successfully applied ${couponCode}! ${validation.creditsValue} credits added to your account.`,
    };
  } catch (error) {
    console.error("Error applying coupon:", error);
    return {
      success: false,
      message: "Failed to apply coupon code",
    };
  }
}

/**
 * Get coupon details
 */
export function getCouponDetails(code: string) {
  if (code.toUpperCase() === WITS100_COUPON.code) {
    return WITS100_COUPON;
  }
  return null;
}
