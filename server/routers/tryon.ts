import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getFitroomClient } from "../_core/fitroom";
import { deductCredits, getUserCredits } from "../db.credits";
import { TRPCError } from "@trpc/server";

export const tryonRouter = router({
  /**
   * Get user's current credit balance
   */
  getCredits: protectedProcedure.query(async ({ ctx }) => {
    const credits = await getUserCredits(ctx.user.id);
    return {
      totalCredits: credits.totalCredits,
      usedCredits: credits.usedCredits,
      remainingCredits: credits.remainingCredits,
      expiresAt: credits.expiresAt,
    };
  }),

  /**
   * Create a virtual try-on
   * Requires: user image (base64), garment image (base64)
   * Deducts 1 credit from user account
   */
  createTryOn: protectedProcedure
    .input(
      z.object({
        userImage: z.string().describe("Base64 encoded user image"),
        garmentImage: z.string().describe("Base64 encoded garment image"),
        garmentDescription: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check user has credits
        const credits = await getUserCredits(ctx.user.id);
        if (credits.remainingCredits < 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Insufficient credits. Please purchase more try-ons.",
          });
        }

        // Call Fitroom API
        const fitroomClient = getFitroomClient();
        const result = await fitroomClient.createTryOn({
          userImage: input.userImage,
          garmentImage: input.garmentImage,
          garmentDescription: input.garmentDescription,
        });

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Virtual try-on failed: ${result.error}`,
          });
        }

        // Deduct credit from user account
        const updatedCredits = await deductCredits(ctx.user.id, 1);

        return {
          success: true,
          resultImage: result.resultImage,
          requestId: result.requestId,
          remainingCredits: updatedCredits.remainingCredits,
        };
      } catch (error) {
        console.error("[Try-On Error]", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create virtual try-on",
        });
      }
    }),

  /**
   * Get user's transaction history
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { getUserTransactions } = await import("../db.credits");
      return await getUserTransactions(ctx.user.id, input.limit);
    }),
});
