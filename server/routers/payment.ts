import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createPaymentIntent,
  getPaymentPackage,
  getAllPaymentPackages,
  handlePaymentSuccess,
} from "../yoko-payment";
import { TRPCError } from "@trpc/server";

export const paymentRouter = router({
  /**
   * Get all available payment packages
   */
  getPackages: publicProcedure.query(async () => {
    try {
      const packages = getAllPaymentPackages();
      return packages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        credits: pkg.credits,
        price: pkg.price / 100, // Convert cents to ZAR
        currency: pkg.currency,
        description: pkg.description,
      }));
    } catch (error) {
      console.error("[Payment Router] Error fetching packages:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch payment packages",
      });
    }
  }),

  /**
   * Create a payment intent for checkout
   */
  createCheckout: protectedProcedure
    .input(
      z.object({
        packageId: z.string(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        const pkg = getPaymentPackage(input.packageId);
        if (!pkg) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment package not found",
          });
        }

        const paymentIntent = await createPaymentIntent({
          userId: ctx.user.id,
          packageId: input.packageId,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name || "User",
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        });

        // Generate checkout URL from payment intent
        const checkoutUrl = paymentIntent.checkoutUrl || `https://checkout.yoko.com/${paymentIntent.id}`;
        
        return {
          id: paymentIntent.id,
          clientSecret: paymentIntent.clientSecret,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          packageId: input.packageId,
          credits: pkg.credits,
          checkoutUrl: checkoutUrl,
        };
      } catch (error) {
        console.error("[Payment Router] Error creating checkout:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create checkout",
        });
      }
    }),

  /**
   * Confirm payment success
   */
  confirmPayment: protectedProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        packageId: z.string(),
        credits: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        await handlePaymentSuccess(input.paymentIntentId, {
          userId: ctx.user.id.toString(),
          packageId: input.packageId,
          credits: input.credits,
        });

        return {
          success: true,
          message: `Successfully purchased ${input.credits} try-on credits`,
        };
      } catch (error) {
        console.error("[Payment Router] Error confirming payment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to confirm payment",
        });
      }
    }),
});
