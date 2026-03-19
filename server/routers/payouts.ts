import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
// import { payouts, payoutTransactions, payoutAuditLog, boutiqueBankAccounts } from "../../drizzle/schema";
import { boutiques } from "../../drizzle/schema";
// TODO: payouts, payoutTransactions, payoutAuditLog, boutiqueBankAccounts tables need to be created
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getPayout } from "../yoco-payouts";
import { requestInstantPayout, getInstantPayoutEligibility } from "../instant-payout";

export const payoutsRouter = router({
  /**
   * Get boutique payout history and earnings summary
   */
  getPayoutHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Get boutique ID for the current user
        const boutique = await db
          .select()
          .from(boutiques)
          .where(eq(boutiques.userId, ctx.user.id))
          .limit(1);

        if (boutique.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Boutique not found for user",
          });
        }

        const boutiqueId = boutique[0].id;

        // Build query
        let query = db
          .select()
          .from(payouts)
          .where(eq(payouts.boutiqueId, boutiqueId));

        if (input.status) {
          query = query.where(eq(payouts.status, input.status));
        }

        // Get total count
        const countResult = await db
          .select()
          .from(payouts)
          .where(
            input.status
              ? and(eq(payouts.boutiqueId, boutiqueId), eq(payouts.status, input.status))
              : eq(payouts.boutiqueId, boutiqueId)
          );

        // Get paginated results
        const payoutHistory = await query
          .orderBy(desc(payouts.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        // Calculate totals
        const totalRevenue = payoutHistory.reduce(
          (sum, p) => sum + parseFloat(p.totalRevenue),
          0
        );
        const totalPayout = payoutHistory.reduce(
          (sum, p) => sum + parseFloat(p.boutiquePayout),
          0
        );

        return {
          payouts: payoutHistory,
          pagination: {
            total: countResult.length,
            limit: input.limit,
            offset: input.offset,
            hasMore: input.offset + input.limit < countResult.length,
          },
          summary: {
            totalRevenue,
            totalPayout,
            averageRevenue: payoutHistory.length > 0 ? totalRevenue / payoutHistory.length : 0,
          },
        };
      } catch (error) {
        console.error("[Payouts Router] Error fetching payout history:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch payout history",
        });
      }
    }),

  /**
   * Get detailed payout information with transactions
   */
  getPayoutDetails: protectedProcedure
    .input(z.object({ payoutId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Get payout
        const payout = await db
          .select()
          .from(payouts)
          .where(eq(payouts.id, input.payoutId))
          .limit(1);

        if (payout.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payout not found",
          });
        }

        // Verify ownership
        const boutique = await db
          .select()
          .from(boutiques)
          .where(eq(boutiques.userId, ctx.user.id))
          .limit(1);

        if (boutique.length === 0 || boutique[0].id !== payout[0].boutiqueId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this payout",
          });
        }

        // Get transactions
        const transactions = await db
          .select()
          .from(payoutTransactions)
          .where(eq(payoutTransactions.payoutId, input.payoutId));

        // Get audit log
        const auditLog = await db
          .select()
          .from(payoutAuditLog)
          .where(eq(payoutAuditLog.payoutId, input.payoutId))
          .orderBy(desc(payoutAuditLog.createdAt));

        return {
          payout: payout[0],
          transactions,
          auditLog,
        };
      } catch (error) {
        console.error("[Payouts Router] Error fetching payout details:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch payout details",
        });
      }
    }),

  /**
   * Get boutique bank account details
   */
  getBankAccount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      // Get boutique
      const boutique = await db
        .select()
        .from(boutiques)
        .where(eq(boutiques.userId, ctx.user.id))
        .limit(1);

      if (boutique.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      // Get bank account
      const bankAccount = await db
        .select()
        .from(boutiqueBankAccounts)
        .where(eq(boutiqueBankAccounts.boutiqueId, boutique[0].id))
        .limit(1);

      if (bankAccount.length === 0) {
        return null;
      }

      // Return masked account number for security
      return {
        ...bankAccount[0],
        accountNumber: `****${bankAccount[0].accountNumber.slice(-4)}`,
      };
    } catch (error) {
      console.error("[Payouts Router] Error fetching bank account:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch bank account",
      });
    }
  }),

  /**
   * Get earnings summary for dashboard
   */
  getEarningsSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    try {
      // Get boutique
      const boutique = await db
        .select()
        .from(boutiques)
        .where(eq(boutiques.userId, ctx.user.id))
        .limit(1);

      if (boutique.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      const boutiqueId = boutique[0].id;

      // Get all payouts
      const allPayouts = await db
        .select()
        .from(payouts)
        .where(eq(payouts.boutiqueId, boutiqueId));

      // Calculate summaries
      const completed = allPayouts.filter((p) => p.status === "completed");
      const processing = allPayouts.filter((p) => p.status === "processing");
      const pending = allPayouts.filter((p) => p.status === "pending");
      const failed = allPayouts.filter((p) => p.status === "failed");

      const totalCompleted = completed.reduce(
        (sum, p) => sum + parseFloat(p.boutiquePayout),
        0
      );
      const totalProcessing = processing.reduce(
        (sum, p) => sum + parseFloat(p.boutiquePayout),
        0
      );
      const totalPending = pending.reduce(
        (sum, p) => sum + parseFloat(p.boutiquePayout),
        0
      );

      return {
        totalEarnings: totalCompleted,
        pendingPayouts: totalProcessing + totalPending,
        failedPayouts: failed.length,
        payoutCounts: {
          completed: completed.length,
          processing: processing.length,
          pending: pending.length,
          failed: failed.length,
        },
      };
    } catch (error) {
      console.error("[Payouts Router] Error fetching earnings summary:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch earnings summary",
      });
    }
  }),

  /**
   * Sync payout status with Yoco
   */
  syncPayoutStatus: protectedProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Get payout
        const payout = await db
          .select()
          .from(payouts)
          .where(eq(payouts.id, input.payoutId))
          .limit(1);

        if (payout.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payout not found",
          });
        }

        // Verify ownership
        const boutique = await db
          .select()
          .from(boutiques)
          .where(eq(boutiques.userId, ctx.user.id))
          .limit(1);

        if (boutique.length === 0 || boutique[0].id !== payout[0].boutiqueId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this payout",
          });
        }

        // If no Yoco payout ID, can't sync
        if (!payout[0].yocoPayoutId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payout not yet initiated with Yoco",
          });
        }

        // Get status from Yoco
        const yocoStatus = await getPayout(payout[0].yocoPayoutId);

        // Update local payout status
        await db
          .update(payouts)
          .set({
            status: yocoStatus.status,
            updatedAt: new Date(),
          })
          .where(eq(payouts.id, input.payoutId));

        // Log the sync
        await db.insert(payoutAuditLog).values({
          payout_id: input.payoutId,
          action: "payout_status_synced",
          oldStatus: payout[0].status,
          newStatus: yocoStatus.status,
          actorId: ctx.user.id,
          actorType: "boutique",
          details: JSON.stringify({
            yocoPayoutId: payout[0].yocoPayoutId,
            syncedAt: new Date().toISOString(),
          }),
        });

        return { status: yocoStatus.status };
      } catch (error) {
        console.error("[Payouts Router] Error syncing payout status:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync payout status",
        });
      }
    }),
});
