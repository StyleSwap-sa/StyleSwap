import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { outfitDiscoveryFeed, outfitLikes, outfitReports } from "../../drizzle/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const discoveryRouter = router({
  // Publish outfit to discovery feed
  publishToFeed: protectedProcedure
    .input(
      z.object({
        outfitId: z.number(),
        imageUrl: z.string().url(),
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [outfit] = await ctx.db
          .insert(outfitDiscoveryFeed)
          .values({
            outfitId: input.outfitId,
            userId: ctx.user.id,
            imageUrl: input.imageUrl,
            title: input.title,
            description: input.description,
            tags: input.tags ? JSON.stringify(input.tags) : null,
            isPublic: true,
          })
          .returning();

        return outfit;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to publish outfit to feed",
        });
      }
    }),

  // Get discovery feed (paginated)
  getFeed: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        sortBy: z.enum(["recent", "popular", "trending"]).default("recent"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const offset = (input.page - 1) * input.limit;

        let query = ctx.db
          .select()
          .from(outfitDiscoveryFeed)
          .where(eq(outfitDiscoveryFeed.isPublic, true));

        // Apply sorting
        if (input.sortBy === "recent") {
          query = query.orderBy(desc(outfitDiscoveryFeed.createdAt));
        } else if (input.sortBy === "popular") {
          query = query.orderBy(desc(outfitDiscoveryFeed.likes));
        } else if (input.sortBy === "trending") {
          // Trending: combination of recent + likes
          query = query.orderBy(
            desc(
              sql`${outfitDiscoveryFeed.likes} + (EXTRACT(EPOCH FROM (NOW() - ${outfitDiscoveryFeed.createdAt})) / 3600)`
            )
          );
        }

        const outfits = await query.limit(input.limit).offset(offset);

        // Get total count
        const totalResult = await ctx.db
          .select({ count: count() })
          .from(outfitDiscoveryFeed)
          .where(eq(outfitDiscoveryFeed.isPublic, true));

        const total = totalResult[0]?.count || 0;

        // Get user's likes for these outfits
        const userLikes = await ctx.db
          .select({ outfitId: outfitLikes.outfitId })
          .from(outfitLikes)
          .where(eq(outfitLikes.userId, ctx.user.id));

        const likedOutfitIds = new Set(userLikes.map((like) => like.outfitId));

        return {
          outfits: outfits.map((outfit) => ({
            ...outfit,
            isLiked: likedOutfitIds.has(outfit.id),
            tags: outfit.tags ? JSON.parse(outfit.tags) : [],
          })),
          total,
          page: input.page,
          pages: Math.ceil(total / input.limit),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch feed",
        });
      }
    }),

  // Like an outfit
  likeOutfit: protectedProcedure
    .input(z.object({ outfitId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if outfit exists
        const outfit = await ctx.db
          .select()
          .from(outfitDiscoveryFeed)
          .where(eq(outfitDiscoveryFeed.id, input.outfitId));

        if (!outfit.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Outfit not found",
          });
        }

        // Check if already liked
        const existingLike = await ctx.db
          .select()
          .from(outfitLikes)
          .where(
            and(
              eq(outfitLikes.outfitId, input.outfitId),
              eq(outfitLikes.userId, ctx.user.id)
            )
          );

        if (existingLike.length) {
          // Unlike
          await ctx.db
            .delete(outfitLikes)
            .where(
              and(
                eq(outfitLikes.outfitId, input.outfitId),
                eq(outfitLikes.userId, ctx.user.id)
              )
            );

          // Decrement likes
          await ctx.db
            .update(outfitDiscoveryFeed)
            .set({ likes: Math.max(0, outfit[0].likes! - 1) })
            .where(eq(outfitDiscoveryFeed.id, input.outfitId));

          return { liked: false };
        } else {
          // Like
          await ctx.db.insert(outfitLikes).values({
            outfitId: input.outfitId,
            userId: ctx.user.id,
          });

          // Increment likes
          await ctx.db
            .update(outfitDiscoveryFeed)
            .set({ likes: outfit[0].likes! + 1 })
            .where(eq(outfitDiscoveryFeed.id, input.outfitId));

          return { liked: true };
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to like outfit",
        });
      }
    }),

  // Report an outfit
  reportOutfit: protectedProcedure
    .input(
      z.object({
        outfitId: z.number(),
        reason: z.string().min(1, "Reason is required"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [report] = await ctx.db
          .insert(outfitReports)
          .values({
            outfitId: input.outfitId,
            reportedBy: ctx.user.id,
            reason: input.reason,
            description: input.description,
            status: "pending",
          })
          .returning();

        return report;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to report outfit",
        });
      }
    }),

  // Get user's published outfits
  getUserOutfits: protectedProcedure.query(async ({ ctx }) => {
    try {
      const outfits = await ctx.db
        .select()
        .from(outfitDiscoveryFeed)
        .where(eq(outfitDiscoveryFeed.userId, ctx.user.id))
        .orderBy(desc(outfitDiscoveryFeed.createdAt));

      return outfits.map((outfit) => ({
        ...outfit,
        tags: outfit.tags ? JSON.parse(outfit.tags) : [],
      }));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user outfits",
      });
    }
  }),

  // Search outfits by tag
  searchByTag: protectedProcedure
    .input(
      z.object({
        tag: z.string().min(1),
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const offset = (input.page - 1) * input.limit;

        // Note: This is a simplified search. For production, consider using full-text search
        const outfits = await ctx.db
          .select()
          .from(outfitDiscoveryFeed)
          .where(
            and(
              eq(outfitDiscoveryFeed.isPublic, true),
              sql`${outfitDiscoveryFeed.tags} ILIKE ${'%' + input.tag + '%'}`
            )
          )
          .orderBy(desc(outfitDiscoveryFeed.createdAt))
          .limit(input.limit)
          .offset(offset);

        return outfits.map((outfit) => ({
          ...outfit,
          tags: outfit.tags ? JSON.parse(outfit.tags) : [],
        }));
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search outfits",
        });
      }
    }),
});
