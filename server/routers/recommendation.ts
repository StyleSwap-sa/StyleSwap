import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  recommendSize,
  analyzeBodyPhoto,
  getAvailableSizes,
  getSizeChart,
  BodyMeasurements,
  SizeRecommendation,
} from "../services/sizeRecommendation";

export const recommendationRouter = router({
  /**
   * Get size recommendation based on body measurements
   */
  getRecommendation: publicProcedure
    .input(
      z.object({
        shoulderWidth: z.number().min(20).max(60),
        chestWidth: z.number().min(20).max(80),
        waistWidth: z.number().min(15).max(70),
        hipWidth: z.number().min(20).max(80),
        height: z.number().min(140).max(220).optional(),
        clothingType: z.enum(["upper", "lower", "combo"]).default("combo"),
      })
    )
    .query(async ({ input }): Promise<SizeRecommendation> => {
      const measurements: BodyMeasurements = {
        shoulderWidth: input.shoulderWidth,
        chestWidth: input.chestWidth,
        waistWidth: input.waistWidth,
        hipWidth: input.hipWidth,
        height: input.height,
      };

      return recommendSize(measurements, input.clothingType);
    }),

  /**
   * Analyze body photo and get size recommendation
   */
  analyzePhoto: publicProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        clothingType: z.enum(["upper", "lower", "combo"]).default("combo"),
      })
    )
    .query(async ({ input }): Promise<SizeRecommendation | null> => {
      const measurements = await analyzeBodyPhoto(input.imageUrl);
      if (!measurements) {
        return null;
      }

      return recommendSize(measurements, input.clothingType);
    }),

  /**
   * Get all available sizes
   */
  getAvailableSizes: publicProcedure.query(async (): Promise<number[]> => {
    return getAvailableSizes();
  }),

  /**
   * Get size chart for reference
   */
  getSizeChart: publicProcedure.query(
    async (): Promise<Record<number, BodyMeasurements>> => {
      return getSizeChart();
    }
  ),
});
