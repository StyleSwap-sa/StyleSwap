import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { savedOutfits, outfitLikes, outfitComments, userProfiles, users } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const globalRecommendationsRouter = router({
  getGlobalRecommendations: publicProcedure
  .input(
    z.object({
      limit: z.number().default(6),
      styleCategory: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
      const userId = ctx.user?.id;

      let query = db
        .select({
          id: savedOutfits.id,
          imageUrl: savedOutfits.watermarkedImageUrl,
          style: savedOutfits.style,
          description: savedOutfits.description,
          brand: savedOutfits.brand,
          likeCount: sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`,
          commentCount: sql<number>`(SELECT COUNT(*) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id})`,
          userName: users.name,
          userAvatar: userProfiles.avatar,
          createdAt: savedOutfits.createdAt,
        })
        .from(savedOutfits)
        .innerJoin(users, eq(savedOutfits.userId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(
          and(
            eq(savedOutfits.isFavorite, 1),
            userId ? ne(savedOutfits.userId, userId) : undefined,
            input.styleCategory ? eq(savedOutfits.style, input.styleCategory) : undefined
          )
        );

      // If user is authenticated, use collaborative filtering
      if (userId) {
        // Get user's liked styles
        const userLikedStyles = await db
          .selectDistinct({ style: savedOutfits.style })
          .from(savedOutfits)
          .innerJoin(outfitLikes, eq(savedOutfits.id, outfitLikes.outfitId))
          .where(eq(outfitLikes.userId, userId));

        const likedStyleList = userLikedStyles.map(s => s.style);

        if (likedStyleList.length > 0) {
          query = query.where(
            or(...likedStyleList.map(style => eq(savedOutfits.style, style)))
          );
        }
      }

      const results = await query
        .orderBy(
          desc(
            sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`
          )
        )
        .limit(input.limit);

      return {
        success: true,
        recommendations: results,
      };
    } catch (error) {
      console.error("[Global Recommendations] Error fetching recommendations:", error);
      return {
        success: false,
        error: "Failed to fetch recommendations",
        recommendations: [],
      };
    }
  }),

  getTrendingGlobalHashtags: publicProcedure
  .input(
    z.object({
      limit: z.number().default(10),
      timeRange: z.enum(["24h", "7d", "30d"]).default("7d"),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
      const timeRangeMs = 
        input.timeRange === "24h" ? 24 * 60 * 60 * 1000 :
        input.timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 :
        30 * 24 * 60 * 60 * 1000;

      const cutoffTime = new Date(Date.now() - timeRangeMs);

      // Get all outfits from time range
      const outfits = await db
        .select({
          id: savedOutfits.id,
          description: savedOutfits.description,
          style: savedOutfits.style,
        })
        .from(savedOutfits)
        .where(
          and(
            eq(savedOutfits.isFavorite, 1),
            sql`${savedOutfits.createdAt} >= ${cutoffTime}`
          )
        );

      // Extract and count hashtags
      const hashtagMap = new Map<string, number>();

      outfits.forEach(outfit => {
        // Extract from description
        const descriptionHashtags = (outfit.description || "").match(/#\w+/g) || [];
        descriptionHashtags.forEach(tag => {
          hashtagMap.set(tag.toLowerCase(), (hashtagMap.get(tag.toLowerCase()) || 0) + 1);
        });

        // Add style-based hashtag
        if (outfit.style) {
          const styleTag = `#${outfit.style.replace(/\s+/g, "")}`;
          hashtagMap.set(styleTag.toLowerCase(), (hashtagMap.get(styleTag.toLowerCase()) || 0) + 1);
        }
      });

      // Sort by frequency and return top hashtags
      const trendingHashtags = Array.from(hashtagMap.entries())
        .map(([tag, count]) => ({
          tag,
          count,
          trend: "up" as const,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, input.limit);

      return {
        success: true,
        hashtags: trendingHashtags,
      };
    } catch (error) {
      console.error("[Global Recommendations] Error fetching hashtags:", error);
      return {
        success: false,
        error: "Failed to fetch hashtags",
        hashtags: [],
      };
    }
  }),

  getStyleInspirations: publicProcedure
  .input(
    z.object({
      styleCategory: z.string(),
      limit: z.number().default(12),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
      const userId = ctx.user?.id;

      const inspirations = await db
        .select({
          id: savedOutfits.id,
          imageUrl: savedOutfits.watermarkedImageUrl,
          title: savedOutfits.title,
          style: savedOutfits.style,
          brand: savedOutfits.brand,
          userName: users.name,
          userAvatar: userProfiles.avatar,
          likeCount: sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`,
          isLiked: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id} AND ${outfitLikes.userId} = ${userId})` : sql<boolean>`false`,
        })
        .from(savedOutfits)
        .innerJoin(users, eq(savedOutfits.userId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(
          and(
            eq(savedOutfits.isFavorite, 1),
            eq(savedOutfits.style, input.styleCategory)
          )
        )
        .orderBy(
          desc(
            sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`
          )
        )
        .limit(input.limit);

      return {
        success: true,
        inspirations: inspirations,
      };
    } catch (error) {
      console.error("[Global Recommendations] Error fetching inspirations:", error);
      return {
        success: false,
        error: "Failed to fetch inspirations",
        inspirations: [],
      };
    }
  }),

  getInfluencerOutfits: publicProcedure
  .input(
    z.object({
      limit: z.number().default(12),
      timeRange: z.enum(["24h", "7d", "30d"]).default("7d"),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
      const userId = ctx.user?.id;
      const timeRangeMs = 
        input.timeRange === "24h" ? 24 * 60 * 60 * 1000 :
        input.timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 :
        30 * 24 * 60 * 60 * 1000;

      const cutoffTime = new Date(Date.now() - timeRangeMs);

      const influencerOutfits = await db
        .select({
          id: savedOutfits.id,
          imageUrl: savedOutfits.watermarkedImageUrl,
          title: savedOutfits.title,
          style: savedOutfits.style,
          userName: users.name,
          userAvatar: userProfiles.avatar,
          followerCount: userProfiles.followerCount,
          likeCount: sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`,
          isLiked: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id} AND ${outfitLikes.userId} = ${userId})` : sql<boolean>`false`,
        })
        .from(savedOutfits)
        .innerJoin(users, eq(savedOutfits.userId, users.id))
        .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(
          and(
            eq(savedOutfits.isFavorite, 1),
            eq(userProfiles.isInfluencer, 1),
            sql`${savedOutfits.createdAt} >= ${cutoffTime}`
          )
        )
        .orderBy(
          desc(
            sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`
          )
        )
        .limit(input.limit);

      return {
        success: true,
        outfits: influencerOutfits,
      };
    } catch (error) {
      console.error("[Global Recommendations] Error fetching influencer outfits:", error);
      return {
        success: false,
        error: "Failed to fetch influencer outfits",
        outfits: [],
      };
    }
  }),
});