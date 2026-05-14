import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, userProfiles, savedOutfits, userFollows } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

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
        .where(eq(userProfiles.userId, input.userId));

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
        .select()
        .from(savedOutfits)
        .where(eq(savedOutfits.userId, input.userId))
        .orderBy(desc(savedOutfits.createdAt))
        .limit(input.limit)
        .offset(offset);

      return outfits;
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
});