import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getActiveGarments, getGarmentById } from "../db";

export const garmentsRouter = router({
  /**
   * Get all active garments for catalog display
   */
  getAll: publicProcedure.query(async () => {
    const garments = await getActiveGarments();
    return garments || [];
  }),

  /**
   * Get a specific garment by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const garment = await getGarmentById(input.id);
      if (!garment) {
        throw new Error("Garment not found");
      }
      return garment;
    }),

  /**
   * Get garments by category
   */
  getByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const garments = await getActiveGarments();
      return garments?.filter(g => g.category === input.category) || [];
    }),
});
