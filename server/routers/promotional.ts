import { publicProcedure, router } from "../_core/trpc";
import { getPromotionalStatus } from "../db.promotional";

export const promotionalRouter = router({
  /**
   * Get current promotional status
   * Returns: { isActive, spotsRemaining, totalSignups, message }
   */
  getStatus: publicProcedure.query(async () => {
    try {
      const status = await getPromotionalStatus();
      return {
        success: true,
        ...status,
      };
    } catch (error) {
      console.error("[Promotional] Failed to get promotional status:", error);
      return {
        success: false,
        isActive: false,
        spotsRemaining: 0,
        totalSignups: 0,
        message: "Unable to fetch promotional status",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),
});
