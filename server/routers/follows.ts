import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { userFollows, userProfiles, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const followsRouter = router({
  // Follow a user
  followUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new Error("Cannot follow yourself");
      }

      // Check if already following
      const existing = await ctx.db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followingId, input.userId)
          )
        );

      if (existing.length > 0) {
        return { isFollowing: true, message: "Already following" };
      }

      // Add follow
      await ctx.db.insert(userFollows).values({
        followerId: ctx.user.id,
        followingId: input.userId,
      });

      // Update follower count
      await ctx.db
        .update(userProfiles)
        .set({ followerCount: (await ctx.db.select().from(userProfiles).where(eq(userProfiles.userId, input.userId)))[0]?.followerCount + 1 || 1 })
        .where(eq(userProfiles.userId, input.userId));

      return { isFollowing: true, message: "Successfully followed" };
    }),

  // Unfollow a user
  unfollowUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followingId, input.userId)
          )
        );

      return { isFollowing: false, message: "Successfully unfollowed" };
    }),

  // Get followers
  getFollowers: protectedProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(20), page: z.number().default(1) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;

      const followers = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followerId, users.id))
        .where(eq(userFollows.followingId, input.userId))
        .limit(input.limit)
        .offset(offset);

      return followers;
    }),

  // Get following
  getFollowing: protectedProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(20), page: z.number().default(1) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;

      const following = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followingId, users.id))
        .where(eq(userFollows.followerId, input.userId))
        .limit(input.limit)
        .offset(offset);

      return following;
    }),

  // Check if following
  isFollowing: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followingId, input.userId)
          )
        );

      return result.length > 0;
    }),
});
