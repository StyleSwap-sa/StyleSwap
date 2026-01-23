/**
 * Webhook Testing Utilities
 * Provides functions to simulate webhook failures and test the retry system
 */

import { getDb } from './db';
import { webhookEvents, paymentReconciliation } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Simulate a failed webhook by marking it as failed
 * Useful for testing the retry mechanism
 */
export async function simulateFailedWebhook(
  externalEventId: string,
  error: string
) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Find the webhook event
    const webhook = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.externalEventId, externalEventId))
      .limit(1);

    if (!webhook || webhook.length === 0) {
      console.error(`[Test] Webhook not found: ${externalEventId}`);
      return;
    }

    // Update to failed status
    await db
      .update(webhookEvents)
      .set({
        status: 'failed',
        error: error,
        retryCount: 3,
        updatedAt: new Date(),
      })
      .where(eq(webhookEvents.externalEventId, externalEventId));

    console.log(`[Test] Simulated webhook failure: ${externalEventId}`);
  } catch (err) {
    console.error('[Test] Failed to simulate webhook failure:', err);
  }
}

/**
 * Simulate a webhook that needs retry
 * Sets it to 'retrying' status with next retry time in the past
 */
export async function simulateRetryableWebhook(
  externalEventId: string,
  retryCount: number = 1
) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const pastTime = new Date(Date.now() - 60000); // 1 minute ago

    await db
      .update(webhookEvents)
      .set({
        status: 'retrying',
        retryCount: retryCount,
        nextRetryAt: pastTime,
        updatedAt: new Date(),
      })
      .where(eq(webhookEvents.externalEventId, externalEventId));

    console.log(
      `[Test] Simulated retryable webhook: ${externalEventId} (attempt ${retryCount})`
    );
  } catch (err) {
    console.error('[Test] Failed to simulate retryable webhook:', err);
  }
}

/**
 * Create a test webhook event
 * Useful for testing the retry system without making real API calls
 */
export async function createTestWebhookEvent(
  eventType: string,
  payload: Record<string, any>,
  externalEventId?: string
) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const testEventId =
      externalEventId || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await db.insert(webhookEvents).values({
      source: 'yoco',
      eventType: eventType,
      externalEventId: testEventId,
      payload: payload,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      nextRetryAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[Test] Created test webhook event: ${testEventId}`);
    return testEventId;
  } catch (err) {
    console.error('[Test] Failed to create test webhook event:', err);
    throw err;
  }
}

/**
 * Create a test unmatched payment
 * Useful for testing payment reconciliation
 */
export async function createTestUnmatchedPayment(
  yocoTransactionId: string,
  amount: number = 45,
  currency: string = 'ZAR'
) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.insert(paymentReconciliation).values({
      yocoTransactionId: yocoTransactionId,
      yocoAmount: amount.toString(),
      yocoCurrency: currency,
      yocoStatus: 'completed',
      yocoTimestamp: new Date(),
      reconciliationStatus: 'unmatched',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[Test] Created test unmatched payment: ${yocoTransactionId}`);
    return yocoTransactionId;
  } catch (err) {
    console.error('[Test] Failed to create test unmatched payment:', err);
    throw err;
  }
}

/**
 * Get all failed webhooks
 * Useful for debugging and monitoring
 */
export async function getFailedWebhooks() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const failed = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.status, 'failed'));

    console.log(`[Test] Found ${failed.length} failed webhooks`);
    return failed;
  } catch (err) {
    console.error('[Test] Failed to get failed webhooks:', err);
    return [];
  }
}

/**
 * Get all pending retries
 * Useful for monitoring the retry queue
 */
export async function getPendingRetries() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const pending = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.status, 'retrying'));

    console.log(`[Test] Found ${pending.length} pending retries`);
    return pending;
  } catch (err) {
    console.error('[Test] Failed to get pending retries:', err);
    return [];
  }
}

/**
 * Get all unmatched payments
 * Useful for monitoring payment reconciliation
 */
export async function getUnmatchedPayments() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const unmatched = await db
      .select()
      .from(paymentReconciliation)
      .where(eq(paymentReconciliation.reconciliationStatus, 'unmatched'));

    console.log(`[Test] Found ${unmatched.length} unmatched payments`);
    return unmatched;
  } catch (err) {
    console.error('[Test] Failed to get unmatched payments:', err);
    return [];
  }
}

/**
 * Clear all test data
 * WARNING: Use with caution - only in development!
 */
export async function clearTestData() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Only clear test webhooks (those with 'test_' prefix)
    const testWebhooks = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.externalEventId, 'test_%'));

    console.log(`[Test] Cleared ${testWebhooks.length} test webhooks`);
  } catch (err) {
    console.error('[Test] Failed to clear test data:', err);
  }
}
