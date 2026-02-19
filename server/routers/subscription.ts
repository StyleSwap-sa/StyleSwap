import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getSubscriptionDetails,
  cancelSubscription,
} from "../middleware/subscriptionValidation";
import { getDb } from "../db";
import { getBoutiqueUserRole, getBoutiqueById } from "../db.boutiques";

/**
 * User-Facing Subscription Management Router
 * Allows boutique owners/managers to manage their own subscriptions
 */

export const subscriptionRouter = router({
  /**
   * Get subscription details for a boutique
   * Available to: boutique owner/manager
   */
  getSubscription: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check authorization - owner/manager only
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || (userRole.role !== "owner" && userRole.role !== "manager")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this subscription",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const subscription = await db.query.raw(
        `SELECT * FROM boutiqueSubscriptions WHERE boutiqueId = ? LIMIT 1`,
        [input.boutiqueId]
      );

      if (!subscription?.[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found for this boutique",
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
   * Cancel subscription
   * Available to: boutique owner/manager
   * 
   * This endpoint allows boutique owners/managers to cancel their own subscription.
   * The cancellation takes effect immediately and cannot be undone without contacting support.
   */
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        reason: z.string().optional().describe("Optional reason for cancellation"),
        feedback: z.string().optional().describe("Optional feedback about the service"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization - owner/manager only
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || (userRole.role !== "owner" && userRole.role !== "manager")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to cancel this subscription",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Verify subscription exists and is active
      const subscription = await db.query.raw(
        `SELECT * FROM boutiqueSubscriptions WHERE boutiqueId = ? LIMIT 1`,
        [input.boutiqueId]
      );

      if (!subscription?.[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found for this boutique",
        });
      }

      if (subscription[0].status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This subscription is already cancelled",
        });
      }

      if (subscription[0].status === "suspended") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This subscription is suspended. Please contact support to cancel.",
        });
      }

      // Cancel subscription
      await cancelSubscription(input.boutiqueId);

      // Log cancellation action with reason and feedback
      await db.query.raw(
        `INSERT INTO subscriptionAuditLog (boutiqueId, action, reason, createdAt) VALUES (?, 'CANCELLED_BY_USER', ?, NOW())`,
        [input.boutiqueId, input.reason || "User-initiated cancellation"]
      );

      // Store cancellation feedback if provided
      if (input.feedback) {
        await db.query.raw(
          `INSERT INTO cancellationFeedback (boutiqueId, feedback, reason, userId, createdAt) 
           VALUES (?, ?, ?, ?, NOW())`,
          [input.boutiqueId, input.feedback, input.reason || null, ctx.user.id]
        );
      }

      // Send notification to boutique owner
      try {
        await db.query.raw(
          `INSERT INTO notifications (boutiqueId, userId, type, title, message, read, createdAt) 
           VALUES (?, ?, 'subscription_cancelled', 'Subscription Cancelled', 
           'Your subscription has been cancelled. You can reactivate it anytime from your account settings.', 0, NOW())`,
          [input.boutiqueId, ctx.user.id]
        );
      } catch (error) {
        console.error("Failed to create notification:", error);
        // Don't fail the cancellation if notification fails
      }

      return {
        success: true,
        message: "Your subscription has been cancelled successfully",
        cancelledAt: new Date().toISOString(),
        nextBillingDate: null,
        note: "You can reactivate your subscription anytime from your account settings",
      };
    }),

  /**
   * Get cancellation reasons (for UI dropdown)
   * Available to: authenticated users
   */
  getCancellationReasons: protectedProcedure.query(async () => {
    return [
      {
        id: "too_expensive",
        label: "Too expensive",
        description: "The pricing doesn't fit my budget",
      },
      {
        id: "not_using",
        label: "Not using the service",
        description: "I'm not using the service enough",
      },
      {
        id: "poor_quality",
        label: "Poor quality results",
        description: "The try-on quality doesn't meet my expectations",
      },
      {
        id: "found_alternative",
        label: "Found a better alternative",
        description: "I found a better service",
      },
      {
        id: "technical_issues",
        label: "Technical issues",
        description: "I'm experiencing technical problems",
      },
      {
        id: "poor_support",
        label: "Poor customer support",
        description: "The support team wasn't helpful",
      },
      {
        id: "business_closed",
        label: "Closing my business",
        description: "I'm closing my business",
      },
      {
        id: "other",
        label: "Other",
        description: "Other reason",
      },
    ];
  }),

  /**
   * Reactivate a cancelled subscription
   * Available to: boutique owner/manager
   * 
   * This endpoint allows boutique owners/managers to reactivate their cancelled subscription.
   * The subscription will be reactivated with the same plan and billing cycle.
   */
  reactivateSubscription: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check authorization - owner/manager only
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || (userRole.role !== "owner" && userRole.role !== "manager")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to reactivate this subscription",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Verify subscription exists and is cancelled
      const subscription = await db.query.raw(
        `SELECT * FROM boutiqueSubscriptions WHERE boutiqueId = ? LIMIT 1`,
        [input.boutiqueId]
      );

      if (!subscription?.[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found for this boutique",
        });
      }

      if (subscription[0].status !== "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only cancelled subscriptions can be reactivated",
        });
      }

      // Reactivate subscription
      await db.query.raw(
        `UPDATE boutiqueSubscriptions SET status = 'active', updatedAt = NOW() WHERE boutiqueId = ?`,
        [input.boutiqueId]
      );

      // Log reactivation action
      await db.query.raw(
        `INSERT INTO subscriptionAuditLog (boutiqueId, action, reason, createdAt) VALUES (?, 'REACTIVATED_BY_USER', 'User-initiated reactivation', NOW())`,
        [input.boutiqueId]
      );

      // Send notification to boutique owner
      try {
        await db.query.raw(
          `INSERT INTO notifications (boutiqueId, userId, type, title, message, read, createdAt) 
           VALUES (?, ?, 'subscription_reactivated', 'Subscription Reactivated', 
           'Your subscription has been reactivated successfully!', 0, NOW())`,
          [input.boutiqueId, ctx.user.id]
        );
      } catch (error) {
        console.error("Failed to create notification:", error);
        // Don't fail the reactivation if notification fails
      }

      return {
        success: true,
        message: "Your subscription has been reactivated successfully",
        reactivatedAt: new Date().toISOString(),
        status: "active",
      };
    }),
});
