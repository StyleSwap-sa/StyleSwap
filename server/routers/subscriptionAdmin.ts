import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  validateSubscription,
  getSubscriptionDetails,
  suspendSubscription,
  reactivateSubscription,
  cancelSubscription,
} from "../middleware/subscriptionValidation";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

export const subscriptionAdminRouter = router({
  /**
   * Get all boutique subscriptions (admin only)
   */
  listSubscriptions: adminProcedure
    .input(
      z.object({
        status: z.enum(["active", "inactive", "suspended", "expired", "cancelled"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { subscriptions: [], total: 0 };

      let query = `SELECT bs.*, b.name as boutiqueName, b.status as boutiqueStatus FROM boutiqueSubscriptions bs 
                   JOIN boutiques b ON b.id = bs.boutiqueId`;
      const params: any[] = [];

      if (input.status) {
        query += ` WHERE bs.status = ?`;
        params.push(input.status);
      }

      query += ` ORDER BY bs.updatedAt DESC LIMIT ? OFFSET ?`;
      params.push(input.limit, input.offset);

      const subscriptions = await db.query.raw(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM boutiqueSubscriptions`;
      if (input.status) {
        countQuery += ` WHERE status = ?`;
      }

      const countResult = await db.query.raw(
        countQuery,
        input.status ? [input.status] : []
      );
      const total = countResult?.[0]?.total || 0;

      return {
        subscriptions: subscriptions || [],
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get subscription details for a boutique (admin only)
   */
  getSubscription: adminProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const subscription = await db.query.raw(
        `SELECT * FROM boutiqueSubscriptions WHERE boutiqueId = ? LIMIT 1`,
        [input.boutiqueId]
      );

      if (!subscription?.[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Subscription not found for boutique ${input.boutiqueId}`,
        });
      }

      // Get last payment
      const payment = await db.query.raw(
        `SELECT * FROM payments WHERE boutiqueId = ? AND status = 'completed' ORDER BY createdAt DESC LIMIT 1`,
        [input.boutiqueId]
      );

      return {
        subscription: subscription[0],
        lastPayment: payment?.[0] || null,
      };
    }),

  /**
   * Get subscription status for a user (admin only)
   */
  getUserSubscriptionStatus: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await getSubscriptionDetails(input.userId);
    }),

  /**
   * Suspend subscription (for non-payment) (admin only)
   */
  suspendSubscription: adminProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify subscription exists
      const subscription = await db.query.raw(
        `SELECT * FROM boutiqueSubscriptions WHERE boutiqueId = ? LIMIT 1`,
        [input.boutiqueId]
      );

      if (!subscription?.[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Subscription not found for boutique ${input.boutiqueId}`,
        });
      }

      // Suspend subscription
      await suspendSubscription(input.boutiqueId);

      // Log action
      await db.query.raw(
        `INSERT INTO subscriptionAuditLog (boutiqueId, action, reason, createdAt) VALUES (?, 'SUSPENDED', ?, NOW())`,
        [input.boutiqueId, input.reason || "Admin suspension"]
      );

      return {
        success: true,
        message: `Subscription suspended for boutique ${input.boutiqueId}`,
        reason: input.reason,
      };
    }),

  /**
   * Reactivate subscription (after payment) (admin only)
   */
  reactivateSubscription: adminProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify subscription exists
      const subscription = await db.query.raw(
        `SELECT * FROM boutiqueSubscriptions WHERE boutiqueId = ? LIMIT 1`,
        [input.boutiqueId]
      );

      if (!subscription?.[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Subscription not found for boutique ${input.boutiqueId}`,
        });
      }

      // Reactivate subscription
      await reactivateSubscription(input.boutiqueId);

      // Log action
      await db.query.raw(
        `INSERT INTO subscriptionAuditLog (boutiqueId, action, reason, createdAt) VALUES (?, 'REACTIVATED', ?, NOW())`,
        [input.boutiqueId, input.reason || "Admin reactivation"]
      );

      return {
        success: true,
        message: `Subscription reactivated for boutique ${input.boutiqueId}`,
        reason: input.reason,
      };
    }),

  /**
   * Cancel subscription (admin only)
   */
  cancelSubscription: adminProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify subscription exists
      const subscription = await db.query.raw(
        `SELECT * FROM boutiqueSubscriptions WHERE boutiqueId = ? LIMIT 1`,
        [input.boutiqueId]
      );

      if (!subscription?.[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Subscription not found for boutique ${input.boutiqueId}`,
        });
      }

      // Cancel subscription
      await cancelSubscription(input.boutiqueId);

      // Log action
      await db.query.raw(
        `INSERT INTO subscriptionAuditLog (boutiqueId, action, reason, createdAt) VALUES (?, 'CANCELLED', ?, NOW())`,
        [input.boutiqueId, input.reason || "Admin cancellation"]
      );

      return {
        success: true,
        message: `Subscription cancelled for boutique ${input.boutiqueId}`,
        reason: input.reason,
      };
    }),

  /**
   * Get subscription audit log (admin only)
   */
  getAuditLog: adminProcedure
    .input(
      z.object({
        boutiqueId: z.number().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let query = `SELECT * FROM subscriptionAuditLog`;
      const params: any[] = [];

      if (input.boutiqueId) {
        query += ` WHERE boutiqueId = ?`;
        params.push(input.boutiqueId);
      }

      query += ` ORDER BY createdAt DESC LIMIT ?`;
      params.push(input.limit);

      const logs = await db.query.raw(query, params);
      return logs || [];
    }),

  /**
   * Get subscription statistics (admin only)
   */
  getStatistics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const stats = await db.query.raw(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN billingCycle = 'monthly' THEN 1 ELSE 0 END) as monthlyCount,
        SUM(CASE WHEN billingCycle = 'annual' THEN 1 ELSE 0 END) as annualCount
      FROM boutiqueSubscriptions`
    );

    return stats?.[0] || null;
  }),
});
