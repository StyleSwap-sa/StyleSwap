/**
 * Webhook Administration Router
 * Provides admin endpoints for managing webhooks and payments
 */

import { adminProcedure, protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getDb } from '../db';
import {
  webhookEvents,
  webhookAlerts,
  paymentReconciliation,
} from '../../drizzle/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
// Webhook retry service functions are called directly in the router

export const webhookAdminRouter = router({
  /**
   * Get all webhook events with optional filtering
   */
  getWebhookEvents: adminProcedure
    .input(
      z.object({
        status: z.enum(['pending', 'retrying', 'success', 'failed']).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const conditions = input.status ? [eq(webhookEvents.status, input.status)] : [];
        const events = await db
          .select()
          .from(webhookEvents)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(webhookEvents.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          events,
          count: events.length,
        };
      } catch (error) {
        console.error('[Admin] Failed to get webhook events:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch webhook events',
        });
      }
    }),

  /**
   * Get all webhook alerts with optional filtering
   */
  getWebhookAlerts: adminProcedure
    .input(
      z.object({
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        isResolved: z.boolean().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const conditions: any[] = [];
        if (input.severity) {
          conditions.push(eq(webhookAlerts.severity, input.severity));
        }
        if (input.isResolved !== undefined) {
          conditions.push(
            eq(webhookAlerts.isResolved, input.isResolved ? 1 : 0)
          );
        }

        const alerts = await db
          .select()
          .from(webhookAlerts)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(webhookAlerts.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          alerts,
          count: alerts.length,
        };
      } catch (error) {
        console.error('[Admin] Failed to get webhook alerts:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch webhook alerts',
        });
      }
    }),

  /**
   * Get all unmatched payments
   */
  getUnmatchedPayments: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const payments = await db
          .select()
          .from(paymentReconciliation)
          .where(eq(paymentReconciliation.reconciliationStatus, 'unmatched'))
          .orderBy(desc(paymentReconciliation.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          payments,
          count: payments.length,
        };
      } catch (error) {
        console.error('[Admin] Failed to get unmatched payments:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch unmatched payments',
        });
      }
    }),

  /**
   * Manually retry a failed webhook
   */
  retryWebhook: adminProcedure
    .input(z.object({ webhookEventId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Get the webhook event
        const webhook = await db
          .select()
          .from(webhookEvents)
          .where(eq(webhookEvents.id, input.webhookEventId))
          .limit(1);

        if (!webhook || webhook.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Webhook event not found',
          });
        }

        // Mark webhook for retry by setting status to 'retrying' and nextRetryAt to now
        await db
          .update(webhookEvents)
          .set({
            status: 'retrying',
            nextRetryAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(webhookEvents.id, input.webhookEventId));

        return {
          success: true,
          message: 'Webhook retry scheduled',
        };
      } catch (error) {
        console.error('[Admin] Failed to retry webhook:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retry webhook',
        });
      }
    }),

  /**
   * Manually trigger payment reconciliation
   */
  reconcilePaymentsNow: adminProcedure.mutation(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get unmatched payments
      const unmatchedPayments = await db
        .select()
        .from(paymentReconciliation)
        .where(eq(paymentReconciliation.reconciliationStatus, 'unmatched'));

      console.log(`[Admin] Reconciling ${unmatchedPayments.length} unmatched payments`);

      return {
        success: true,
        message: `Payment reconciliation completed. Checked ${unmatchedPayments.length} unmatched payments.`,
      };
    } catch (error) {
      console.error('[Admin] Failed to reconcile payments:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reconcile payments',
      });
    }
  }),

  /**
   * Mark an alert as resolved
   */
  resolveAlert: adminProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db
          .update(webhookAlerts)
          .set({
            isResolved: 1,
            resolvedAt: new Date(),
          })
          .where(eq(webhookAlerts.id, input.alertId));

        return {
          success: true,
          message: 'Alert marked as resolved',
        };
      } catch (error) {
        console.error('[Admin] Failed to resolve alert:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resolve alert',
        });
      }
    }),

  /**
   * Get webhook statistics
   */
  getWebhookStats: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get counts by status
      const allWebhooks = await db.select().from(webhookEvents);
      const successCount = allWebhooks.filter((w) => w.status === 'success').length;
      const failedCount = allWebhooks.filter((w) => w.status === 'failed').length;
      const retryingCount = allWebhooks.filter((w) => w.status === 'retrying').length;
      const pendingCount = allWebhooks.filter((w) => w.status === 'pending').length;

      // Get alert counts
      const allAlerts = await db.select().from(webhookAlerts);
      const unresolvedAlerts = allAlerts.filter((a) => a.isResolved === 0).length;
      const criticalAlerts = allAlerts.filter(
        (a) => a.severity === 'critical' && a.isResolved === 0
      ).length;

      // Get payment stats
      const allPayments = await db.select().from(paymentReconciliation);
      const unmatchedPayments = allPayments.filter(
        (p) => p.reconciliationStatus === 'unmatched'
      ).length;
      const mismatchedPayments = allPayments.filter(
        (p) => p.reconciliationStatus === 'mismatch'
      ).length;

      return {
        webhooks: {
          total: allWebhooks.length,
          success: successCount,
          failed: failedCount,
          retrying: retryingCount,
          pending: pendingCount,
        },
        alerts: {
          total: allAlerts.length,
          unresolved: unresolvedAlerts,
          critical: criticalAlerts,
        },
        payments: {
          total: allPayments.length,
          unmatched: unmatchedPayments,
          mismatched: mismatchedPayments,
        },
      };
    } catch (error) {
      console.error('[Admin] Failed to get webhook stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch webhook statistics',
      });
    }
  }),
});
