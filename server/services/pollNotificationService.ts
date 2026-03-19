import { getDb } from "../db";
import { pushNotifications, pollVoteNotifications, outfitVotings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * Poll Notification Service
 * Handles push notifications for poll-related events
 */

export interface PollNotificationPayload {
  pollId: string;
  pollTitle: string;
  pollCreatorId: string;
  eventType: 'vote' | 'trending' | 'milestone';
  voterName?: string;
  voteCount?: number;
  shareCount?: number;
}

/**
 * Send push notification when someone votes on a poll
 */
export async function notifyPollVote(payload: PollNotificationPayload) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const { pollId, pollTitle, pollCreatorId, voterName } = payload;

    // Check if poll creator has push notifications enabled
    const userPreferences = await db.query.pushNotificationPreferences.findFirst({
      where: eq(pushNotificationPreferences.userId, parseInt(pollCreatorId)),
    });

    if (!userPreferences?.pollVoteNotifications) {
      console.log(`[Poll Notification] Poll vote notifications disabled for user ${pollCreatorId}`);
      return;
    }

    // Create push notification
    const notification = await db.insert(pushNotifications).values({
      userId: parseInt(pollCreatorId),
      title: `New vote on "${pollTitle}"`,
      body: voterName ? `${voterName} voted on your poll` : 'Someone voted on your poll',
      type: 'poll_vote',
      data: JSON.stringify({
        pollId,
        pollTitle,
        voterName,
        action: 'view_poll',
      }),
      isRead: false,
    });

    // Log vote notification
    await db.insert(pollVoteNotifications).values({
      pollId,
      userId: parseInt(pollCreatorId),
      voterUserId: null,
      notificationType: 'vote',
      isRead: false,
    });

    console.log(`[Poll Notification] Sent vote notification for poll ${pollId}`);
    return notification;
  } catch (error) {
    console.error('[Poll Notification] Error sending vote notification:', error);
    throw error;
  }
}

/**
 * Send push notification when a poll becomes trending
 */
export async function notifyPollTrending(payload: PollNotificationPayload) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const { pollId, pollTitle, pollCreatorId, voteCount } = payload;

    // Check if poll creator has push notifications enabled
    const userPreferences = await db.query.pushNotificationPreferences.findFirst({
      where: eq(pushNotificationPreferences.userId, parseInt(pollCreatorId)),
    });

    if (!userPreferences?.pollTrendingNotifications) {
      console.log(`[Poll Notification] Poll trending notifications disabled for user ${pollCreatorId}`);
      return;
    }

    // Create push notification
    const notification = await db.insert(pushNotifications).values({
      userId: parseInt(pollCreatorId),
      title: `"${pollTitle}" is trending!`,
      body: `Your poll has reached ${voteCount} votes and is now trending`,
      type: 'poll_trending',
      data: JSON.stringify({
        pollId,
        pollTitle,
        voteCount,
        action: 'view_poll',
      }),
      isRead: false,
    });

    // Log trending notification
    await db.insert(pollVoteNotifications).values({
      pollId,
      userId: parseInt(pollCreatorId),
      notificationType: 'trending',
      isRead: false,
    });

    console.log(`[Poll Notification] Sent trending notification for poll ${pollId}`);
    return notification;
  } catch (error) {
    console.error('[Poll Notification] Error sending trending notification:', error);
    throw error;
  }
}

/**
 * Send push notification for poll milestones (100 votes, 500 votes, etc.)
 */
export async function notifyPollMilestone(payload: PollNotificationPayload) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const { pollId, pollTitle, pollCreatorId, voteCount } = payload;

    // Check if poll creator has push notifications enabled
    const userPreferences = await db.query.pushNotificationPreferences.findFirst({
      where: eq(pushNotificationPreferences.userId, parseInt(pollCreatorId)),
    });

    if (!userPreferences?.pollMilestoneNotifications) {
      console.log(`[Poll Notification] Poll milestone notifications disabled for user ${pollCreatorId}`);
      return;
    }

    // Create push notification
    const notification = await db.insert(pushNotifications).values({
      userId: parseInt(pollCreatorId),
      title: `Milestone reached on "${pollTitle}"`,
      body: `Your poll has reached ${voteCount} votes!`,
      type: 'poll_milestone',
      data: JSON.stringify({
        pollId,
        pollTitle,
        voteCount,
        action: 'view_poll',
      }),
      isRead: false,
    });

    // Log milestone notification
    await db.insert(pollVoteNotifications).values({
      pollId,
      userId: parseInt(pollCreatorId),
      notificationType: 'milestone',
      isRead: false,
    });

    console.log(`[Poll Notification] Sent milestone notification for poll ${pollId}`);
    return notification;
  } catch (error) {
    console.error('[Poll Notification] Error sending milestone notification:', error);
    throw error;
  }
}

/**
 * Check if poll should trigger trending notification
 * Trending threshold: 100+ votes with high engagement rate
 */
export async function checkAndNotifyTrending(pollId: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const poll = await db.query.outfitVotings.findFirst({
      where: eq(outfitVotings.id, parseInt(pollId)),
    });

    if (!poll) {
      console.log(`[Poll Notification] Poll ${pollId} not found`);
      return;
    }

    const voteCount = poll.voteCount || 0;
    const shareCount = poll.shareCount || 0;
    const engagementRate = shareCount > 0 ? (shareCount / voteCount) * 100 : 0;

    // Trending criteria: 100+ votes OR 50+ votes with 20%+ share rate
    const isTrending = voteCount >= 100 || (voteCount >= 50 && engagementRate >= 20);

    if (isTrending && !poll.isTrending) {
      // Mark poll as trending
      await db.update(outfitVotings).set({ isTrending: true }).where(eq(outfitVotings.id, parseInt(pollId)));

      // Send notification
      await notifyPollTrending({
        pollId,
        pollTitle: poll.title,
        pollCreatorId: poll.createdBy.toString(),
        eventType: 'trending',
        voteCount,
        shareCount,
      });
    }
  } catch (error) {
    console.error('[Poll Notification] Error checking trending status:', error);
  }
}

/**
 * Check and notify poll milestones
 */
export async function checkAndNotifyMilestone(pollId: string, voteCount: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const milestones = [100, 500, 1000, 5000];
    const previousVoteCount = voteCount - 1;

    for (const milestone of milestones) {
      // Check if we just crossed a milestone
      if (previousVoteCount < milestone && voteCount >= milestone) {
        const poll = await db.query.outfitVotings.findFirst({
          where: eq(outfitVotings.id, parseInt(pollId)),
        });

        if (poll) {
          await notifyPollMilestone({
            pollId,
            pollTitle: poll.title,
            pollCreatorId: poll.createdBy.toString(),
            eventType: 'milestone',
            voteCount,
          });
        }
      }
    }
  } catch (error) {
    console.error('[Poll Notification] Error checking milestones:', error);
  }
}

/**
 * Notify owner of high-engagement polls for platform visibility
 */
export async function notifyOwnerOfHighEngagementPoll(pollId: string, voteCount: number, shareCount: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const poll = await db.query.outfitVotings.findFirst({
      where: eq(outfitVotings.id, parseInt(pollId)),
    });

    if (!poll) return;

    // Notify owner if poll has 500+ votes or 100+ shares
    if (voteCount >= 500 || shareCount >= 100) {
      await notifyOwner({
        title: `High-Engagement Poll: "${poll.title}"`,
        content: `Poll by user ${poll.createdBy} has reached ${voteCount} votes and ${shareCount} shares. Consider featuring it on the platform.`,
      });
    }
  } catch (error) {
    console.error('[Poll Notification] Error notifying owner:', error);
  }
}
