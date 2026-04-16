import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { createPaymentIntent } from "../yoko-payment";
import { TRPCError } from "@trpc/server";
import {
  CREDIT_TIERS,
  getCreditTier,
  calculateCreditPrice,
  createCreditPurchase,
  completeCreditPurchase,
  getCreditBalance,
  getBillingHistory,
  getMonthlyUsageStats,
  getTotalSpending,
  getTotalCreditsPurchased,
  getTotalCreditsUsed,
  areCreditExpired,
  getCreditExpirationDate,
} from "../db.billing";
import { getBoutiqueUserRole, getBoutiqueById } from "../db.boutiques";

/**
 * Billing & Credit Management Router
 * Handles credit purchases, usage tracking, and billing
 */

export const billingRouter = router({
  /**
   * Get all available credit tiers
   */
  getCreditTiers: protectedProcedure.query(async () => {
    return CREDIT_TIERS;
  }),

  /**
   * Get credit balance for a boutique
   */
  getCreditBalance: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      const balance = await getCreditBalance(input.boutiqueId);
      if (!balance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credit record not found",
        });
      }

      const expirationDate = getCreditExpirationDate(balance.createdAt);
      const isExpired = areCreditExpired(balance.createdAt);

      return {
        ...balance,
        expirationDate,
        isExpired,
        daysUntilExpiration: expirationDate
          ? Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    }),

  /**
   * Initiate credit purchase
   */
  initiatePurchase: protectedProcedure
  .input(
    z.object({
      boutiqueId: z.number().optional(), // Make optional for customers
      creditAmount: z.number(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { creditAmount, boutiqueId } = input;
    const userId = ctx.user.id;

    // Validate credit tier
    const tier = getCreditTier(creditAmount);
    if (!tier) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid credit amount`,
      });
    }

    const baseUrl = ENV.oAuthPortalUrl || "http://localhost:3000";

    // Create payment intent using existing function
    const paymentIntent = await createPaymentIntent({
      userId,
      packageId: `pkg_${creditAmount}_credits`,
      userEmail: ctx.user.email || "",
      userName: ctx.user.name || "Customer",
      successUrl: `${baseUrl}/dashboard?payment=success&credits=${creditAmount}`,
      cancelUrl: `${baseUrl}/dashboard?payment=cancelled`,
    });

    // If boutiqueId exists, create a pending transaction record
    if (boutiqueId) {
      await createCreditPurchase({
        boutiqueId,
        credits: creditAmount,
        price: tier.price,
        currency: "ZAR",
        initiatedBy: userId,
        status: "pending",
      });
    }

    return {
      credits: creditAmount,
      price: tier.price,
      currency: "ZAR",
      pricePerCredit: tier.pricePerCredit,
      paymentUrl: paymentIntent.checkoutUrl,
    };
  }),

  /**
   * Complete credit purchase (after payment confirmation)
   */
  completePurchase: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        transactionId: z.number(),
        credits: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization - admin only
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can complete purchases",
        });
      }

      // Verify boutique exists
      const boutique = await getBoutiqueById(input.boutiqueId);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      // Complete purchase
      const result = await completeCreditPurchase(input.boutiqueId, input.credits, input.transactionId);

      return {
        success: true,
        totalCredits: result.totalCredits,
        remainingCredits: result.remainingCredits,
        message: `Successfully added ${input.credits} credits to boutique`,
      };
    }),

  /**
   * Get billing history for a boutique
   */
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        type: z.enum(["purchase", "usage", "refund"]).optional(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      return await getBillingHistory(input.boutiqueId, input.type, input.limit);
    }),

  /**
   * Get monthly usage statistics
   */
  getMonthlyUsageStats: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        monthsBack: z.number().optional().default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      return await getMonthlyUsageStats(input.boutiqueId, input.monthsBack);
    }),

  /**
   * Get billing summary for a boutique
   */
  getBillingSummary: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      const balance = await getCreditBalance(input.boutiqueId);
      const totalSpending = await getTotalSpending(input.boutiqueId);
      const totalPurchased = await getTotalCreditsPurchased(input.boutiqueId);
      const totalUsed = await getTotalCreditsUsed(input.boutiqueId);

      return {
        currentBalance: balance?.remainingCredits || 0,
        totalCreditsEverPurchased: totalPurchased,
        totalCreditsUsed: totalUsed,
        totalSpending,
        averageCostPerCredit: totalPurchased > 0 ? (totalSpending / totalPurchased).toFixed(2) : 0,
        expirationDate: getCreditExpirationDate(balance?.createdAt || null),
        isExpired: areCreditExpired(balance?.createdAt || null),
      };
    }),

  /**
   * Admin: Get all pending purchases
   */
  getPendingPurchases: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view pending purchases",
      });
    }

    // This would require a more complex query to get all pending purchases
    // For now, returning empty array
    return [];
  }),

  /**
   * Admin: Refund credits
   */
  refundCredits: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        credits: z.number().positive(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can refund credits",
        });
      }

      // Verify boutique exists
      const boutique = await getBoutiqueById(input.boutiqueId);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      // Add credits back (refund)
      const result = await completeCreditPurchase(input.boutiqueId, input.credits);

      return {
        success: true,
        totalCredits: result.totalCredits,
        remainingCredits: result.remainingCredits,
        message: `Refunded ${input.credits} credits to boutique`,
      };
    }),
});
