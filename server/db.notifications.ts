import { getDb } from './db';
import { inAppNotifications } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export type NotificationType = 'boutique_signup' | 'try_on_complete' | 'credits_low' | 'product_added' | 'boutique_verified' | 'payment_received' | 'customer_inquiry' | 'system';

export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
}

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db.insert(inAppNotifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    actionUrl: input.actionUrl,
    read: 0,
  });

  return result;
}

/**
 * Get user's notifications (paginated)
 */
export async function getUserNotifications(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const notifications = await db
    .select()
    .from(inAppNotifications)
    .where(eq(inAppNotifications.userId, userId))
    .orderBy(desc(inAppNotifications.createdAt))
    .limit(limit)
    .offset(offset);

  return notifications;
}

/**
 * Get unread notifications count
 */
export async function getUnreadNotificationsCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db
    .select()
    .from(inAppNotifications)
    .where(and(
      eq(inAppNotifications.userId, userId),
      eq(inAppNotifications.read, 0)
    ));

  return result.length;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const now = new Date();
  await db
    .update(inAppNotifications)
    .set({
      read: 1,
      readAt: now.toISOString(),
    })
    .where(eq(inAppNotifications.id, notificationId));

  return { success: true };
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const now = new Date();
  await db
    .update(inAppNotifications)
    .set({
      read: 1,
      readAt: now.toISOString(),
    })
    .where(and(
      eq(inAppNotifications.userId, userId),
      eq(inAppNotifications.read, 0)
    ));

  return { success: true };
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .delete(inAppNotifications)
    .where(eq(inAppNotifications.id, notificationId));

  return { success: true };
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .delete(inAppNotifications)
    .where(eq(inAppNotifications.userId, userId));

  return { success: true };
}

/**
 * Get notification by ID
 */
export async function getNotificationById(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const result = await db
    .select()
    .from(inAppNotifications)
    .where(eq(inAppNotifications.id, notificationId))
    .limit(1);

  return result[0] || null;
}
