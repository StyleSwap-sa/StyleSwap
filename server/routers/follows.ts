import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { userFollows, userProfiles, users, notifications } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const followsRouter = router({
  // Follow a user
  followUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.id === input.userId) {
        throw new Error("Cannot follow yourself");
      }
      
      const targetUser = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      // Check if already following
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
        return { isFollowing: true, message: "Already following" };
      }

      // Add follow
      await db.insert(userFollows).values({
        followerId: ctx.user.id,
        followingId: input.userId,
        createdAt: new Date(),
      });

      // Update follower count
      await db
        .update(userProfiles)
        .set({ followerCount: sql`${userProfiles.followerCount} + 1` })
        .where(eq(userProfiles.userId, input.userId));

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

      return { isFollowing: true, message: "Successfully followed" };
    }),

  // Unfollow a user
  unfollowUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete the follow relationship
      await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followingId, input.userId)
          )
        );

      // Update follower count (decrement)
      await db
        .update(userProfiles)
        .set({ followerCount: sql`${userProfiles.followerCount} - 1` })
        .where(eq(userProfiles.userId, input.userId));

      return { isFollowing: false, message: "Successfully unfollowed" };
    }),

  // Get followers
  getFollowers: protectedProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(20), page: z.number().default(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const offset = (input.page - 1) * input.limit;

      const followers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: userProfiles.avatar,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followerId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(eq(userFollows.followingId, input.userId))
        .orderBy(desc(userFollows.createdAt))
        .limit(input.limit)
        .offset(offset);

      return followers;
    }),

  // Get following
  getFollowing: protectedProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(20), page: z.number().default(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const offset = (input.page - 1) * input.limit;

      const following = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: userProfiles.avatar,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followingId, users.id))
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(eq(userFollows.followerId, input.userId))
        .orderBy(desc(userFollows.createdAt))
        .limit(input.limit)
        .offset(offset);

      return following;
    }),

  // Check if following
  isFollowing: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return false;

      const result = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followingId, input.userId)
          )
        )
        .limit(1);

      return result.length > 0;
    }),

  // Get follower count
  getFollowerCount: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;

      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(userFollows)
        .where(eq(userFollows.followingId, input.userId));

      return result[0]?.count || 0;
    }),

  // Get following count
  getFollowingCount: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;

      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(userFollows)
        .where(eq(userFollows.followerId, input.userId));

      return result[0]?.count || 0;
    }),
});