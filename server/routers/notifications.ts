import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationById,
  type NotificationType,
} from "../db.notifications";

/**
 * Notifications Router
 * Handles all notification-related operations
 */
export const notificationsRouter = router({
  /**
   * Get user's notifications (paginated)
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const notifications = await getUserNotifications(
        ctx.user.id,
        input.limit,
        input.offset
      );
      return notifications;
    }),

  /**
   * Get unread notifications count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await getUnreadNotificationsCount(ctx.user.id);
    return { unreadCount: count };
  }),

  /**
   * Mark single notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await getNotificationById(input.notificationId);

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      // Verify ownership
      if (notification.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this notification",
        });
      }

      await markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  /**
   * Delete a notification
   */
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await getNotificationById(input.notificationId);

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      // Verify ownership
      if (notification.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this notification",
        });
      }

      await deleteNotification(input.notificationId);
      return { success: true };
    }),

  /**
   * Delete all notifications
   */
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    await deleteAllNotifications(ctx.user.id);
    return { success: true };
  }),
});
