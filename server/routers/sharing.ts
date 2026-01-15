import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getUserTryOnResults, getTryOnResultByShareToken, incrementShareCount, createTryOnResult } from "../db";
import { nanoid } from "nanoid";

export const sharingRouter = router({
  /**
   * Get user's try-on history
   */
  getUserResults: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const results = await getUserTryOnResults(ctx.user.id, input.limit || 20);
      return results || [];
    }),

  /**
   * Get a public try-on result by share token
   */
  getPublicResult: publicProcedure
    .input(z.object({ shareToken: z.string() }))
    .query(async ({ input }) => {
      const result = await getTryOnResultByShareToken(input.shareToken);
      if (!result || !result.isPublic) {
        throw new Error("Share not found or not public");
      }
      return result;
    }),

  /**
   * Make a try-on result public and shareable
   */
  makePublic: protectedProcedure
    .input(z.object({ tryOnResultId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // In a real app, verify ownership here
      const shareToken = nanoid(12);
      // This would update the database in a real implementation
      return { shareToken, shareUrl: `/share/${shareToken}` };
    }),

  /**
   * Track share event
   */
  trackShare: publicProcedure
    .input(z.object({ shareToken: z.string(), platform: z.string() }))
    .mutation(async ({ input }) => {
      const result = await getTryOnResultByShareToken(input.shareToken);
      if (result) {
        await incrementShareCount(result.id);
      }
      return { success: true };
    }),
});
