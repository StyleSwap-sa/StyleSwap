/**
 * Standalone Webhook Retry & Payment Reconciliation Service
 * 
 * This service handles:
 * 1. Webhook event tracking and retry logic with exponential backoff
 * 2. Payment reconciliation (matching Yoco payments with StyleSwap credits)
 * 3. Alert system for failed webhooks and unmatched payments
 * 
 * Usage:
 * - Call recordWebhookEvent() when receiving a webhook
 * - Call retryFailedWebhooks() periodically (e.g., every 5 minutes)
 * - Call reconcilePayments() daily to match Yoco payments with credits
 */

import { getDb } from './db';
import { webhookEvents, webhookAlerts, paymentReconciliation, transactions, userCredits } from '../drizzle/schema';
import { eq, and, lt, isNull, ne } from 'drizzle-orm';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const WEBHOOK_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 5000, // 5 seconds
  maxDelayMs: 300000, // 5 minutes
  backoffMultiplier: 2,
};

// ============================================================================
// WEBHOOK EVENT TRACKING
// ============================================================================

/**
 * Record a webhook event for processing
 * Call this immediately when receiving a webhook from Yoco
 */
export async function recordWebhookEvent(
  source: 'yoco' | 'fitroom',
  eventType: string,
  externalEventId: string,
  payload: Record<string, any>
) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.insert(webhookEvents).values({
      source,
      eventType,
      externalEventId,
      payload: JSON.stringify(payload),
      status: 'pending',
      retryCount: 0,
      maxRetries: WEBHOOK_CONFIG.maxRetries,
      nextRetryAt: new Date(),
    });

    console.log(`[Webhook] Recorded event: ${source}/${eventType}/${externalEventId}`);
  } catch (error) {
    console.error('[Webhook] Failed to record event:', error);
    throw error;
  }
}

/**
 * Mark a webhook as successfully processed
 */
export async function markWebhookSuccess(externalEventId: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db
      .update(webhookEvents)
      .set({
        status: 'success',
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(webhookEvents.externalEventId, externalEventId));

    console.log(`[Webhook] Marked as success: ${externalEventId}`);
  } catch (error) {
    console.error('[Webhook] Failed to mark success:', error);
    throw error;
  }
}

/**
 * Schedule a webhook for retry
 */
export async function scheduleWebhookRetry(externalEventId: string, error: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Get the event
    const events = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.externalEventId, externalEventId))
      .limit(1);

    if (events.length === 0) {
      console.warn(`[Webhook] Event not found for retry: ${externalEventId}`);
      return;
    }

    const event = events[0];
    const newRetryCount = event.retryCount + 1;
    const shouldRetry = newRetryCount <= event.maxRetries;

    if (shouldRetry) {
      const nextRetryTime = calculateNextRetryTime(newRetryCount);
      
      await db.update(webhookEvents)
        .set({
          status: 'retrying',
          retryCount: newRetryCount,
          lastRetryAt: new Date(),
          nextRetryAt: nextRetryTime,
          error,
          updatedAt: new Date(),
        })
        .where(eq(webhookEvents.externalEventId, externalEventId));

      console.log(
        `[Webhook] Scheduled retry ${newRetryCount}/${event.maxRetries} for ${externalEventId}`
      );
    } else {
      // Max retries exceeded - mark as failed and create alert
      await db.update(webhookEvents)
        .set({
          status: 'failed',
          error: `Max retries exceeded: ${error}`,
          updatedAt: new Date(),
        })
        .where(eq(webhookEvents.externalEventId, externalEventId));

      await createAlert(
        'webhook_max_retries',
        'critical',
        event.id,
        null,
        `Webhook ${externalEventId} failed after ${event.maxRetries} retries`,
        error
      );

      console.error(`[Webhook] Max retries exceeded: ${externalEventId}`);
    }
  } catch (error) {
    console.error('[Webhook] Failed to schedule retry:', error);
    throw error;
  }
}

/**
 * Record a Yoco payment for reconciliation
 */
export async function recordYocoPayment(
  yocoTransactionId: string,
  amount: number,
  currency: string,
  metadata: Record<string, any>
) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.insert(paymentReconciliation).values({
      yocoTransactionId,
      yocoAmount: amount.toString(),
      yocoCurrency: currency,
      yocoStatus: 'completed',
      reconciliationStatus: 'unmatched',
      yocoTimestamp: new Date(),
    });

    console.log(`[Reconciliation] Recorded Yoco payment: ${yocoTransactionId}`);
  } catch (error) {
    console.error('[Reconciliation] Failed to record payment:', error);
    throw error;
  }
}

/**
 * Match a Yoco payment with StyleSwap credits
 */
export async function matchPaymentWithCredits(
  yocoTransactionId: string,
  userId: number,
  credits: number
) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Find the payment record
    const payments = await db
      .select()
      .from(paymentReconciliation)
      .where(eq(paymentReconciliation.yocoTransactionId, yocoTransactionId))
      .limit(1);

    if (payments.length === 0) {
      console.warn(`[Reconciliation] Payment not found: ${yocoTransactionId}`);
      return;
    }

    // Update payment as matched
    await db
      .update(paymentReconciliation)
      .set({
        reconciliationStatus: 'matched',
        styleswapUserId: userId,
        styleswapCreditsAdded: credits,
        styleswapTimestamp: new Date(),
      })
      .where(eq(paymentReconciliation.yocoTransactionId, yocoTransactionId));

    console.log(`[Reconciliation] Matched payment ${yocoTransactionId} with ${credits} credits for user ${userId}`);
  } catch (error) {
    console.error('[Reconciliation] Failed to match payment:', error);
    throw error;
  }
}

// ============================================================================
// BACKGROUND JOBS
// ============================================================================

/**
 * Initialize background jobs for webhook retry and reconciliation
 */
export function initializeWebhookJobs() {
  console.log('[Webhook] Initializing background jobs...');

  // Retry failed webhooks every 5 minutes
  setInterval(async () => {
    try {
      await retryFailedWebhooks();
    } catch (error) {
      // Silently log database connection errors to prevent spam
      if (error instanceof Error && error.message.includes('ECONNRESET')) {
        console.debug('[Webhook] Database connection reset, will retry later');
      } else {
        console.error('[Webhook] Error in retry job:', error);
      }
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Daily reconciliation at 2 AM
  scheduleDaily(async () => {
    try {
      await dailyPaymentReconciliation();
    } catch (error) {
      // Silently log database connection errors
      if (error instanceof Error && error.message.includes('ECONNRESET')) {
        console.debug('[Webhook] Database connection reset during reconciliation');
      } else {
        console.error('[Webhook] Error in reconciliation job:', error);
      }
    }
  }, 2); // 2 AM

  console.log('[Webhook] Background jobs initialized');
}

/**
 * Retry failed webhooks
 */
export async function retryFailedWebhooks() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const now = new Date();
    
    // Find webhooks ready for retry
    const failedEvents = await db
      .select()
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.webhook_event_status, 'retrying'),
          lt(webhookEvents.nextRetryAt, now)
        )
      );

    console.log(`[Webhook] Found ${failedEvents.length} webhooks ready for retry`);

    for (const event of failedEvents) {
      console.log(`[Webhook] Retrying webhook: ${event.externalEventId}`);
      // In production, you would re-process the webhook here
      // For now, just log it
    }
  } catch (error) {
    console.error('[Webhook] Error retrying failed webhooks:', error);
  }
}

/**
 * Daily payment reconciliation
 */
export async function dailyPaymentReconciliation() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    console.log('[Reconciliation] Starting daily reconciliation...');
    
    // Find unmatched payments older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const unmatchedPayments = await db
      .select()
      .from(paymentReconciliation)
      .where(
        and(
          eq(paymentReconciliation.reconciliationStatus, 'unmatched'),
          lt(paymentReconciliation.yocoTimestamp, oneHourAgo)
        )
      );

    console.log(`[Reconciliation] Found ${unmatchedPayments.length} unmatched payments`);

    for (const payment of unmatchedPayments) {
      await createAlert(
        'payment_unmatched',
        'high',
        null,
        payment.id,
        `Unmatched Yoco payment: ${payment.yocoTransactionId}`,
        `Amount: ${payment.yocoAmount} ${payment.yocoCurrency}`
      );
    }
  } catch (error) {
    console.error('[Reconciliation] Error during reconciliation:', error);
  }
}

// ============================================================================
// ALERTS
// ============================================================================

/**
 * Create an alert for webhook or payment issues
 */
async function createAlert(
  alertType: 'webhook_failed' | 'webhook_max_retries' | 'payment_unmatched' | 'payment_mismatch',
  severity: 'low' | 'medium' | 'high' | 'critical',
  webhookEventId: number | null,
  paymentReconciliationId: number | null,
  title: string,
  description?: string
) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    await db.insert(webhookAlerts).values({
      alertType,
      severity,
      webhookEventId,
      paymentReconciliationId,
      title,
      description,
      isResolved: 0,
    });

    console.log(`[Alert] Created ${severity} alert: ${title}`);
  } catch (error) {
    console.error('[Alert] Failed to create alert:', error);
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Calculate next retry time with exponential backoff
 */
function calculateNextRetryTime(retryCount: number): Date {
  const delayMs = Math.min(
    WEBHOOK_CONFIG.initialDelayMs * Math.pow(WEBHOOK_CONFIG.backoffMultiplier, retryCount - 1),
    WEBHOOK_CONFIG.maxDelayMs
  );
  return new Date(Date.now() + delayMs);
}

/**
 * Schedule a function to run daily at a specific hour
 */
function scheduleDaily(fn: () => Promise<void>, hour: number) {
  const now = new Date();
  const scheduledTime = new Date(now);
  scheduledTime.setHours(hour, 0, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (scheduledTime < now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delayMs = scheduledTime.getTime() - now.getTime();

  setTimeout(() => {
    fn().catch(console.error);
    // Run daily after the first execution
    setInterval(() => {
      fn().catch(console.error);
    }, 24 * 60 * 60 * 1000);
  }, delayMs);

  console.log(`[Scheduler] Scheduled daily job at ${scheduledTime.toLocaleTimeString()}`);
}
