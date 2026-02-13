import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createPaymentIntent,
  getPaymentPackage,
  getAllPaymentPackages,
  handlePaymentSuccess,
} from "../yoko-payment";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
        phoneNumber: z.string().optional(),
        amount: z.number().optional(), // Custom amount for annual billing (10% discount)
        billingPeriod: z.enum(['monthly', 'annual']).optional(), // Track billing period
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

        // Store phone number if provided
        if (input.phoneNumber) {
          const db = await getDb();
          if (db) {
            await db
              .update(users)
              .set({ phone: input.phoneNumber })
              .where(eq(users.id, ctx.user.id));
          }
        }

        // Use custom amount if provided (for annual billing with discount)
        const finalAmount = input.amount ? Math.round(input.amount * 100) : pkg.price;
        
        const paymentIntent = await createPaymentIntent({
          userId: ctx.user.id,
          packageId: input.packageId,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name || "User",
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
          amount: finalAmount, // Pass custom amount
          billingPeriod: input.billingPeriod || 'monthly', // Track billing period
        });

        // Generate checkout URL from payment intent
        const checkoutUrl = paymentIntent.checkoutUrl || `https://checkout.yoco.com/${paymentIntent.id}`;
        
        return {
          id: paymentIntent.id,
          clientSecret: paymentIntent.clientSecret,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          packageId: input.packageId,
          credits: pkg.credits,
          checkoutUrl: checkoutUrl,
          billingPeriod: input.billingPeriod || 'monthly',
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
