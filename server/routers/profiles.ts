import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  users, 
  userProfiles, 
  savedOutfits, 
  outfitLikes, 
  outfitComments, 
  userFollows, 
  transactions, 
  userCredits 
} from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getPresignedUrlForImage, storagePut } from "../storage"; 

export const profilesRouter = router({
  // Get user profile
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, input.userId));  // ← Using userId (camelCase)

      return profile.length > 0 ? profile[0] : null;
    }),

    // Get user's saved outfits
  getUserOutfits: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(20), page: z.number().default(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const offset = (input.page - 1) * input.limit;

      const outfits = await db
        .select({
          id: savedOutfits.id,
          title: savedOutfits.title,
          description: savedOutfits.description,
          watermarkedImageUrl: savedOutfits.watermarkedImageUrl,
          userId: savedOutfits.userId,
          style: savedOutfits.style,
          brand: savedOutfits.brand,
          createdAt: savedOutfits.createdAt,
          likeCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${outfitLikes} WHERE ${outfitLikes.outfitId} = "saved_outfits"."id"), 0)`, //we have to use the table name "saved_outfits" here because Drizzle doesn't automatically alias the table in subqueries
          commentCount: sql<number>`COALESCE((SELECT COUNT(*) FROM ${outfitComments} WHERE ${outfitComments.outfitId} = "saved_outfits"."id"), 0)`,
        })
        .from(savedOutfits)
        .where(eq(savedOutfits.userId, input.userId))
        .orderBy(desc(savedOutfits.createdAt))
        .limit(input.limit)
        .offset(offset);

        //console.log("[getUserOutfits] Raw outfits:", outfits);
        //console.log("[getUserOutfits] First outfit likeCount:", outfits[0]?.likeCount);
        //console.log("[getUserOutfits] First outfit commentCount:", outfits[0]?.commentCount);
      // Generate presigned URLs for each outfit
      const outfitsWithPresignedUrls = await Promise.all(
        outfits.map(async (outfit) => ({
          ...outfit,
          watermarkedImageUrl: await getPresignedUrlForImage(outfit.watermarkedImageUrl),
          // Ensure counts are numbers
          likeCount: Number(outfit.likeCount) || 0,
          commentCount: Number(outfit.commentCount) || 0,
        }))
      );

      return outfitsWithPresignedUrls;
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      bio: z.string().optional(),
      stylePreferences: z.string().optional(),
      profileImage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const existing = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, ctx.user.id));

      if (existing.length === 0) {
        await db.insert(userProfiles).values({
          userId: ctx.user.id,
          bio: input.bio || "",
          stylePreferences: input.stylePreferences || "",
          profileImage: input.profileImage,
          followerCount: 0,
          followingCount: 0,
        });
      } else {
        await db
          .update(userProfiles)
          .set({
            bio: input.bio,
            stylePreferences: input.stylePreferences,
            profileImage: input.profileImage,
          })
          .where(eq(userProfiles.userId, ctx.user.id));
      }

      return { success: true, message: "Profile updated" };
    }),

  // Get follower count
  getFollowerCount: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;
      
      const followers = await db
        .select()
        .from(userFollows)
        .where(eq(userFollows.followingId, input.userId));

      return followers.length;
    }),

  // Get following count
  getFollowingCount: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;
      
      const following = await db
        .select()
        .from(userFollows)
        .where(eq(userFollows.followerId, input.userId));

      return following.length;
    }),

  // Get user info
  getUserInfo: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const user = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, input.userId));

      return user.length > 0 ? user[0] : null;
    }),

  // Get current user profile
  getCurrentProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, ctx.user.id));

      if (profile.length === 0) {
        await db.insert(userProfiles).values({
          userId: ctx.user.id,
          bio: "",
          stylePreferences: "",
          followerCount: 0,
          followingCount: 0,
        });

        return {
          userId: ctx.user.id,
          bio: "",
          stylePreferences: "",
          profileImage: null,
          followerCount: 0,
          followingCount: 0,
        };
      }

      return profile[0];
    }),

  getUserStats: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      console.log("[Profile] getUserStats for userId:", input.userId);

      // Total try-ons (from saved_outfits where user_id matches)
      const totalTryOns = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(savedOutfits)
        .where(eq(savedOutfits.userId, input.userId));
      console.log("[Profile] totalTryOns:", totalTryOns);

      // Remaining credits
      const credits = await db
        .select({
          remaining: userCredits.remainingCredits,
        })
        .from(userCredits)
        .where(eq(userCredits.userId, input.userId))  // ← userId (camelCase)
        .limit(1);
      console.log("[Profile] credits:", credits);

      // Total spent (from transactions)
      const totalSpent = await db
        .select({ sum: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(transactions)
        .where(eq(transactions.userId, input.userId));  // ← userId (camelCase)
      console.log("[Profile] totalSpent:", totalSpent);

      return {
        totalTryOns: Number(totalTryOns[0]?.count || 0),
        remainingCredits: Number(credits[0]?.remaining || 0),
        totalSpent: Number(totalSpent[0]?.sum || 0),
      };
    }),

  getLikedOutfits: protectedProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const likedOutfits = await db
        .select({
          id: savedOutfits.id,
          title: savedOutfits.title,
          description: savedOutfits.description,
          watermarkedImageUrl: savedOutfits.watermarkedImageUrl,
          style: savedOutfits.style,
          brand: savedOutfits.brand,
          createdAt: savedOutfits.createdAt,
        })
        .from(savedOutfits)
        .innerJoin(outfitLikes, eq(savedOutfits.id, outfitLikes.outfitId))
        .where(eq(outfitLikes.userId, input.userId))
        .orderBy(desc(outfitLikes.createdAt))
        .limit(input.limit);

      // Generate presigned URLs
      const likedWithPresignedUrls = await Promise.all(
        likedOutfits.map(async (outfit) => ({
          ...outfit,
          watermarkedImageUrl: await getPresignedUrlForImage(outfit.watermarkedImageUrl),
        }))
      );

      return likedWithPresignedUrls;
    }),

  getPurchaseHistory: protectedProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const history = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, input.userId))
        .orderBy(desc(transactions.createdAt))
        .limit(input.limit);

      return history;
    }),
    // Check if current user is following a user
isFollowing: protectedProcedure
  .input(z.object({ userId: z.number() }))
  .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return false;
    
    const follow = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, ctx.user.id),
          eq(userFollows.followingId, input.userId)
        )
      )
      .limit(1);

    return follow.length > 0;
  }),
  uploadAvatar: protectedProcedure
    .input(z.object({
      base64Data: z.string(),
      fileName: z.string(),
      contentType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Convert base64 to Buffer
        const buffer = Buffer.from(input.base64Data.split(',')[1] || input.base64Data, 'base64');

        // Validate file size (max 5MB)
        if (buffer.length > 5 * 1024 * 1024) {
          throw new Error("File size exceeds 5MB limit");
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(input.contentType)) {
          throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
        }

        // Generate S3 key: avatars/user-{userId}-{timestamp}.{ext}
        const ext = input.contentType.split('/')[1];
        const timestamp = Date.now();
        const s3Key = `avatars/user-${ctx.user.id}-${timestamp}.${ext}`;

        // Upload to S3
        const { url: s3Url } = await storagePut(s3Key, buffer, input.contentType);
        console.log("[Profile] Avatar uploaded to S3:", s3Url);

        // Update or insert user profile with avatar
        const existingProfile = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, ctx.user.id))
          .limit(1);

        if (existingProfile.length > 0) {
          // Update existing profile
          await db
            .update(userProfiles)
            .set({
              avatar: s3Key, // Store S3 key, not full URL
              updatedAt: new Date(),
            })
            .where(eq(userProfiles.userId, ctx.user.id));
        } else {
          // Create new profile
          await db.insert(userProfiles).values({
            userId: ctx.user.id,
            avatar: s3Key,
            bio: "",
            followerCount: 0,
            outfitCount: 0,
            isInfluencer: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        console.log("[Profile] Avatar updated for user:", ctx.user.id);

        return {
          success: true,
          avatarUrl: s3Url,
          message: "Profile picture updated successfully",
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("[Profile] Avatar upload failed:", errorMsg);
        throw new Error(`Avatar upload failed: ${errorMsg}`);
      }
    }),
});