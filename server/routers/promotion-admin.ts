import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { promotions, promotionAwards } from "../../drizzle/schema";
import { LAUNCH_PROMOTION_KEY } from "../db.promotions";

/**
 * Launch promotion management. adminProcedure enforces role === 'admin'
 * server-side; nothing here is reachable by ordinary users.
 * Settings edits never touch awardedCount or promotion_awards.
 */
export const promotionAdminRouter = router({
  get: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const [row] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.promotionKey, LAUNCH_PROMOTION_KEY))
      .limit(1);
    if (!row) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Promotion row missing. Run the promotions SQL first.",
      });
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(promotionAwards)
      .where(eq(promotionAwards.promotionId, row.id));

    return {
      promotionKey: row.promotionKey,
      enabled: row.enabled,
      recipientLimit: row.recipientLimit,
      creditsPerUser: row.creditsPerUser,
      activatedAt: row.activatedAt,
      awarded: count,
      remaining: Math.max(0, row.recipientLimit - count),
    };
  }),

  update: adminProcedure
    .input(
      z
        .object({
          enabled: z.boolean().optional(),
          recipientLimit: z.number().int().min(0).max(1_000_000).optional(),
          creditsPerUser: z.number().int().min(1).max(1000).optional(),
        })
        .refine((v) => Object.values(v).some((x) => x !== undefined), {
          message: "Nothing to update",
        })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const set: Record<string, unknown> = { updatedAt: sql`CURRENT_TIMESTAMP` };
      if (input.recipientLimit !== undefined) set.recipientLimit = input.recipientLimit;
      if (input.creditsPerUser !== undefined) set.creditsPerUser = input.creditsPerUser;
      if (input.enabled !== undefined) {
        set.enabled = input.enabled;
        // Record the launch activation timestamp ONCE; re-enabling never moves it.
        if (input.enabled) {
          set.activatedAt = sql`COALESCE(${promotions.activatedAt}, CURRENT_TIMESTAMP)`;
        }
      }

      const updated = await db
        .update(promotions)
        .set(set)
        .where(eq(promotions.promotionKey, LAUNCH_PROMOTION_KEY))
        .returning({ id: promotions.id });

      if (updated.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Promotion row missing" });
      }
      return { success: true };
    }),
});
