import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  checkRateLimit,
  recordRequest,
  getUsageStats,
  getAllUsageStats,
} from "../rate-limiting";

export const monitoringRouter = router({
  /**
   * Check rate limit for an API key
   */
  checkRateLimit: publicProcedure
    .input(z.object({ apiKey: z.string(), status: z.string() }))
    .query(({ input }) => {
      const result = checkRateLimit(input.apiKey, input.status);
      return {
        success: true,
        ...result,
      };
    }),

  /**
   * Record an API request
   */
  recordRequest: publicProcedure
    .input(z.object({ apiKey: z.string(), endpoint: z.string() }))
    .mutation(({ input }) => {
      try {
        recordRequest(input.apiKey, input.endpoint);
        return {
          success: true,
          message: "Request recorded",
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get usage statistics for an API key
   */
  getUsageStats: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(({ input }) => {
      try {
        const stats = getUsageStats(input.apiKey);
        return {
          success: true,
          stats,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get all usage statistics (admin endpoint)
   */
  getAllUsageStats: publicProcedure.query(({ ctx }) => {
    try {
      // In production, verify admin role: if (ctx.user?.role !== 'admin') throw new Error('Forbidden');
      const stats = getAllUsageStats();
      return {
        success: true,
        stats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }),
});
