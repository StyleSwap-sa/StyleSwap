import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { flaggedComments, moderationLogs, outfitComments, users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can access moderation tools",
    });
  }
  return next({ ctx });
});

export const moderationRouter = router({
  // Flag a comment for moderation
  flagComment: protectedProcedure
    .input(
      z.object({
        commentId: z.number().int().positive(),
        reason: z.enum(["inappropriate", "spam", "offensive", "other"]),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const result = await db
          .insert(flaggedComments)
          .values({
            commentId: input.commentId,
            reportedBy: ctx.user.id,
            reason: input.reason,
            description: input.description,
            status: "pending",
          })
          .returning();

        return { success: true, flaggedComment: result[0] };
      } catch (error) {
        console.error("Error flagging comment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to flag comment",
        });
      }
    }),

  // Get flagged comments (admin only)
  getFlaggedComments: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "deleted"]).optional(),
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
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
            id: flaggedComments.id,
            commentId: flaggedComments.commentId,
            reportedBy: flaggedComments.reportedBy,
            reason: flaggedComments.reason,
            description: flaggedComments.description,
            status: flaggedComments.status,
            moderatedBy: flaggedComments.moderatedBy,
            moderationNotes: flaggedComments.moderationNotes,
            createdAt: flaggedComments.createdAt,
            updatedAt: flaggedComments.updatedAt,
            comment: outfitComments.comment,
            reporterName: users.name,
          })
          .from(flaggedComments)
          .leftJoin(outfitComments, eq(flaggedComments.commentId, outfitComments.id))
          .leftJoin(users, eq(flaggedComments.reportedBy, users.id));

        if (input.status) {
          query = query.where(eq(flaggedComments.status, input.status));
        }

        const flagged = await query
          .orderBy(desc(flaggedComments.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return { flaggedComments: flagged, total: flagged.length };
      } catch (error) {
        console.error("Error fetching flagged comments:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch flagged comments",
        });
      }
    }),

  // Approve flagged comment (admin only)
  approveFlaggedComment: adminProcedure
    .input(
      z.object({
        flaggedCommentId: z.number().int().positive(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Update flagged comment status
        await db
          .update(flaggedComments)
          .set({
            status: "approved",
            moderatedBy: ctx.user.id,
            moderationNotes: input.notes,
            updatedAt: new Date(),
          })
          .where(eq(flaggedComments.id, input.flaggedCommentId));

        // Log moderation action
        const flagged = await db
          .select()
          .from(flaggedComments)
          .where(eq(flaggedComments.id, input.flaggedCommentId));

        if (flagged.length > 0) {
          await db.insert(moderationLogs).values({
            moderatorId: ctx.user.id,
            action: "approved",
            targetType: "comment",
            targetId: flagged[0].commentId,
            reason: flagged[0].reason,
            notes: input.notes,
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Error approving flagged comment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve flagged comment",
        });
      }
    }),

  // Reject flagged comment (admin only)
  rejectFlaggedComment: adminProcedure
    .input(
      z.object({
        flaggedCommentId: z.number().int().positive(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Update flagged comment status
        await db
          .update(flaggedComments)
          .set({
            status: "rejected",
            moderatedBy: ctx.user.id,
            moderationNotes: input.notes,
            updatedAt: new Date(),
          })
          .where(eq(flaggedComments.id, input.flaggedCommentId));

        // Log moderation action
        const flagged = await db
          .select()
          .from(flaggedComments)
          .where(eq(flaggedComments.id, input.flaggedCommentId));

        if (flagged.length > 0) {
          await db.insert(moderationLogs).values({
            moderatorId: ctx.user.id,
            action: "rejected",
            targetType: "comment",
            targetId: flagged[0].commentId,
            reason: flagged[0].reason,
            notes: input.notes,
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Error rejecting flagged comment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reject flagged comment",
        });
      }
    }),

  // Delete flagged comment (admin only)
  deleteFlaggedComment: adminProcedure
    .input(
      z.object({
        flaggedCommentId: z.number().int().positive(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Get flagged comment info
        const flagged = await db
          .select()
          .from(flaggedComments)
          .where(eq(flaggedComments.id, input.flaggedCommentId));

        if (flagged.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Flagged comment not found",
          });
        }

        // Delete the actual comment
        await db
          .delete(outfitComments)
          .where(eq(outfitComments.id, flagged[0].commentId));

        // Update flagged comment status
        await db
          .update(flaggedComments)
          .set({
            status: "deleted",
            moderatedBy: ctx.user.id,
            moderationNotes: input.notes,
            updatedAt: new Date(),
          })
          .where(eq(flaggedComments.id, input.flaggedCommentId));

        // Log moderation action
        await db.insert(moderationLogs).values({
          moderatorId: ctx.user.id,
          action: "deleted",
          targetType: "comment",
          targetId: flagged[0].commentId,
          reason: flagged[0].reason,
          notes: input.notes,
        });

        return { success: true };
      } catch (error) {
        console.error("Error deleting flagged comment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete flagged comment",
        });
      }
    }),

  // Get moderation logs (admin only)
  getModerationLogs: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(50),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const logs = await db
          .select({
            id: moderationLogs.id,
            moderatorId: moderationLogs.moderatorId,
            action: moderationLogs.action,
            targetType: moderationLogs.targetType,
            targetId: moderationLogs.targetId,
            reason: moderationLogs.reason,
            notes: moderationLogs.notes,
            createdAt: moderationLogs.createdAt,
            moderatorName: users.name,
          })
          .from(moderationLogs)
          .leftJoin(users, eq(moderationLogs.moderatorId, users.id))
          .orderBy(desc(moderationLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return { logs, total: logs.length };
      } catch (error) {
        console.error("Error fetching moderation logs:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch moderation logs",
        });
      }
    }),
});
