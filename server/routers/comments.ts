import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { outfitComments, users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { TRPCError } from "@trpc/server";

export const commentsRouter = router({
  // Add a comment to an outfit
  addComment: protectedProcedure
    .input(
      z.object({
        outfitId: z.number().int().positive(),
        comment: z.string().min(1).max(500),
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
          .insert(outfitComments)
          .values({
            outfitId: input.outfitId,
            userId: ctx.user.id,
            comment: input.comment,
          })
          .returning();

        return {
          success: true,
          comment: result[0],
        };
      } catch (error) {
        console.error("Error adding comment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add comment",
        });
      }
    }),

  // Get comments for an outfit (paginated)
  getComments: publicProcedure
    .input(
      z.object({
        outfitId: z.number().int().positive(),
        limit: z.number().int().positive().default(10),
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

        const comments = await db
          .select({
            id: outfitComments.id,
            outfitId: outfitComments.outfitId,
            userId: outfitComments.userId,
            comment: outfitComments.comment,
            likes: outfitComments.likes,
            createdAt: outfitComments.createdAt,
            userName: users.name,
            userEmail: users.email,
          })
          .from(outfitComments)
          .leftJoin(users, eq(outfitComments.userId, users.id))
          .where(eq(outfitComments.outfitId, input.outfitId))
          .orderBy(desc(outfitComments.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          comments,
          total: comments.length,
        };
      } catch (error) {
        console.error("Error fetching comments:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch comments",
        });
      }
    }),

  // Get comment count for an outfit
  getCommentCount: publicProcedure
    .input(z.object({ outfitId: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const result = await db
          .select({ count: outfitComments.id })
          .from(outfitComments)
          .where(eq(outfitComments.outfitId, input.outfitId));

        return { count: result.length };
      } catch (error) {
        console.error("Error getting comment count:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get comment count",
        });
      }
    }),

  // Delete a comment (owner or admin only)
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Get the comment to verify ownership
        const comment = await db
          .select()
          .from(outfitComments)
          .where(eq(outfitComments.id, input.commentId));

        if (!comment || comment.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Comment not found",
          });
        }

        // Check if user is the owner or admin
        if (comment[0].userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own comments",
          });
        }

        await db
          .delete(outfitComments)
          .where(eq(outfitComments.id, input.commentId));

        return { success: true };
      } catch (error) {
        console.error("Error deleting comment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete comment",
        });
      }
    }),

  // Like a comment
  likeComment: protectedProcedure
    .input(z.object({ commentId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        const comment = await db
          .select()
          .from(outfitComments)
          .where(eq(outfitComments.id, input.commentId));

        if (!comment || comment.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Comment not found",
          });
        }

        const updatedComment = await db
          .update(outfitComments)
          .set({ likes: (comment[0].likes || 0) + 1 })
          .where(eq(outfitComments.id, input.commentId))
          .returning();

        return { success: true, comment: updatedComment[0] };
      } catch (error) {
        console.error("Error liking comment:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to like comment",
        });
      }
    }),
});
