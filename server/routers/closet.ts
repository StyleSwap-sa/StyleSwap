import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { savedOutfits, tryOnResults } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const closetRouter = router({
  // Save try-on image to closet
  saveToCloset: protectedProcedure
    .input(
      z.object({
        tryOnResultId: z.number(),
        title: z.string().min(1, "Title is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the try-on result
        const tryOnResult = await ctx.db
          .select()
          .from(tryOnResults)
          .where(eq(tryOnResults.id, input.tryOnResultId));

        if (!tryOnResult.length || tryOnResult[0].userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to save this try-on",
          });
        }

        if (!tryOnResult[0].resultImageUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Try-on result image not found",
          });
        }

        // Save to closet (use result image URL directly with watermark added on frontend)
        const [savedOutfit] = await ctx.db
          .insert(savedOutfits)
          .values({
            userId: ctx.user.id,
            tryOnResultId: input.tryOnResultId,
            title: input.title,
            description: "",
            watermarkedImageUrl: tryOnResult[0].resultImageUrl,
            isFavorite: 0,
            shareCount: 0,
          })
          .returning();

        return {
          success: true,
          outfit: savedOutfit,
          message: "Outfit saved to your closet!",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error saving outfit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save outfit",
        });
      }
    }),

  // Get all saved outfits for user
  getClosetOutfits: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const outfits = await ctx.db
          .select()
          .from(savedOutfits)
          .where(eq(savedOutfits.userId, ctx.user.id))
          .orderBy(desc(savedOutfits.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          outfits,
          count: outfits.length,
        };
      } catch (error) {
        console.error("Error fetching closet outfits:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch closet outfits",
        });
      }
    }),

  // Delete saved outfit from closet
  deleteFromCloset: protectedProcedure
    .input(z.object({ outfitId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership
        const outfit = await ctx.db
          .select()
          .from(savedOutfits)
          .where(eq(savedOutfits.id, input.outfitId));

        if (!outfit.length || outfit[0].userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this outfit",
          });
        }

        await ctx.db
          .delete(savedOutfits)
          .where(eq(savedOutfits.id, input.outfitId));

        return {
          success: true,
          message: "Outfit deleted from closet",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error deleting outfit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete outfit",
        });
      }
    }),

  // Check if try-on is already saved
  isOutfitSaved: protectedProcedure
    .input(z.object({ tryOnResultId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const outfit = await ctx.db
          .select()
          .from(savedOutfits)
          .where(
            eq(savedOutfits.userId, ctx.user.id) &&
              eq(savedOutfits.tryOnResultId, input.tryOnResultId)
          );

        return {
          success: true,
          isSaved: outfit.length > 0,
          outfit: outfit[0] || null,
        };
      } catch (error) {
        console.error("Error checking if outfit is saved:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check outfit status",
        });
      }
    }),
});
