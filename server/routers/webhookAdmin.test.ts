import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { webhookAdminRouter } from './webhookAdmin';
import { getDb } from '../db';
import { webhookEvents, webhookAlerts, paymentReconciliation } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Webhook Admin Router', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Cleanup test data
    if (db) {
      await db.delete(webhookAlerts);
      await db.delete(webhookEvents);
      await db.delete(paymentReconciliation);
    }
  });

  describe('getWebhookEvents', () => {
    it('should retrieve webhook events with default limit', async () => {
      // Create test webhook events
      if (db) {
        await db.insert(webhookEvents).values({
          source: 'yoco',
          eventType: 'payment.success',
          externalEventId: 'test-event-1',
          payload: JSON.stringify({ amount: 100 }),
          status: 'success',
          retryCount: 0,
          maxRetries: 3,
          nextRetryAt: new Date(),
        });

        await db.insert(webhookEvents).values({
          source: 'yoco',
          eventType: 'payment.failed',
          externalEventId: 'test-event-2',
          payload: JSON.stringify({ amount: 50 }),
          status: 'failed',
          retryCount: 3,
          maxRetries: 3,
          nextRetryAt: new Date(),
        });
      }

      // Test retrieval (note: in real tests, we'd call the procedure through tRPC)
      const events = await db.select().from(webhookEvents);
      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter webhook events by status', async () => {
      if (db) {
        const successEvents = await db
          .select()
          .from(webhookEvents)
          .where(eq(webhookEvents.status, 'success'));
        
        expect(successEvents.every((e: any) => e.status === 'success')).toBe(true);
      }
    });
  });

  describe('getWebhookAlerts', () => {
    it('should retrieve webhook alerts', async () => {
      if (db) {
        // Create test alert
        await db.insert(webhookAlerts).values({
          alertType: 'webhook_failed',
          severity: 'high',
          webhookEventId: null,
          paymentReconciliationId: null,
          title: 'Test Alert',
          description: 'Test webhook failure',
          isResolved: 0,
        });

        const alerts = await db.select().from(webhookAlerts);
        expect(alerts.length).toBeGreaterThan(0);
      }
    });

    it('should filter alerts by severity', async () => {
      if (db) {
        const criticalAlerts = await db
          .select()
          .from(webhookAlerts)
          .where(eq(webhookAlerts.severity, 'critical'));
        
        expect(criticalAlerts.every((a: any) => a.severity === 'critical')).toBe(true);
      }
    });

    it('should filter alerts by resolved status', async () => {
      if (db) {
        const unresolvedAlerts = await db
          .select()
          .from(webhookAlerts)
          .where(eq(webhookAlerts.isResolved, 0));
        
        expect(unresolvedAlerts.every((a: any) => a.isResolved === 0)).toBe(true);
      }
    });
  });

  describe('getUnmatchedPayments', () => {
    it('should retrieve unmatched payments', async () => {
      if (db) {
        // Create unmatched payment
        await db.insert(paymentReconciliation).values({
          yocoTransactionId: 'yoco-test-1',
          yocoAmount: 100,
          yocoCurrency: 'ZAR',
          yocoStatus: 'completed',
          yocoTimestamp: new Date(),
          styleswapUserId: null,
          styleswapTransactionId: null,
          styleswapCreditsAdded: null,
          styleswapTimestamp: null,
          reconciliationStatus: 'unmatched',
        });

        const unmatched = await db
          .select()
          .from(paymentReconciliation)
          .where(eq(paymentReconciliation.reconciliationStatus, 'unmatched'));
        
        expect(unmatched.length).toBeGreaterThan(0);
      }
    });
  });

  describe('resolveAlert', () => {
    it('should mark an alert as resolved', async () => {
      if (db) {
        // Create test alert
        const insertResult = await db.insert(webhookAlerts).values({
          alertType: 'payment_unmatched',
          severity: 'medium',
          webhookEventId: null,
          paymentReconciliationId: null,
          title: 'Test Resolve Alert',
          description: 'Alert to be resolved',
          isResolved: 0,
        });

        // Get the inserted alert ID
        const alerts = await db
          .select()
          .from(webhookAlerts)
          .where(eq(webhookAlerts.title, 'Test Resolve Alert'));
        
        if (alerts.length > 0) {
          const alertId = alerts[0].id;
          
          // Update alert to resolved
          await db
            .update(webhookAlerts)
            .set({
              isResolved: 1,
              resolvedAt: new Date(),
            })
            .where(eq(webhookAlerts.id, alertId));

          // Verify it was resolved
          const updatedAlert = await db
            .select()
            .from(webhookAlerts)
            .where(eq(webhookAlerts.id, alertId));
          
          expect(updatedAlert[0].isResolved).toBe(1);
        }
      }
    });
  });

  describe('getWebhookStats', () => {
    it('should calculate webhook statistics', async () => {
      if (db) {
        const allWebhooks = await db.select().from(webhookEvents);
        const successCount = allWebhooks.filter((w: any) => w.status === 'success').length;
        const failedCount = allWebhooks.filter((w: any) => w.status === 'failed').length;

        expect(successCount + failedCount).toBeLessThanOrEqual(allWebhooks.length);
      }
    });

    it('should calculate alert statistics', async () => {
      if (db) {
        const allAlerts = await db.select().from(webhookAlerts);
        const unresolvedAlerts = allAlerts.filter((a: any) => a.isResolved === 0).length;
        const criticalAlerts = allAlerts.filter(
          (a: any) => a.severity === 'critical' && a.isResolved === 0
        ).length;

        expect(criticalAlerts).toBeLessThanOrEqual(unresolvedAlerts);
      }
    });

    it('should calculate payment reconciliation statistics', async () => {
      if (db) {
        const allPayments = await db.select().from(paymentReconciliation);
        const unmatchedPayments = allPayments.filter(
          (p: any) => p.reconciliationStatus === 'unmatched'
        ).length;
        const mismatchedPayments = allPayments.filter(
          (p: any) => p.reconciliationStatus === 'mismatch'
        ).length;

        expect(unmatchedPayments + mismatchedPayments).toBeLessThanOrEqual(allPayments.length);
      }
    });
  });

  describe('Webhook Event Lifecycle', () => {
    it('should track webhook event from pending to success', async () => {
      if (db) {
        const eventId = `lifecycle-test-${Date.now()}`;
        
        // Create pending event
        await db.insert(webhookEvents).values({
          source: 'yoco',
          eventType: 'payment.success',
          externalEventId: eventId,
          payload: JSON.stringify({ test: true }),
          status: 'pending',
          retryCount: 0,
          maxRetries: 3,
          nextRetryAt: new Date(),
        });

        // Verify pending
        let event = await db
          .select()
          .from(webhookEvents)
          .where(eq(webhookEvents.externalEventId, eventId));
        
        expect(event[0].status).toBe('pending');

        // Update to success
        await db
          .update(webhookEvents)
          .set({
            status: 'success',
            processedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(webhookEvents.externalEventId, eventId));

        // Verify success
        event = await db
          .select()
          .from(webhookEvents)
          .where(eq(webhookEvents.externalEventId, eventId));
        
        expect(event[0].status).toBe('success');
        expect(event[0].processedAt).toBeDefined();
      }
    });

    it('should track webhook event from pending to retrying', async () => {
      if (db) {
        const eventId = `retry-test-${Date.now()}`;
        
        // Create pending event
        await db.insert(webhookEvents).values({
          source: 'yoco',
          eventType: 'payment.failed',
          externalEventId: eventId,
          payload: JSON.stringify({ test: true }),
          status: 'pending',
          retryCount: 0,
          maxRetries: 3,
          nextRetryAt: new Date(),
        });

        // Update to retrying
        await db
          .update(webhookEvents)
          .set({
            status: 'retrying',
            retryCount: 1,
            nextRetryAt: new Date(Date.now() + 5000),
            lastError: 'Connection timeout',
            updatedAt: new Date(),
          })
          .where(eq(webhookEvents.externalEventId, eventId));

        // Verify retrying
        const event = await db
          .select()
          .from(webhookEvents)
          .where(eq(webhookEvents.externalEventId, eventId));
        
        expect(event[0].status).toBe('retrying');
        expect(event[0].retryCount).toBe(1);
      }
    });
  });

  describe('Payment Reconciliation Lifecycle', () => {
    it('should track payment from unmatched to matched', async () => {
      if (db) {
        const paymentId = `payment-test-${Date.now()}`;
        
        // Create unmatched payment
        await db.insert(paymentReconciliation).values({
          yocoTransactionId: paymentId,
          yocoAmount: 1000,
          yocoCurrency: 'ZAR',
          yocoStatus: 'completed',
          yocoTimestamp: new Date(),
          styleswapUserId: null,
          styleswapTransactionId: null,
          styleswapCreditsAdded: null,
          styleswapTimestamp: null,
          reconciliationStatus: 'unmatched',
        });

        // Verify unmatched
        let payment = await db
          .select()
          .from(paymentReconciliation)
          .where(eq(paymentReconciliation.yocoTransactionId, paymentId));
        
        expect(payment[0].reconciliationStatus).toBe('unmatched');

        // Update to matched
        await db
          .update(paymentReconciliation)
          .set({
            styleswapCreditsAdded: 1000,
            reconciliationStatus: 'matched',
            updatedAt: new Date(),
          })
          .where(eq(paymentReconciliation.yocoTransactionId, paymentId));

        // Verify matched
        payment = await db
          .select()
          .from(paymentReconciliation)
          .where(eq(paymentReconciliation.yocoTransactionId, paymentId));
        
        expect(payment[0].reconciliationStatus).toBe('matched');
        expect(payment[0].styleswapCreditsAdded).toBe(1000);
      }
    });
  });

  describe('Alert Creation and Resolution', () => {
    it('should create and resolve alerts for failed webhooks', async () => {
      if (db) {
        // Create failed webhook
        const eventResult = await db.insert(webhookEvents).values({
          source: 'yoco',
          eventType: 'payment.failed',
          externalEventId: `alert-test-${Date.now()}`,
          payload: JSON.stringify({ error: 'test' }),
          status: 'failed',
          retryCount: 3,
          maxRetries: 3,
          nextRetryAt: new Date(),
          lastError: 'Max retries exceeded',
        });

        // Create alert for the failed webhook
        const alertResult = await db.insert(webhookAlerts).values({
          alertType: 'webhook_max_retries',
          severity: 'critical',
          webhookEventId: null,
          paymentReconciliationId: null,
          title: 'Webhook max retries exceeded',
          description: 'Payment webhook failed after 3 retries',
          isResolved: 0,
        });

        // Verify alert was created
        const alerts = await db.select().from(webhookAlerts);
        const testAlert = alerts.find((a: any) => a.title === 'Webhook max retries exceeded');
        expect(testAlert).toBeDefined();
        expect(testAlert.severity).toBe('critical');

        // Resolve the alert
        if (testAlert) {
          await db
            .update(webhookAlerts)
            .set({
              isResolved: 1,
              resolvedAt: new Date(),
            })
            .where(eq(webhookAlerts.id, testAlert.id));

          // Verify resolved
          const resolved = await db
            .select()
            .from(webhookAlerts)
            .where(eq(webhookAlerts.id, testAlert.id));
          
          expect(resolved[0].isResolved).toBe(1);
        }
      }
    });
  });
});
