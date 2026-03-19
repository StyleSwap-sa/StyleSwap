import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { pushNotificationPreferences, pollVoteNotifications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  notifyPollVote,
  notifyPollTrending,
  checkAndNotifyMilestone,
  checkAndNotifyTrending,
} from "../services/pollNotificationService";

export const pollNotificationsRouter = router({
  /**
   * Update user's poll notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        pollVoteNotifications: z.boolean().optional(),
        pollTrendingNotifications: z.boolean().optional(),
        pollMilestoneNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const userId = ctx.user.id;

        // Get or create preferences
        const existing = await db.query.pushNotificationPreferences.findFirst({
          where: eq(pushNotificationPreferences.userId, userId),
        });

        if (existing) {
          await db
            .update(pushNotificationPreferences)
            .set({
              pollVoteNotifications: input.pollVoteNotifications ?? existing.pollVoteNotifications,
              pollTrendingNotifications: input.pollTrendingNotifications ?? existing.pollTrendingNotifications,
              pollMilestoneNotifications: input.pollMilestoneNotifications ?? existing.pollMilestoneNotifications,
            })
            .where(eq(pushNotificationPreferences.userId, userId));
        } else {
          await db.insert(pushNotificationPreferences).values({
            userId,
            pollVoteNotifications: input.pollVoteNotifications ?? true,
            pollTrendingNotifications: input.pollTrendingNotifications ?? true,
            pollMilestoneNotifications: input.pollMilestoneNotifications ?? true,
          });
        }

        return { success: true };
      } catch (error) {
        console.error('[Poll Notifications] Error updating preferences:', error);
        throw error;
      }
    }),

  /**
   * Get user's poll notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const userId = ctx.user.id;

      const preferences = await db.query.pushNotificationPreferences.findFirst({
        where: eq(pushNotificationPreferences.userId, userId),
      });

      return (
        preferences || {
          userId,
          pollVoteNotifications: true,
          pollTrendingNotifications: true,
          pollMilestoneNotifications: true,
        }
      );
    } catch (error) {
      console.error('[Poll Notifications] Error getting preferences:', error);
      throw error;
    }
  }),

  /**
   * Trigger vote notification (called when someone votes on a poll)
   * Internal use only
   */
  triggerVoteNotification: protectedProcedure
    .input(
      z.object({
        pollId: z.string(),
        pollTitle: z.string(),
        pollCreatorId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { pollId, pollTitle, pollCreatorId } = input;

        await notifyPollVote({
          pollId,
          pollTitle,
          pollCreatorId,
          eventType: 'vote',
          voterName: ctx.user.name || 'Someone',
        });

        return { success: true };
      } catch (error) {
        console.error('[Poll Notifications] Error triggering vote notification:', error);
        throw error;
      }
    }),

  /**
   * Check and trigger milestone notifications
   * Called after each vote
   */
  checkMilestones: protectedProcedure
    .input(
      z.object({
        pollId: z.string(),
        currentVoteCount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { pollId, currentVoteCount } = input;

        await checkAndNotifyMilestone(pollId, currentVoteCount);
        await checkAndNotifyTrending(pollId);

        return { success: true };
      } catch (error) {
        console.error('[Poll Notifications] Error checking milestones:', error);
        throw error;
      }
    }),

  /**
   * Get poll notification history for a user
   */
  getNotificationHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const userId = ctx.user.id;

        const notifications = await db.query.pollVoteNotifications.findMany({
          where: eq(pollVoteNotifications.userId, userId),
          limit: input.limit,
          offset: input.offset,
        });

        return notifications;
      } catch (error) {
        console.error('[Poll Notifications] Error getting notification history:', error);
        throw error;
      }
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const userId = ctx.user.id;

        await db
          .update(pollVoteNotifications)
          .set({ isRead: true })
          .where(
            eq(pollVoteNotifications.id, parseInt(input.notificationId))
          );

        return { success: true };
      } catch (error) {
        console.error('[Poll Notifications] Error marking notification as read:', error);
        throw error;
      }
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const userId = ctx.user.id;

      await db
        .update(pollVoteNotifications)
        .set({ isRead: true })
        .where(eq(pollVoteNotifications.userId, userId));

      return { success: true };
    } catch (error) {
      console.error('[Poll Notifications] Error marking all notifications as read:', error);
      throw error;
    }
  }),
});
