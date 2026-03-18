import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { boutiques } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { requestInstantPayout, getInstantPayoutEligibility } from "../instant-payout";

export const instantPayoutRouter = router({
  /**
   * Request instant payout for boutique
   */
  requestInstantPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(100).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Get boutique
        const boutique = await db
          .select()
          .from(boutiques)
          .where(eq(boutiques.userId, ctx.user.id))
          .limit(1);

        if (boutique.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Boutique not found",
          });
        }

        const result = await requestInstantPayout({
          boutiqueId: boutique[0].id,
          amount: input.amount,
          requestedBy: ctx.user.id,
        });

        if (!result.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error || "Failed to request instant payout",
          });
        }

        return {
          payoutId: result.payoutId,
          amount: result.amount,
          fee: result.fee,
          netAmount: result.netAmount,
          message: "Instant payout requested successfully",
        };
      } catch (error) {
        console.error("[Instant Payout Router] Error requesting instant payout:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to request instant payout",
        });
      }
    }),

  /**
   * Check instant payout eligibility
   */
  getInstantPayoutEligibility: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      // Get boutique
      const boutique = await db
        .select()
        .from(boutiques)
        .where(eq(boutiques.userId, ctx.user.id))
        .limit(1);

      if (boutique.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      return await getInstantPayoutEligibility(boutique[0].id);
    } catch (error) {
      console.error("[Instant Payout Router] Error checking instant payout eligibility:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check instant payout eligibility",
      });
    }
  }),
});
