import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getPresignedUrlForImage } from "../storage";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  savedOutfits, 
  outfitLikes, 
  outfitComments, 
  userFollows, 
  userProfiles, 
  users,
  notifications
} from "../../drizzle/schema";
import { eq, and, desc, sql, or, isNotNull, ne } from "drizzle-orm";

async function getPresignedUrlForOutfit(s3Key: string): Promise<string> {
  if (!s3Key) return "";
  try {
    // If it's already a full URL (like Unsplash images), return as-is
    if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
      return s3Key;
    }
    // Generate presigned URL for S3 objects
    return await getPresignedUrlForImage(s3Key, 86400); // 24 hours expiration
  } catch (error) {
    console.error("[Global Feed] Error generating presigned URL:", error);
    return "";
  }
}

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
    const db = await getDb();
    if (!db) return { success: false, outfits: [], count: 0, error: "Database not available" };
    
    try {
      const userId = ctx.user?.id;
      console.log("[Global Feed] User ID:", userId);

      // Build filter conditions
      const filterConditions: any[] = [
        eq(savedOutfits.isFavorite, 1),
      ];
      
      //if (userId) {
        //filterConditions.push(ne(savedOutfits.userId, userId));
      //}
      if (input.styleCategory) {
        filterConditions.push(eq(savedOutfits.style, input.styleCategory));
      }
      if (input.country) {
        filterConditions.push(eq(users.country, input.country));
      }
      if (input.searchQuery) {
        filterConditions.push(
          or(
            sql`${savedOutfits.title} ILIKE ${`%${input.searchQuery}%`}`,
            sql`${savedOutfits.description} ILIKE ${`%${input.searchQuery}%`}`,
            sql`${savedOutfits.brand} ILIKE ${`%${input.searchQuery}%`}`
          )
        );
      }
      {/* Most liked shows >= 1 liked posts for now, subject to change, with the product growth */}
      if (input.sortBy === "mostLiked") {
        filterConditions.push(
          sql`(SELECT COALESCE(COUNT(*), 0) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id}) >= 1`
        );
      }


      // Define the select fields
      const selectFields = {
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
        likeCount: sql<number>`(SELECT COALESCE(COUNT(*), 0) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`,
        commentCount: sql<number>`(SELECT COALESCE(COUNT(*), 0) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id})`,
        isLiked: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id} AND ${outfitLikes.userId} = ${userId})` : sql<boolean>`false`,
        isFollowing: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${userFollows} WHERE ${userFollows.followerId} = ${userId} AND ${userFollows.followingId} = ${savedOutfits.userId})` : sql<boolean>`false`,
      };

      // Build the query
      let query = db
        .select(selectFields)
        .from(savedOutfits)
        .innerJoin(users, eq(savedOutfits.userId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(and(...filterConditions));

      // Apply sorting using a separate query builder
      if (input.sortBy === "latest") {
        query = query.orderBy(desc(savedOutfits.createdAt)) as any;
      } else if (input.sortBy === "mostLiked") {
        query = query.orderBy(
          desc(
            sql<number>`(SELECT COALESCE(COUNT(*), 0) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`
          )
        ) as any;
      } else if (input.sortBy === "mostCommented") {
        query = query.orderBy(
          desc(
            sql<number>`(SELECT COALESCE(COUNT(*), 0) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id})`
          )
        ) as any;
      }

      const results = await query.limit(input.limit).offset(input.offset);
      console.log("[Global Feed] Results count:", results.length);
      
      console.log("[Global Feed] Raw results count:", results.length);
      console.log("[Global Feed] First raw URL:", results[0]?.watermarkedImageUrl);

      const processedResults = await Promise.all(
        results.map(async (outfit) => {
          const presignedUrl = await getPresignedUrlForImage(outfit.watermarkedImageUrl);
          console.log("[Global Feed] Original:", outfit.watermarkedImageUrl);
          console.log("[Global Feed] Presigned:", presignedUrl);
          return {
            ...outfit,
            watermarkedImageUrl: presignedUrl,
          };
        })
      );

      console.log("[Global Feed] First processed URL:", processedResults[0]?.watermarkedImageUrl);
      
      return {
        success: true,
        outfits: processedResults,
        count: processedResults.length,
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
  .input(z.object({
    limit: z.number().default(10),
    offset: z.number().default(0),
    timeRange: z.enum(["24h", "7d", "30d"]).default("7d"),
    styleCategory: z.string().optional(),
    country: z.string().optional(),
  }))
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

      // Define engagement score calculation
      const engagementScore = sql<number>`
        COALESCE(
          (SELECT COALESCE(COUNT(*), 0) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id}) + 
          (SELECT COALESCE(COUNT(*), 0) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id}) * 2,
          0
        )
      `;

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
          likeCount: sql<number>`(SELECT COALESCE(COUNT(*), 0) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id})`,
          commentCount: sql<number>`(SELECT COALESCE(COUNT(*), 0) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = ${savedOutfits.id})`,
          isLiked: userId ? sql<boolean>`EXISTS(SELECT 1 FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id} AND ${outfitLikes.userId} = ${userId})` : sql<boolean>`false`,
          engagementScore: engagementScore,
        })
        .from(savedOutfits)
        .innerJoin(users, eq(savedOutfits.userId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(
          and(
            eq(savedOutfits.isFavorite, 1),
            // 🔥 Only show outfits with engagement > 0
            sql`${engagementScore} > 0`,
            sql`${savedOutfits.createdAt} >= ${cutoffTime.toISOString()}`,
            input.styleCategory ? eq(savedOutfits.style, input.styleCategory) : undefined,
            input.country ? eq(users.country, input.country) : undefined
          )
        )
        .orderBy(desc(engagementScore))
        .limit(input.limit)
        .offset(input.offset);

      const results = await query;
      const processedResults = await Promise.all(
        results.map(async (outfit) => ({
          ...outfit,
          watermarkedImageUrl: await getPresignedUrlForImage(outfit.watermarkedImageUrl),
        }))
      );
      
      return {
        success: true,
        outfits: processedResults,
        count: processedResults.length,
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
  getPopularBrands: publicProcedure
    .input(z.object({
      limit: z.number().default(10),
      timeRange: z.enum(["24h", "7d", "30d"]).default("7d"),
    }))
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
            avgLikes: sql<number>`AVG((SELECT COALESCE(COUNT(*), 0) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = ${savedOutfits.id}))`,
          })
          .from(savedOutfits)
          .where(
            and(
              eq(savedOutfits.isFavorite, 1),
              sql`${savedOutfits.createdAt} >= ${cutoffTime.toISOString()}`,
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

  // Get style categories
  getStyleCategories: publicProcedure
  .query(async () => {
    try {
      const db = await getDb();
      if (!db) return { success: false, error: "Database not available", categories: [] };

      // Single query to get all categories with counts
      const results = await db
        .select({
          style: savedOutfits.style,
          count: sql<number>`COUNT(*)`,
        })
        .from(savedOutfits)
        .where(
          and(
            eq(savedOutfits.isFavorite, 1),
            isNotNull(savedOutfits.style)
          )
        )
        .groupBy(savedOutfits.style)
        .orderBy(desc(sql<number>`COUNT(*)`));

      const categoriesWithCounts = results.map((row) => ({
        style: row.style as string,
        count: Number(row.count),
      }));

      return {
        success: true,
        categories: categoriesWithCounts,
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

      // First, get the outfit owner info (before we potentially delete the like)
      const outfit = await db
        .select({
          userId: savedOutfits.userId,
          title: savedOutfits.title,
        })
        .from(savedOutfits)
        .where(eq(savedOutfits.id, input.outfitId))
        .limit(1);

      if (!outfit.length) {
        return { success: false, error: "Outfit not found" };
      }

      const existingLike = await db
        .select()
        .from(outfitLikes)
        .where(
          and(
            eq(outfitLikes.outfitId, input.outfitId),
            eq(outfitLikes.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existingLike.length > 0) {
        // Unlike: Remove the like
        await db.delete(outfitLikes).where(eq(outfitLikes.id, existingLike[0].id));
        
        // Optionally: Remove the notification if it exists
        await db
          .delete(notifications)
          .where(
            and(
              eq(notifications.userId, outfit[0].userId),
              eq(notifications.actorId, ctx.user.id),
              eq(notifications.entityId, input.outfitId),
              eq(notifications.entityType, 'outfit'),
              eq(notifications.type, 'like')
            )
          );
        
        return { success: true, liked: false };
      } else {
        // Like: Add the like
        await db.insert(outfitLikes).values({
          outfitId: input.outfitId,
          userId: ctx.user.id,
          createdAt: new Date(),
        });

        // 🔥 Create notification for outfit owner (if not the same user)
        if (outfit[0].userId !== ctx.user.id) {
          await db.insert(notifications).values({
            userId: outfit[0].userId,
            type: 'like',
            message: `${ctx.user.name || 'Someone'} liked your outfit "${outfit[0].title}"`,
            actorId: ctx.user.id,
            entityId: input.outfitId,
            entityType: 'outfit',
            createdAt: new Date(),
          });
        }

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

    getComments: publicProcedure
      .input(z.object({ outfitId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        const comments = await db
          .select({
            id: outfitComments.id,
            comment: outfitComments.comment,
            createdAt: outfitComments.createdAt,
            userId: outfitComments.userId,
            userName: users.name,
            userAvatar: userProfiles.avatar,
          })
          .from(outfitComments)
          .innerJoin(users, eq(outfitComments.userId, users.id))
          .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
          .where(eq(outfitComments.outfitId, input.outfitId))
          .orderBy(desc(outfitComments.createdAt));

        return comments;
      }),
    // Add comment to outfit
  addComment: protectedProcedure
    .input(z.object({
      outfitId: z.number(),
      comment: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get outfit owner
      const outfit = await db
        .select({
          userId: savedOutfits.userId,
          title: savedOutfits.title,
        })
        .from(savedOutfits)
        .where(eq(savedOutfits.id, input.outfitId))
        .limit(1);

      if (!outfit.length) {
        throw new Error("Outfit not found");
      }

      // Insert comment
      const result = await db.insert(outfitComments).values({
        outfitId: input.outfitId,
        userId: ctx.user.id,
        comment: input.comment,
        createdAt: new Date(),
      }).returning({ id: outfitComments.id });

      // 🔥 Create notification for outfit owner (if not the same user)
      if (outfit[0].userId !== ctx.user.id) {
        await db.insert(notifications).values({
          userId: outfit[0].userId,
          type: 'comment',
          message: `${ctx.user.name || 'Someone'} commented on your outfit "${outfit[0].title}"`,
          actorId: ctx.user.id,
          entityId: input.outfitId,
          entityType: 'outfit',
          createdAt: new Date(),
        });
      }

      return { success: true, commentId: result[0]?.id };
    }),

  editComment: protectedProcedure
    .input(z.object({
      commentId: z.number(),
      comment: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the user owns this comment
      const existing = await db
        .select()
        .from(outfitComments)
        .where(eq(outfitComments.id, input.commentId))
        .limit(1);

      if (!existing.length) {
        throw new Error("Comment not found");
      }

      if (existing[0].userId !== ctx.user.id) {
        throw new Error("You can only edit your own comments");
      }

      await db
        .update(outfitComments)
        .set({ comment: input.comment })
        .where(eq(outfitComments.id, input.commentId));

      return { success: true };
    }),

  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the user owns this comment
      const existing = await db
        .select()
        .from(outfitComments)
        .where(eq(outfitComments.id, input.commentId))
        .limit(1);

      if (!existing.length) {
        throw new Error("Comment not found");
      }

      if (existing[0].userId !== ctx.user.id) {
        throw new Error("You can only delete your own comments");
      }

      // Also delete associated notifications
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.entityId, existing[0].outfitId),
            eq(notifications.entityType, 'comment'),
            eq(notifications.type, 'comment')
          )
        );

      await db.delete(outfitComments).where(eq(outfitComments.id, input.commentId));

      return { success: true };
    }),
  // Toggle follow
  toggleFollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get the user being followed
      const targetUser = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      const existing = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followingId, input.userId)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        // Unfollow
        await db.delete(userFollows).where(eq(userFollows.id, existing[0].id));
        
        // Decrement follower count
        await db
          .update(userProfiles)
          .set({ followerCount: sql`${userProfiles.followerCount} - 1` })
          .where(eq(userProfiles.userId, input.userId));
        
        return { success: true, following: false };
      } else {
        // Follow
        await db.insert(userFollows).values({
          followerId: ctx.user.id,
          followingId: input.userId,
          createdAt: new Date(),
        });

        // Increment follower count
        await db
          .update(userProfiles)
          .set({ followerCount: sql`${userProfiles.followerCount} + 1` })
          .where(eq(userProfiles.userId, input.userId));

        // Create notification
        if (targetUser.length > 0 && targetUser[0].name) {
          await db.insert(notifications).values({
            userId: input.userId,
            type: 'follow',
            message: `${ctx.user.name || 'Someone'} started following you`,
            actorId: ctx.user.id,
            entityId: ctx.user.id,
            entityType: 'user',
            createdAt: new Date(),
          });
        }

        return { success: true, following: true };
      }
    }),

  // Share outfit
  shareOutfit: protectedProcedure
    .input(z.object({ outfitId: z.number(), platform: z.string() }))
    .mutation(async ({ input }) => {
      const shareUrl = `${process.env.VITE_OAUTH_PORTAL_URL}/outfit/${input.outfitId}`;
      return { success: true, shareUrl, platform: input.platform };
    }),
});