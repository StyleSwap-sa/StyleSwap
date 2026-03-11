import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { users, userProfiles, savedOutfits, userFollows } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const profilesRouter = router({
  // Get user profile
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, input.userId));

      if (profile.length === 0) {
        return null;
      }

      return profile[0];
    }),

  // Get user's saved outfits
  getUserOutfits: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(20), page: z.number().default(1) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;

      const outfits = await ctx.db
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
      const existing = await ctx.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, ctx.user.id));

      if (existing.length === 0) {
        // Create new profile
        await ctx.db.insert(userProfiles).values({
          userId: ctx.user.id,
          bio: input.bio || "",
          stylePreferences: input.stylePreferences || "",
          profileImage: input.profileImage,
          followerCount: 0,
          followingCount: 0,
        });
      } else {
        // Update existing profile
        await ctx.db
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
    .query(async ({ ctx, input }) => {
      const followers = await ctx.db
        .select()
        .from(userFollows)
        .where(eq(userFollows.followingId, input.userId));

      return followers.length;
    }),

  // Get following count
  getFollowingCount: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const following = await ctx.db
        .select()
        .from(userFollows)
        .where(eq(userFollows.followerId, input.userId));

      return following.length;
    }),

  // Get user info
  getUserInfo: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db
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
      const profile = await ctx.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, ctx.user.id));

      if (profile.length === 0) {
        // Create default profile
        await ctx.db.insert(userProfiles).values({
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
          followerCount: 0,
          followingCount: 0,
        };
      }

      return profile[0];
    }),
});
