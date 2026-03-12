import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { validateWits100Coupon, applyWits100Coupon } from "../db.promotional";
import { z } from "zod";

export const promotionalRouter = router({
  /**
   * Validate coupon code (public - no auth required)
   * Returns: { isValid, creditsValue, message }
   */
  validateCoupon: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(({ input }) => {
      const creditsValue = validateWits100Coupon(input.code);
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
   * Apply WITS100 coupon code to current user
   * Returns: { success, creditsAdded, message }
   */
  applyCoupon: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate coupon first
        const creditsValue = validateWits100Coupon(input.code);
        if (creditsValue === 0) {
          return {
            success: false,
            creditsAdded: 0,
            message: "Invalid coupon code",
          };
        }

        // Apply the coupon
        const result = await applyWits100Coupon(ctx.user.id);
        return result;
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
