import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  saveSizeReview,
  getSizeRecommendations,
  getReviewsForSize,
  updateCustomerPreferences,
  getCustomerPreferences,
  markReviewHelpful,
  markReviewUnhelpful,
  getSizeFitStats,
} from "../services/sizeReviewsService";

export const sizeReviewsRouter = router({
  /**
   * Save a size review from a customer
   */
  saveReview: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        tryOnResultId: z.number().optional(),
        clothingType: z.string(),
        selectedSize: z.number(),
        bodySize: z.number(),
        fitRating: z.enum(["tight", "perfect", "loose"]),
        helpfulnessRating: z.number().optional(),
        reviewText: z.string().optional(),
        recommendedSize: z.number().optional(),
        bodyType: z.string().optional(),
        height: z.string().optional(),
        weight: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await saveSizeReview({
        userId: ctx.user.id,
        ...input,
      });
    }),

  /**
   * Get size recommendations for a body size and clothing type
   */
  getRecommendations: publicProcedure
    .input(
      z.object({
        bodySize: z.number(),
        clothingType: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await getSizeRecommendations(input.bodySize, input.clothingType);
    }),

  /**
   * Get reviews for a specific size
   */
  getReviewsForSize: publicProcedure
    .input(
      z.object({
        clothingType: z.string(),
        selectedSize: z.number(),
        limit: z.number().optional().default(5),
      })
    )
    .query(async ({ input }) => {
      return await getReviewsForSize(
        input.clothingType,
        input.selectedSize,
        input.limit
      );
    }),

  /**
   * Update customer size preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        bodySize: z.number(),
        clothingType: z.string(),
        preferences: z.object({
          preferredSize: z.number().optional(),
          bodyType: z.string().optional(),
          height: z.string().optional(),
          weight: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await updateCustomerPreferences(
        ctx.user.id,
        input.boutiqueId,
        input.bodySize,
        input.clothingType,
        input.preferences
      );
      return { success: true };
    }),

  /**
   * Get customer's saved preferences
   */
  getPreferences: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        clothingType: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await getCustomerPreferences(
        ctx.user.id,
        input.boutiqueId,
        input.clothingType
      );
    }),

  /**
   * Mark a review as helpful
   */
  markHelpful: publicProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      await markReviewHelpful(input.reviewId);
      return { success: true };
    }),

  /**
   * Mark a review as unhelpful
   */
  markUnhelpful: publicProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      await markReviewUnhelpful(input.reviewId);
      return { success: true };
    }),

  /**
   * Get fit statistics for a size
   */
  getSizeFitStats: publicProcedure
    .input(
      z.object({
        clothingType: z.string(),
        selectedSize: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getSizeFitStats(input.clothingType, input.selectedSize);
    }),
});
