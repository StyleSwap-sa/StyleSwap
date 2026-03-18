import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const freeTrialRouter = router({
  /**
   * Check if current user has a free trial available
   * Returns: { hasFreeTrial: boolean, freeTrialUsedAt: Date | null, freeTrialExpiresAt: Date | null }
   */
  checkFreeTrial: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return {
      hasFreeTrial: user.freeTrialUsed === 0,
      freeTrialUsedAt: user.freeTrialUsedAt,
      freeTrialExpiresAt: user.freeTrialExpiresAt,
      userId: user.id,
    };
  }),

  /**
   * Claim the free trial for a new user
   * Sets freeTrialUsed = 1 and freeTrialExpiresAt to 7 days from now
   */
  claimFreeTrial: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // Check if free trial already used
    if (user.freeTrialUsed === 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Free trial already used",
      });
    }

    // Calculate expiry date (7 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    // Update user record
    await db
      .update(users)
      .set({
        freeTrialUsed: 1,
        freeTrialUsedAt: new Date(),
        freeTrialExpiresAt: expiryDate,
      })
      .where(eq(users.id, ctx.user.id));

    return {
      success: true,
      message: "Free trial claimed successfully",
      expiresAt: expiryDate,
    };
  }),

  /**
   * Get free trial status for display in UI
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const now = new Date();
    const isExpired =
      user.freeTrialExpiresAt && new Date(user.freeTrialExpiresAt) < now;

    return {
      hasFreeTrial: user.freeTrialUsed === 0,
      isUsed: user.freeTrialUsed === 1,
      isExpired: isExpired,
      usedAt: user.freeTrialUsedAt,
      expiresAt: user.freeTrialExpiresAt,
      daysRemaining: user.freeTrialExpiresAt
        ? Math.ceil(
            (new Date(user.freeTrialExpiresAt).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
    };
  }),
});
