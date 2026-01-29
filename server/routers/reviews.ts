import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { reviews } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const reviewsRouter = router({
  // Submit a new review
  submitReview: protectedProcedure
    .input(
      z.object({
        tryOnResultId: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const review = await db.insert(reviews).values({
        userId: ctx.user.id,
        tryOnResultId: input.tryOnResultId,
        rating: input.rating,
        comment: input.comment,
      });

      return {
        success: true,
        reviewId: review[0],
      };
    }),

  // Get reviews for a specific try-on result
  getReviewsForTryOn: protectedProcedure
    .input(z.object({ tryOnResultId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const reviewList = await db
        .select()
        .from(reviews)
        .where(eq(reviews.tryOnResultId, input.tryOnResultId))
        .orderBy(desc(reviews.createdAt));

      return reviewList;
    }),

  // Get all reviews by a user
  getUserReviews: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, ctx.user.id))
      .orderBy(desc(reviews.createdAt));

    return userReviews;
  }),

  // Get average rating for a try-on result
  getAverageRating: protectedProcedure
    .input(z.object({ tryOnResultId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .select()
        .from(reviews)
        .where(eq(reviews.tryOnResultId, input.tryOnResultId));

      if (result.length === 0) {
        return { averageRating: 0, totalReviews: 0 };
      }

      const sum = result.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / result.length;

      return {
        averageRating: Math.round(average * 10) / 10,
        totalReviews: result.length,
      };
    }),

  // Mark review as helpful
  markHelpful: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(reviews)
        .set({ helpful: db.raw("helpful + 1") })
        .where(eq(reviews.id, input.reviewId));

      return { success: true };
    }),
});
