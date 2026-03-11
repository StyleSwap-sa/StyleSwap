import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { commentNotifications, outfitComments, users } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = router({
  // Create notification when comment is added
  createCommentNotification: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        commentId: z.number().int().positive(),
        outfitId: z.number().int().positive(),
        notificationType: z.enum(["new_comment", "comment_reply", "comment_like"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const result = await db
          .insert(commentNotifications)
          .values({
            userId: input.userId,
            commentId: input.commentId,
            outfitId: input.outfitId,
            notificationType: input.notificationType,
            isRead: false,
          })
          .returning();

        return { success: true, notification: result[0] };
      } catch (error) {
        console.error("Error creating notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create notification",
        });
      }
    }),

  // Get user notifications
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        let query = db
          .select({
            id: commentNotifications.id,
            userId: commentNotifications.userId,
            commentId: commentNotifications.commentId,
            outfitId: commentNotifications.outfitId,
            notificationType: commentNotifications.notificationType,
            isRead: commentNotifications.isRead,
            createdAt: commentNotifications.createdAt,
            comment: outfitComments.comment,
            userName: users.name,
          })
          .from(commentNotifications)
          .leftJoin(outfitComments, eq(commentNotifications.commentId, outfitComments.id))
          .leftJoin(users, eq(outfitComments.userId, users.id))
          .where(eq(commentNotifications.userId, ctx.user.id));

        if (input.unreadOnly) {
          query = query.where(eq(commentNotifications.isRead, false));
        }

        const notifications = await query
          .orderBy(desc(commentNotifications.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return { notifications, total: notifications.length };
      } catch (error) {
        console.error("Error fetching notifications:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch notifications",
        });
      }
    }),

  // Get unread notification count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const result = await db
        .select({ count: commentNotifications.id })
        .from(commentNotifications)
        .where(
          and(
            eq(commentNotifications.userId, ctx.user.id),
            eq(commentNotifications.isRead, false)
          )
        );

      return { unreadCount: result.length };
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get unread count",
      });
    }
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        await db
          .update(commentNotifications)
          .set({ isRead: true })
          .where(eq(commentNotifications.id, input.notificationId));

        return { success: true };
      } catch (error) {
        console.error("Error marking notification as read:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark notification as read",
        });
      }
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await db
        .update(commentNotifications)
        .set({ isRead: true })
        .where(eq(commentNotifications.userId, ctx.user.id));

      return { success: true };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to mark all notifications as read",
      });
    }
  }),
});
