import { getDb } from '../db';
import { notifications } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Verification Notification Service
 * Sends in-app notifications for verification events
 */

export type NotificationType =
  | 'verification_submitted'
  | 'verification_approved'
  | 'verification_rejected'
  | 'verification_expiring'
  | 'verification_expired'
  | 'fraud_flag_detected'
  | 'fraud_appeal_submitted'
  | 'fraud_appeal_approved'
  | 'fraud_appeal_rejected';

interface NotificationPayload {
  boutique_id: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Create and send in-app notification
 */
export async function sendVerificationNotification(payload: NotificationPayload) {
  try {
    const db = getDb();

    // Create notification record
    const result = await db.insert(notifications).values({
      boutique_id: payload.boutique_id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: JSON.stringify(payload.data || {}),
      action_url: payload.actionUrl,
      priority: payload.priority || 'medium',
      read: false,
      created_at: new Date().toISOString(),
    });

    console.log(`[Notifications] Sent ${payload.type} to boutique ${payload.boutique_id}`);

    return result;
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error);
    throw error;
  }
}

/**
 * Notify boutique of verification submission
 */
export async function notifyVerificationSubmitted(boutiqueId: number, verificationType: string) {
  return sendVerificationNotification({
    boutique_id: boutiqueId,
    type: 'verification_submitted',
    title: 'Verification Submitted',
    message: `Your ${verificationType === 'formal' ? 'formal business' : 'social media'} verification has been submitted and is under review.`,
    priority: 'medium',
    actionUrl: '/dashboard/verification/status',
  });
}

/**
 * Notify boutique of verification approval
 */
export async function notifyVerificationApproved(
  boutiqueId: number,
  trustScore: number,
  expiryDate: string
) {
  return sendVerificationNotification({
    boutique_id: boutiqueId,
    type: 'verification_approved',
    title: '🎉 Verification Approved!',
    message: `Congratulations! Your boutique is now verified with a trust score of ${trustScore}/100. Your verification expires on ${new Date(expiryDate).toLocaleDateString()}.`,
    priority: 'high',
    data: {
      trustScore,
      expiryDate,
    },
    actionUrl: '/dashboard/verification/status',
  });
}

/**
 * Notify boutique of verification rejection
 */
export async function notifyVerificationRejected(
  boutiqueId: number,
  reason: string,
  appealDeadline: string
) {
  return sendVerificationNotification({
    boutique_id: boutiqueId,
    type: 'verification_rejected',
    title: 'Verification Rejected',
    message: `Your verification was rejected: ${reason}. You can appeal this decision until ${new Date(appealDeadline).toLocaleDateString()}.`,
    priority: 'high',
    data: {
      reason,
      appealDeadline,
    },
    actionUrl: '/dashboard/verification/appeal',
  });
}

/**
 * Notify boutique of verification expiring soon
 */
export async function notifyVerificationExpiring(
  boutiqueId: number,
  daysUntilExpiry: number,
  expiryDate: string
) {
  const urgency = {
    60: 'You have plenty of time to prepare',
    30: 'Please start the renewal process soon',
    7: 'This is your final reminder before expiry',
  };

  return sendVerificationNotification({
    boutique_id: boutiqueId,
    type: 'verification_expiring',
    title: `Verification Expiring in ${daysUntilExpiry} Days`,
    message: `${urgency[daysUntilExpiry as keyof typeof urgency]}. Your verification expires on ${new Date(expiryDate).toLocaleDateString()}.`,
    priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
    data: {
      daysUntilExpiry,
      expiryDate,
    },
    actionUrl: '/dashboard/verification/renew',
  });
}

/**
 * Notify boutique of verification expiry
 */
export async function notifyVerificationExpired(boutiqueId: number) {
  return sendVerificationNotification({
    boutique_id: boutiqueId,
    type: 'verification_expired',
    title: 'Verification Expired',
    message: 'Your boutique verification has expired. You must renew your verification to continue selling.',
    priority: 'high',
    actionUrl: '/dashboard/verification/renew',
  });
}

/**
 * Notify boutique of fraud flag
 */
export async function notifyFraudFlagDetected(
  boutiqueId: number,
  flagType: string,
  description: string
) {
  return sendVerificationNotification({
    boutique_id: boutiqueId,
    type: 'fraud_flag_detected',
    title: 'Account Review Required',
    message: `We've detected unusual activity on your account: ${description}. Please review and respond to this flag.`,
    priority: 'high',
    data: {
      flagType,
      description,
    },
    actionUrl: '/dashboard/verification/fraud-flags',
  });
}

/**
 * Notify boutique of fraud appeal submission
 */
export async function notifyFraudAppealSubmitted(
  boutiqueId: number,
  appealId: number,
  flagType: string
) {
  return sendVerificationNotification({
    boutique_id: boutiqueId,
    type: 'fraud_appeal_submitted',
    title: 'Appeal Submitted',
    message: `Your appeal for the ${flagType} flag has been submitted and is under review. You'll be notified when a decision is made.`,
    priority: 'medium',
    data: {
      appealId,
      flagType,
    },
    actionUrl: `/dashboard/verification/appeals/${appealId}`,
  });
}

/**
 * Notify boutique of fraud appeal approval
 */
export async function notifyFraudAppealApproved(
  boutiqueId: number,
  appealId: number,
  flagType: string
) {
  return sendVerificationNotification({
    boutique_id: boutiqueId,
    type: 'fraud_appeal_approved',
    title: '✅ Appeal Approved',
    message: `Your appeal for the ${flagType} flag has been approved. The flag has been removed from your account.`,
    priority: 'high',
    data: {
      appealId,
      flagType,
    },
    actionUrl: '/dashboard/verification/status',
  });
}

/**
 * Notify boutique of fraud appeal rejection
 */
export async function notifyFraudAppealRejected(
  boutiqueId: number,
  appealId: number,
  flagType: string,
  reason: string
) {
  return sendVerificationNotification({
    boutique_id: boutiqueId,
    type: 'fraud_appeal_rejected',
    title: 'Appeal Rejected',
    message: `Your appeal for the ${flagType} flag was rejected. Reason: ${reason}. You can submit another appeal if you have additional evidence.`,
    priority: 'high',
    data: {
      appealId,
      flagType,
      reason,
    },
    actionUrl: '/dashboard/verification/fraud-flags',
  });
}

/**
 * Get unread notifications for boutique
 */
export async function getUnreadNotifications(boutiqueId: number) {
  try {
    const db = getDb();

    const unreadNotifications = await db.query.notifications.findMany({
      where: (fields) => ({
        boutique_id: eq(fields.boutique_id, boutiqueId),
        read: eq(fields.read, false),
      }),
      orderBy: (fields) => fields.created_at,
      limit: 20,
    });

    return unreadNotifications;
  } catch (error) {
    console.error('[Notifications] Error fetching unread notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    const db = getDb();

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));

    console.log(`[Notifications] Marked notification ${notificationId} as read`);
  } catch (error) {
    console.error('[Notifications] Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for boutique
 */
export async function markAllNotificationsAsRead(boutiqueId: number) {
  try {
    const db = getDb();

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.boutique_id, boutiqueId));

    console.log(`[Notifications] Marked all notifications as read for boutique ${boutiqueId}`);
  } catch (error) {
    console.error('[Notifications] Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: number) {
  try {
    const db = getDb();

    await db.delete(notifications).where(eq(notifications.id, notificationId));

    console.log(`[Notifications] Deleted notification ${notificationId}`);
  } catch (error) {
    console.error('[Notifications] Error deleting notification:', error);
    throw error;
  }
}

/**
 * Get notification count for boutique
 */
export async function getNotificationCount(boutiqueId: number) {
  try {
    const db = getDb();

    const count = await db.query.notifications.findMany({
      where: (fields) => ({
        boutique_id: eq(fields.boutique_id, boutiqueId),
        read: eq(fields.read, false),
      }),
    });

    return count.length;
  } catch (error) {
    console.error('[Notifications] Error getting notification count:', error);
    throw error;
  }
}
