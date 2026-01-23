import { db } from '../db';
import { webhookEvents, webhookAlerts } from '../../drizzle/schema';
import { eq, and, lt } from 'drizzle-orm';

/**
 * Webhook Retry Configuration
 */
export const WEBHOOK_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 5000, // 5 seconds
  maxDelayMs: 300000, // 5 minutes
  backoffMultiplier: 2,
};

/**
 * Calculate next retry time with exponential backoff
 */
export function calculateNextRetryTime(retryCount: number): Date {
  const delayMs = Math.min(
    WEBHOOK_RETRY_CONFIG.initialDelayMs * Math.pow(WEBHOOK_RETRY_CONFIG.backoffMultiplier, retryCount),
    WEBHOOK_RETRY_CONFIG.maxDelayMs
  );
  return new Date(Date.now() + delayMs);
}

/**
 * Record webhook event for retry processing
 */
export async function recordWebhookEvent(
  source: string,
  eventType: string,
  externalEventId: string,
  payload: Record<string, any>
) {
  try {
    const result = await db.insert(webhookEvents).values({
      source,
      eventType,
      externalEventId,
      payload: JSON.stringify(payload),
      status: 'pending',
      retryCount: 0,
      maxRetries: WEBHOOK_RETRY_CONFIG.maxRetries,
      nextRetryAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return result;
  } catch (error) {
    console.error('[Webhook] Failed to record event:', error);
    throw error;
  }
}

/**
 * Mark webhook event as processed
 */
export async function markWebhookProcessed(
  externalEventId: string,
  status: 'success' | 'failed'
) {
  try {
    await db.update(webhookEvents)
      .set({
        status,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(webhookEvents.externalEventId, externalEventId));
  } catch (error) {
    console.error('[Webhook] Failed to mark processed:', error);
    throw error;
  }
}

/**
 * Mark webhook event for retry
 */
export async function scheduleWebhookRetry(
  externalEventId: string,
  error: string
) {
  try {
    const event = await db.query.webhookEvents.findFirst({
      where: eq(webhookEvents.externalEventId, externalEventId),
    });

    if (!event) {
      console.error('[Webhook] Event not found for retry:', externalEventId);
      return;
    }

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
        `[Webhook] Scheduled retry ${newRetryCount}/${event.maxRetries} for ${externalEventId} at ${nextRetryTime}`
      );
    } else {
      // Max retries exceeded
      await db.update(webhookEvents)
        .set({
          status: 'failed',
          error: `Max retries exceeded: ${error}`,
          updatedAt: new Date(),
        })
        .where(eq(webhookEvents.externalEventId, externalEventId));

      // Create alert for max retries
      await createWebhookAlert(
        'webhook_max_retries',
        'critical',
        event.id,
        null,
        `Webhook ${externalEventId} failed after ${event.maxRetries} retries`,
        error
      );

      console.error(
        `[Webhook] Max retries exceeded for ${externalEventId}: ${error}`
      );
    }
  } catch (error) {
    console.error('[Webhook] Failed to schedule retry:', error);
    throw error;
  }
}

/**
 * Get pending webhooks for retry
 */
export async function getPendingWebhooksForRetry() {
  try {
    const now = new Date();
    const events = await db.query.webhookEvents.findMany({
      where: and(
        eq(webhookEvents.status, 'retrying'),
        lt(webhookEvents.nextRetryAt, now)
      ),
    });
    return events;
  } catch (error) {
    console.error('[Webhook] Failed to get pending webhooks:', error);
    throw error;
  }
}

/**
 * Create webhook alert
 */
export async function createWebhookAlert(
  alertType: 'webhook_failed' | 'webhook_max_retries' | 'payment_unmatched' | 'payment_mismatch',
  severity: 'low' | 'medium' | 'high' | 'critical',
  webhookEventId: number | null,
  paymentReconciliationId: number | null,
  title: string,
  description: string
) {
  try {
    await db.insert(webhookAlerts).values({
      alertType,
      severity,
      webhookEventId,
      paymentReconciliationId,
      title,
      description,
      isResolved: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('[Webhook Alert] Failed to create alert:', error);
    throw error;
  }
}

/**
 * Get unresolved alerts
 */
export async function getUnresolvedAlerts() {
  try {
    const alerts = await db.query.webhookAlerts.findMany({
      where: eq(webhookAlerts.isResolved, 0),
    });
    return alerts;
  } catch (error) {
    console.error('[Webhook Alert] Failed to get alerts:', error);
    throw error;
  }
}
