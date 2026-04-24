import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { savedOutfits, outfitLikes, outfitComments, userFollows, userProfiles, users } from "../../drizzle/schema";
import { eq, and, desc, sql, or, isNotNull, ne} from "drizzle-orm";

export const globalFeedRouter = router({
  // Get global feed
  getGlobalFeed: publicProcedure
  .input(z.object({
    limit: z.number().default(20),
    offset: z.number().default(0),
    sortBy: z.enum(["latest", "trending", "mostLiked", "mostCommented"]).default("latest"),
    styleCategory: z.string().optional(),
    country: z.string().optional(),
    searchQuery: z.string().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const db = await getDb();  // ← ADD THIS LINE
    if (!db) return { success: false, outfits: [], count: 0, error: "Database not available" };
    
    try {
      const userId = ctx.user?.id;
      console.log("[Global Feed] User ID:", userId); // 👈 Debug log

      const filterConditions: any[] = [
        eq(savedOutfits.isFavorite, 1),
        userId ? ne(savedOutfits.userId, userId) : undefined,
      ];

      if (input.styleCategory) {
        filterConditions.push(eq(savedOutfits.style, input.styleCategory));
      }

      if (input.country) {
        filterConditions.push(eq(users.country, input.country));
      }

      if (input.searchQuery) {
        filterConditions.push(
          or(
            sql`${savedOutfits.title} LIKE ${`%${input.searchQuery}%`}`,
            sql`${savedOutfits.description} LIKE ${`%${input.searchQuery}%`}`,
            sql`${savedOutfits.brand} LIKE ${`%${input.searchQuery}%`}`
          )
        );
      }

      let query = db
        .select({
          id: savedOutfits.id,
          title: savedOutfits.title,
          description: savedOutfits.description,
          watermarkedImageUrl: savedOutfits.watermarkedImageUrl,
          userId: savedOutfits.userId,
          userName: users.name,
          userAvatar: userProfiles.avatar,
          userCountry: users.country,
          style: savedOutfits.style,
          brand: savedOutfits.brand,
          createdAt: savedOutfits.createdAt,
          likeCount: sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`,
          commentCount: sql<number>`(SELECT COUNT(*) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id})`,
          isLiked: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id} AND ${outfitLikes.userId} = ${userId})` : sql<boolean>`false`,
          isFollowing: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${userFollows} WHERE ${userFollows.followerId} = ${userId} AND ${userFollows.followingId} = ${savedOutfits.userId})` : sql<boolean>`false`,
        })
        .from(savedOutfits)
        .innerJoin(users, eq(savedOutfits.userId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(and(...filterConditions));

      // Sort by selected option
      if (input.sortBy === "latest") {
        query = query.orderBy(desc(savedOutfits.createdAt));
      } else if (input.sortBy === "mostLiked") {
        query = query.orderBy(
          desc(
            sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`
          )
        );
      } else if (input.sortBy === "mostCommented") {
        query = query.orderBy(
          desc(
            sql<number>`(SELECT COUNT(*) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id})`
          )
        );
      }

      const results = await query.limit(input.limit).offset(input.offset);
      console.log("[Global Feed] Results count:", results.length); // 👈 Debug log
      console.log("[Global Feed] First result:", results[0]); // 👈 Debug log
      

      return {
        success: true,
        outfits: results,
        count: results.length,
      };
    } catch (error) {
      console.error("[Global Feed] Error fetching feed:", error);
      return {
        success: false,
        error: "Failed to fetch global feed",
        outfits: [],
        count: 0,
      };
    }
  }),

  // Get trending outfits
  getGlobalTrending: publicProcedure
  .input(
    z.object({
      limit: z.number().default(10),
      offset: z.number().default(0),
      timeRange: z.enum(["24h", "7d", "30d"]).default("7d"),
      styleCategory: z.string().optional(),
      country: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
      const db = await getDb();
      if (!db) return { success: false, outfits: [], count: 0, error: "Database not available" };

      const userId = ctx.user?.id;
      const timeRangeMs = 
        input.timeRange === "24h" ? 24 * 60 * 60 * 1000 :
        input.timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 :
        30 * 24 * 60 * 60 * 1000;

      const cutoffTime = new Date(Date.now() - timeRangeMs);

      let query = db
        .select({
          id: savedOutfits.id,
          title: savedOutfits.title,
          description: savedOutfits.description,
          watermarkedImageUrl: savedOutfits.watermarkedImageUrl,
          userId: savedOutfits.userId,
          userName: users.name,
          userAvatar: userProfiles.avatar,
          style: savedOutfits.style,
          createdAt: savedOutfits.createdAt,
          engagementScore: sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id}) + (SELECT COUNT(*) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id}) * 2`,
          likeCount: sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`,
          commentCount: sql<number>`(SELECT COUNT(*) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id})`,
          isLiked: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id} AND ${outfitLikes.userId} = ${userId})` : sql<boolean>`false`,
        })
        .from(savedOutfits)
        .innerJoin(users, eq(savedOutfits.userId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(
          and(
            eq(savedOutfits.isFavorite, 1),
            sql`${savedOutfits.createdAt} >= ${cutoffTime}`,
            input.styleCategory ? eq(savedOutfits.style, input.styleCategory) : undefined,
            input.country ? eq(users.country, input.country) : undefined
          )
        )
        .orderBy(desc(sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id}) + (SELECT COUNT(*) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id}) * 2`))
        .limit(input.limit)
        .offset(input.offset);

      const results = await query;

      return {
        success: true,
        outfits: results,
        count: results.length,
      };
    } catch (error) {
      console.error("[Global Feed] Error fetching trending:", error);
      return {
        success: false,
        error: "Failed to fetch trending",
        outfits: [],
        count: 0,
      };
    }
  }),
  // Get popular brands
  searchOutfits: publicProcedure
  .input(
    z.object({
      query: z.string().min(1),
      limit: z.number().default(20),
      offset: z.number().default(0),
      filters: z.object({
        styleCategory: z.string().optional(),
        country: z.string().optional(),
        brand: z.string().optional(),
        minLikes: z.number().optional(),
        maxPrice: z.number().optional(),
      }).optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
      const db = await getDb();
      if (!db) return { success: false, outfits: [], count: 0, error: "Database not available" };

      const userId = ctx.user?.id;

      const filterConditions: any[] = [
        eq(savedOutfits.isFavorite, 1),
        or(
          sql`${savedOutfits.title} LIKE ${`%${input.query}%`}`,
          sql`${savedOutfits.description} LIKE ${`%${input.query}%`}`,
          sql`${savedOutfits.brand} LIKE ${`%${input.query}%`}`,
          sql`${savedOutfits.style} LIKE ${`%${input.query}%`}`
        ),
      ];

      if (input.filters?.styleCategory) {
        filterConditions.push(eq(savedOutfits.style, input.filters.styleCategory));
      }
      if (input.filters?.country) {
        filterConditions.push(eq(users.country, input.filters.country));
      }
      if (input.filters?.brand) {
        filterConditions.push(eq(savedOutfits.brand, input.filters.brand));
      }
      if (input.filters?.minLikes) {
        filterConditions.push(
          sql`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id}) >= ${input.filters.minLikes}`
        );
      }

      const query = db
        .select({
          id: savedOutfits.id,
          title: savedOutfits.title,
          description: savedOutfits.description,
          watermarkedImageUrl: savedOutfits.watermarkedImageUrl,
          userId: savedOutfits.userId,
          userName: users.name,
          userAvatar: userProfiles.avatar,
          style: savedOutfits.style,
          brand: savedOutfits.brand,
          createdAt: savedOutfits.createdAt,
          likeCount: sql<number>`(SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`,
          commentCount: sql<number>`(SELECT COUNT(*) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id})`,
        })
        .from(savedOutfits)
        .innerJoin(users, eq(savedOutfits.userId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(and(...filterConditions));

      const results = await query
        .orderBy(desc(savedOutfits.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        success: true,
        outfits: results,
        count: results.length,
      };
    } catch (error) {
      console.error("[Global Feed] Error searching outfits:", error);
      return {
        success: false,
        error: "Failed to search outfits",
        outfits: [],
        count: 0,
      };
    }
  }),

  // Get style categories
  getStyleCategories: publicProcedure
  .query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available", categories: [] };

      const categories = await db
        .selectDistinct({ style: savedOutfits.style })
        .from(savedOutfits)
        .where(eq(savedOutfits.isFavorite, 1));

      const categoriesWithCounts = await Promise.all(
        categories.map(async (cat) => {
          const count = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(savedOutfits)
            .where(
              and(
                eq(savedOutfits.isFavorite, 1),
                eq(savedOutfits.style, cat.style)
              )
            );

          return {
            style: cat.style,
            count: count[0]?.count || 0,
          };
        })
      );

      return {
        success: true,
        categories: categoriesWithCounts.sort((a, b) => b.count - a.count),
      };
    } catch (error) {
      console.error("[Global Feed] Error fetching categories:", error);
      return {
        success: false,
        error: "Failed to fetch categories",
        categories: [],
      };
    }
  }),

  // Like outfit
  likeOutfit: protectedProcedure
  .input(z.object({ outfitId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    try {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available" };

      const existingLike = await db.query.outfitLikes.findFirst({
        where: and(
          eq(outfitLikes.outfitId, input.outfitId),
          eq(outfitLikes.userId, ctx.user.id)
        ),
      });

      if (existingLike) {
        await db.delete(outfitLikes).where(eq(outfitLikes.id, existingLike.id));
        return { success: true, liked: false };
      } else {
        await db.insert(outfitLikes).values({
          outfitId: input.outfitId,
          userId: ctx.user.id,
          createdAt: new Date(),
        });
        return { success: true, liked: true };
      }
    } catch (error) {
      console.error("[Global Feed] Error liking outfit:", error);
      return { success: false, error: "Failed to like outfit" };
    }
  }),

  // Get follow suggestions
  getFollowSuggestions: protectedProcedure
  .input(z.object({ limit: z.number().default(5) }))
  .query(async ({ ctx, input }) => {
    try {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available", suggestions: [] };

      // Get users with most outfits and followers (influencers)
      const suggestions = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: userProfiles.avatar,
          bio: userProfiles.bio,
          followerCount: userProfiles.followerCount,
          outfitCount: userProfiles.outfitCount,
          isInfluencer: userProfiles.isInfluencer,
          isFollowing: sql<boolean>`EXISTS(SELECT 1 FROM ${userFollows} WHERE ${userFollows.followerId} = ${ctx.user.id} AND ${userFollows.followingId} = ${users.id})`,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(
          and(
            ne(users.id, ctx.user.id),
            sql`NOT EXISTS(SELECT 1 FROM ${userFollows} WHERE ${userFollows.followerId} = ${ctx.user.id} AND ${userFollows.followingId} = ${users.id})`
          )
        )
        .orderBy(desc(userProfiles.followerCount))
        .limit(input.limit);

      return {
        success: true,
        suggestions: suggestions,
      };
    } catch (error) {
      console.error("[Global Feed] Error fetching suggestions:", error);
      return {
        success: false,
        error: "Failed to fetch suggestions",
        suggestions: [],
      };
    }
  }),

  // Toggle follow
  toggleFollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const existing = await db.select().from(userFollows).where(
        and(
          eq(userFollows.followerId, ctx.user.id),
          eq(userFollows.followingId, input.userId)
        )
      ).limit(1);
      
      if (existing.length) {
        await db.delete(userFollows).where(eq(userFollows.id, existing[0].id));
        return { success: true, following: false };
      } else {
        await db.insert(userFollows).values({
          followerId: ctx.user.id,
          followingId: input.userId,
        });
        return { success: true, following: true };
      }
    }),

  // Share outfit
  shareOutfit: protectedProcedure
    .input(z.object({ outfitId: z.number(), platform: z.string() }))
    .mutation(async ({ input }) => {
      // Implementation from PDF - generate share URL
      const shareUrl = `${process.env.VITE_OAUTH_PORTAL_URL}/outfit/${input.outfitId}`;
      return { success: true, shareUrl, platform: input.platform };
    }),
    getPopularBrands: publicProcedure
  .input(
    z.object({
      limit: z.number().default(10),
      timeRange: z.enum(["24h", "7d", "30d"]).default("7d"),
    })
  )
  .query(async ({ ctx, input }) => {
    try {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available", brands: [], count: 0 };

      const timeRangeMs = 
        input.timeRange === "24h" ? 24 * 60 * 60 * 1000 :
        input.timeRange === "7d" ? 7 * 24 * 60 * 60 * 1000 :
        30 * 24 * 60 * 60 * 1000;

      const cutoffTime = new Date(Date.now() - timeRangeMs);

      const brands = await db
        .select({
          brand: savedOutfits.brand,
          count: sql<number>`COUNT(*)`,
          avgLikes: sql<number>`AVG((SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id}))`,
        })
        .from(savedOutfits)
        .where(
          and(
            eq(savedOutfits.isFavorite, 1),
            sql`${savedOutfits.createdAt} >= ${cutoffTime}`,
            isNotNull(savedOutfits.brand)
          )
        )
        .groupBy(savedOutfits.brand)
        .orderBy(desc(sql<number>`COUNT(*)`))
        .limit(input.limit);

      return {
        success: true,
        brands: brands,
        count: brands.length,
      };
    } catch (error) {
      console.error("[Global Feed] Error fetching popular brands:", error);
      return {
        success: false,
        error: "Failed to fetch popular brands",
        brands: [],
        count: 0,
      };
    }
  }),
});