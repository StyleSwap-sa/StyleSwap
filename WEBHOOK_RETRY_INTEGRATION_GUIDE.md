# Webhook Retry & Payment Reconciliation Integration Guide

## Overview

This guide explains how to integrate the standalone webhook retry service (`server/webhookRetryService.ts`) into your StyleSwap platform. The service handles:

1. **Webhook Event Tracking** - Records all incoming webhooks for audit trail
2. **Automatic Retry Logic** - Retries failed webhooks with exponential backoff (3 attempts max)
3. **Payment Reconciliation** - Matches Yoco payments with StyleSwap credit uploads
4. **Alert System** - Creates alerts for failed webhooks and unmatched payments

---

## Database Tables

The service uses 3 new database tables (already created):

### 1. `webhookEvents`
Tracks all incoming webhooks and their processing status.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | int | Primary key |
| `source` | enum('yoco', 'fitroom') | Where webhook came from |
| `eventType` | varchar | Type of event (e.g., 'payment.success') |
| `externalEventId` | varchar | Unique ID from external service |
| `payload` | json | Full webhook payload (for replay) |
| `status` | enum | 'pending', 'retrying', 'success', 'failed' |
| `retryCount` | int | Number of retry attempts |
| `maxRetries` | int | Maximum retries allowed (default: 3) |
| `nextRetryAt` | timestamp | When to retry next |
| `processedAt` | timestamp | When successfully processed |
| `error` | text | Error message if failed |
| `createdAt` | timestamp | When webhook received |
| `updatedAt` | timestamp | Last update time |

### 2. `paymentReconciliation`
Matches Yoco payments with StyleSwap credit uploads.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | int | Primary key |
| `yocoTransactionId` | varchar | Yoco transaction ID |
| `yocoAmount` | decimal | Amount charged by Yoco |
| `yocoCurrency` | varchar | Currency (e.g., 'ZAR') |
| `yocoStatus` | varchar | Payment status from Yoco |
| `yocoTimestamp` | timestamp | When Yoco processed payment |
| `styleswapUserId` | int | User who received credits |
| `styleswapTransactionId` | int | StyleSwap transaction record |
| `styleswapCreditsAdded` | int | Credits added to user |
| `styleswapTimestamp` | timestamp | When credits were added |
| `reconciliationStatus` | enum | 'unmatched', 'matched', 'mismatch' |
| `createdAt` | timestamp | When record created |
| `updatedAt` | timestamp | Last update time |

### 3. `webhookAlerts`
Alerts for failed webhooks and unmatched payments.

| Column | Type | Purpose |
|--------|------|---------|
| `id` | int | Primary key |
| `alertType` | enum | Type of alert |
| `severity` | enum | 'low', 'medium', 'high', 'critical' |
| `webhookEventId` | int | Reference to webhook event |
| `paymentReconciliationId` | int | Reference to payment record |
| `title` | varchar | Alert title |
| `description` | text | Alert details |
| `isResolved` | int | 0 = unresolved, 1 = resolved |
| `resolvedAt` | timestamp | When resolved |
| `resolvedBy` | int | User who resolved |
| `createdAt` | timestamp | When alert created |
| `updatedAt` | timestamp | Last update time |

---

## Integration Steps

### Step 1: Import the Service

Add this to your server startup file (e.g., `server/_core/index.ts`):

```typescript
import { initializeWebhookJobs } from '../webhookRetryService';

// In your server startup code:
initializeWebhookJobs();
```

### Step 2: Update Yoco Webhook Handler

In `server/webhooks/yoco.ts`, update the webhook handler:

```typescript
import {
  recordWebhookEvent,
  markWebhookSuccess,
  scheduleWebhookRetry,
  recordYocoPayment,
  matchPaymentWithCredits,
} from '../webhookRetryService';

export async function handleYocoWebhook(req: Request, res: Response) {
  const event = req.body;

  try {
    // 1. Record the webhook event immediately
    await recordWebhookEvent(
      'yoco',
      event.type,
      event.id,
      event
    );

    // 2. Process the webhook
    if (event.type === 'payment_intent.succeeded') {
      const { amount, currency, metadata } = event.data;
      const userId = parseInt(metadata.user_id);

      // Record the Yoco payment
      await recordYocoPayment(
        event.id,
        amount,
        currency,
        'succeeded',
        new Date()
      );

      // Add credits to user (existing logic)
      const credits = amount / 45; // R45 per credit
      // ... add credits logic ...

      // Match the payment with credits
      await matchPaymentWithCredits(
        event.id,
        userId,
        transactionId, // from your credits transaction
        Math.floor(credits)
      );

      // Mark webhook as successfully processed
      await markWebhookSuccess(event.id);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Yoco Webhook] Error:', error);
    
    // Schedule for retry
    await scheduleWebhookRetry(event.id, error.message);
    
    // Return 500 so Yoco knows to retry
    res.status(500).json({ error: 'Processing failed' });
  }
}
```

### Step 3: Implement Webhook Retry Processor

Add this to your server to actually retry failed webhooks:

```typescript
// In server/_core/index.ts or a background job file

import { getPendingWebhooksForRetry, markWebhookSuccess, scheduleWebhookRetry } from '../webhookRetryService';

async function retryFailedWebhooks() {
  const pendingWebhooks = await getPendingWebhooksForRetry();
  
  for (const webhook of pendingWebhooks) {
    try {
      const payload = JSON.parse(webhook.payload);
      
      // Re-process the webhook
      // This should call your existing webhook handler logic
      await handleYocoWebhook(
        { body: payload } as Request,
        {} as Response
      );
      
      await markWebhookSuccess(webhook.externalEventId);
    } catch (error) {
      await scheduleWebhookRetry(webhook.externalEventId, error.message);
    }
  }
}

// Run every 5 minutes (already set up in initializeWebhookJobs)
```

### Step 4: Add Admin Dashboard for Alerts

Create a new admin page to view and manage alerts:

```typescript
// In server/routers.ts

export const router = t.router({
  // ... existing routes ...

  admin: t.router({
    getWebhookAlerts: adminProcedure.query(async () => {
      return await db.query.webhookAlerts.findMany({
        where: eq(webhookAlerts.isResolved, 0),
        orderBy: (table) => desc(table.createdAt),
      });
    }),

    resolveAlert: adminProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await resolveAlert(input.alertId, ctx.user.id);
        return { success: true };
      }),
  }),
});
```

---

## Key Functions

### Recording Webhooks

```typescript
// Call immediately when webhook is received
await recordWebhookEvent(
  'yoco',                    // source
  'payment_intent.succeeded', // event type
  'evt_123456',              // external event ID
  { /* full payload */ }     // webhook payload
);
```

### Marking Success

```typescript
// Call after successfully processing webhook
await markWebhookSuccess('evt_123456');
```

### Scheduling Retry

```typescript
// Call when webhook processing fails
await scheduleWebhookRetry('evt_123456', 'Error message');
```

### Recording Payments

```typescript
// Call when Yoco payment is received
await recordYocoPayment(
  'yoco_txn_123',  // Yoco transaction ID
  4500,            // Amount in cents (R45.00)
  'ZAR',           // Currency
  'succeeded',     // Status
  new Date()       // Timestamp
);
```

### Matching Payments

```typescript
// Call when credits are successfully added
await matchPaymentWithCredits(
  'yoco_txn_123',  // Yoco transaction ID
  userId,          // User who received credits
  transactionId,   // StyleSwap transaction ID
  10               // Credits added
);
```

---

## Retry Logic

The service implements exponential backoff:

| Attempt | Delay | Total Time |
|---------|-------|-----------|
| 1st | 5 seconds | 5 sec |
| 2nd | 10 seconds | 15 sec |
| 3rd | 20 seconds | 35 sec |
| Failed | Alert created | - |

If all 3 retries fail, an alert is created with severity `critical`.

---

## Daily Reconciliation

The service automatically runs daily reconciliation at 2 AM:

1. Finds all unmatched payments older than 1 hour
2. Creates `high` severity alerts for each
3. Logs the results

You can also trigger manually:

```typescript
import { dailyPaymentReconciliation } from '../webhookRetryService';

await dailyPaymentReconciliation();
```

---

## Monitoring & Alerts

### Get Unresolved Alerts

```typescript
import { getUnresolvedAlerts } from '../webhookRetryService';

const alerts = await getUnresolvedAlerts();
```

### Create Custom Alert

```typescript
import { createAlert } from '../webhookRetryService';

await createAlert(
  'payment_unmatched',
  'high',
  null,
  paymentId,
  'Payment not matched',
  'R45 payment from user X has no matching credits'
);
```

### Resolve Alert

```typescript
import { resolveAlert } from '../webhookRetryService';

await resolveAlert(alertId, adminUserId);
```

---

## Testing

### Test Webhook Recording

```typescript
import { recordWebhookEvent, getUnresolvedAlerts } from '../webhookRetryService';

// Record a test webhook
await recordWebhookEvent(
  'yoco',
  'payment_intent.succeeded',
  'test_evt_123',
  { amount: 4500, currency: 'ZAR' }
);

// Check it was recorded
const alerts = await getUnresolvedAlerts();
console.log(alerts);
```

### Test Payment Reconciliation

```typescript
import {
  recordYocoPayment,
  matchPaymentWithCredits,
  dailyPaymentReconciliation,
} from '../webhookRetryService';

// Record a payment
await recordYocoPayment(
  'yoco_test_123',
  4500,
  'ZAR',
  'succeeded',
  new Date()
);

// Run reconciliation
await dailyPaymentReconciliation();

// Should create an alert for unmatched payment
```

---

## Production Checklist

- [ ] Database tables created (webhookEvents, paymentReconciliation, webhookAlerts)
- [ ] Service imported in server startup
- [ ] Yoco webhook handler updated
- [ ] Webhook retry processor implemented
- [ ] Admin alerts dashboard created
- [ ] Daily reconciliation scheduled
- [ ] Monitoring/logging configured
- [ ] Tested with real Yoco webhooks
- [ ] Alerts configured to notify admin
- [ ] Backup/recovery plan documented

---

## Troubleshooting

### Webhooks Not Being Retried

1. Check that `initializeWebhookJobs()` is called on server startup
2. Check `webhookEvents` table for status = 'retrying'
3. Verify `nextRetryAt` is in the past
4. Check server logs for errors

### Payments Not Being Matched

1. Check `paymentReconciliation` table for unmatched records
2. Verify `matchPaymentWithCredits()` is being called
3. Check that Yoco transaction IDs match exactly
4. Run `dailyPaymentReconciliation()` to create alerts

### Alerts Not Appearing

1. Check `webhookAlerts` table
2. Verify `isResolved` = 0
3. Check that alert creation is not throwing errors
4. Review server logs for alert creation failures

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Check the database tables directly
4. Contact support with the alert details

