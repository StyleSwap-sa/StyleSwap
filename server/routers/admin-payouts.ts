import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getFailedPayouts,
  getPendingPayouts,
  retryFailedPayouts,
  processPendingPayouts,
  getPayoutStatistics,
} from "../bulk-payout-manager";

/**
 * Admin Payout Management Router
 * Bulk payout operations and failed payout recovery
 */

export const adminPayoutsRouter = router({
  /**
   * Get payout statistics
   */
  getPayoutStatistics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view payout statistics",
      });
    }

    const stats = await getPayoutStatistics();
    if (!stats) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch payout statistics",
      });
    }

    return stats;
  }),

  /**
   * Get failed payouts for recovery
   */
  getFailedPayouts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view failed payouts",
        });
      }

      const payouts = await getFailedPayouts(input.limit);
      if (!payouts) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch failed payouts",
        });
      }

      return payouts;
    }),

  /**
   * Get pending payouts
   */
  getPendingPayouts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(500).default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view pending payouts",
        });
      }

      const payouts = await getPendingPayouts(input.limit);
      if (!payouts) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pending payouts",
        });
      }

      return payouts;
    }),

  /**
   * Retry failed payouts
   */
  retryFailedPayouts: protectedProcedure
    .input(
      z.object({
        payoutIds: z.array(z.string()).min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can retry payouts",
        });
      }

      try {
        const result = await retryFailedPayouts(input.payoutIds, ctx.user.id);
        return result;
      } catch (error) {
        console.error("[Admin Payouts Router] Error retrying payouts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retry payouts",
        });
      }
    }),

  /**
   * Process all pending payouts
   */
  processPendingPayouts: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can process payouts",
      });
    }

    try {
      const result = await processPendingPayouts(ctx.user.id);
      return result;
    } catch (error) {
      console.error("[Admin Payouts Router] Error processing pending payouts:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to process pending payouts",
      });
    }
  }),
});
