import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { notifications } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const notificationsRouter = router({
  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      return results;
    }),

  markAsRead: protectedProcedure
    .input(z.object({ 
      notificationId: z.number().optional(),
      all: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      if (input.all) {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.userId, ctx.user.id));
      } else if (input.notificationId) {
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(
            and(
              eq(notifications.id, input.notificationId),
              eq(notifications.userId, ctx.user.id)
            )
          );
      }

      return { success: true };
    }),
});