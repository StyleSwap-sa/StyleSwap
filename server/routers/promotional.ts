import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { validateCouponCode, applyCouponCode } from "../db.promotional";
import { z } from "zod";

export const promotionalRouter = router({
  /**
   * Validate coupon code (public - no auth required)
   * Returns: { isValid, creditsValue, message }
   */
  validateCoupon: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(({ input }) => {
      const creditsValue = validateCouponCode(input.code);
      const isValid = creditsValue > 0;

      return {
        isValid,
        creditsValue,
        message: isValid
          ? `Valid coupon! You will receive ${creditsValue} credits.`
          : "Invalid coupon code",
      };
    }),

  /**
   * Apply a coupon code to the current user.
   * Returns: { success, creditsAdded, message }
   */
  applyCoupon: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await applyCouponCode(ctx.user.id, input.code);
      } catch (error) {
        console.error("[Promotional] Failed to apply coupon:", error);
        return {
          success: false,
          creditsAdded: 0,
          message: "Failed to apply coupon code. Please try again.",
        };
      }
    }),
});