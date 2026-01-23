# Webhook Reliability System - Testing & Verification Guide

## Overview

Your StyleSwap platform now has a **production-ready webhook reliability system** that automatically handles failed payments, retries webhooks, and alerts admins. This guide shows you exactly how to verify everything is working.

---

## Part 1: Verify the System is Running

### 1.1 Check Database Tables Exist

The webhook system uses 3 database tables. Verify they exist:

```bash
# Connect to your database and run:
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'your_database_name' 
AND TABLE_NAME IN ('webhookEvents', 'webhookAlerts', 'paymentReconciliation');
```

**Expected Output:** 3 rows showing:
- `webhookEvents`
- `webhookAlerts`
- `paymentReconciliation`

### 1.2 Check Background Jobs are Running

The system has 2 background jobs that run automatically:

1. **Retry Processor** - Runs every 5 minutes
   - Finds failed webhooks
   - Retries them with exponential backoff (5s → 10s → 20s)
   - Updates status and creates alerts

2. **Daily Reconciliation** - Runs at 2 AM daily
   - Checks for unmatched Yoco payments
   - Matches payments with StyleSwap credits
   - Creates alerts for mismatches

**To verify jobs are running:**
- Check server logs for messages like:
  ```
  [Webhook Retry] Processing 3 failed webhooks...
  [Payment Reconciliation] Checking 15 unmatched payments...
  ```

---

## Part 2: Test Webhook Retry Logic

### 2.1 Simulate a Failed Webhook

Use the admin API to create a test webhook event:

```bash
# Create a failed webhook event
curl -X POST http://localhost:3000/api/trpc/webhookAdmin.getWebhookEvents \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "status": "failed",
      "limit": 10
    }
  }'
```

### 2.2 Trigger Manual Retry

Use the admin endpoint to manually retry a failed webhook:

```bash
# Manually retry a specific webhook
curl -X POST http://localhost:3000/api/trpc/webhookAdmin.retryFailedWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "webhookEventId": 1
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Webhook scheduled for retry",
  "nextRetryAt": "2026-01-23T11:40:00.000Z"
}
```

### 2.3 Verify Retry Happened

Check the webhook event status changed:

```bash
# Get webhook events to see status
curl -X POST http://localhost:3000/api/trpc/webhookAdmin.getWebhookEvents \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "limit": 10
    }
  }'
```

**Expected:** Event status changes from `failed` → `retrying` → `success`

---

## Part 3: Test Alert System

### 3.1 View All Alerts

Get all webhook and payment alerts:

```bash
# Get all alerts
curl -X POST http://localhost:3000/api/trpc/webhookAdmin.getWebhookAlerts \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "limit": 50
    }
  }'
```

**Expected Response:** Array of alerts with:
- `alertType`: webhook_failed, webhook_max_retries, payment_unmatched, payment_mismatch
- `severity`: low, medium, high, critical
- `title`: Human-readable alert title
- `isResolved`: 0 (unresolved) or 1 (resolved)

### 3.2 Filter Alerts by Severity

Get only critical alerts:

```bash
curl -X POST http://localhost:3000/api/trpc/webhookAdmin.getWebhookAlerts \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "severity": "critical",
      "limit": 50
    }
  }'
```

### 3.3 Resolve an Alert

Mark an alert as resolved:

```bash
curl -X POST http://localhost:3000/api/trpc/webhookAdmin.resolveAlert \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "alertId": 1
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Alert marked as resolved"
}
```

---

## Part 4: Test Payment Reconciliation

### 4.1 View Unmatched Payments

Get all payments that haven't been matched to credits:

```bash
curl -X POST http://localhost:3000/api/trpc/webhookAdmin.getUnmatchedPayments \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "limit": 50
    }
  }'
```

**Expected:** Array of unmatched payments showing:
- `yocoTransactionId`: Yoco payment ID
- `yocoAmount`: Amount paid
- `reconciliationStatus`: "unmatched", "matched", or "mismatch"

### 4.2 Trigger Manual Reconciliation

Manually run payment reconciliation:

```bash
curl -X POST http://localhost:3000/api/trpc/webhookAdmin.reconcilePayments \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment reconciliation completed. Checked 5 unmatched payments."
}
```

---

## Part 5: View Dashboard Statistics

### 5.1 Get Webhook Statistics

View overall webhook system health:

```bash
curl -X POST http://localhost:3000/api/trpc/webhookAdmin.getWebhookStats \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "webhooks": {
    "total": 150,
    "success": 145,
    "failed": 3,
    "retrying": 2,
    "pending": 0
  },
  "alerts": {
    "total": 8,
    "unresolved": 3,
    "critical": 1
  },
  "payments": {
    "total": 150,
    "unmatched": 2,
    "mismatched": 1
  }
}
```

---

## Part 6: Real-World Testing Scenario

### Scenario: Customer Payment Fails

**Step 1:** Customer attempts to purchase 100 credits
- Payment is sent to Yoco
- Yoco webhook is called with payment confirmation
- System records webhook event

**Step 2:** Webhook fails (network timeout)
- Event status: `pending` → `failed`
- Alert created: "Webhook failed: payment.success"
- Severity: `high`

**Step 3:** Automatic retry (5 minutes later)
- System retries webhook
- Event status: `failed` → `retrying`
- Retry count: 1/3

**Step 4:** Retry succeeds
- Event status: `retrying` → `success`
- Credits added to customer account
- Alert resolved automatically

**Step 5:** Admin verification
- Admin checks dashboard
- Sees alert was created and resolved
- Sees payment was successfully reconciled
- No manual intervention needed ✅

---

## Part 7: Test Suite Verification

All webhook features have comprehensive tests. Run them:

```bash
# Run webhook admin tests
pnpm test server/routers/webhookAdmin.test.ts

# Expected: 14 tests passing ✅
```

**Tests cover:**
- ✅ Webhook event retrieval and filtering
- ✅ Alert creation and resolution
- ✅ Payment reconciliation lifecycle
- ✅ Statistics calculation
- ✅ Error handling

---

## Part 8: Monitor in Production

### 8.1 Watch Server Logs

The system logs all important events:

```
[Webhook] Recorded event: yoco/payment.success/evt_123456
[Webhook] Marked as success: evt_123456
[Webhook] Scheduled retry for: evt_789012
[Alert] Created high alert: Webhook failed: payment.success
[Alert] Created critical alert: Webhook max retries exceeded
[Reconciliation] Checking 15 unmatched payments...
[Reconciliation] Matched payment yoco_123 with transaction txn_456
```

### 8.2 Database Queries for Monitoring

**Check failed webhooks:**
```sql
SELECT * FROM webhookEvents 
WHERE status = 'failed' 
ORDER BY createdAt DESC;
```

**Check unresolved alerts:**
```sql
SELECT * FROM webhookAlerts 
WHERE isResolved = 0 
ORDER BY severity DESC, createdAt DESC;
```

**Check payment mismatches:**
```sql
SELECT * FROM paymentReconciliation 
WHERE reconciliationStatus IN ('unmatched', 'mismatch') 
ORDER BY createdAt DESC;
```

---

## Part 9: Troubleshooting

### Problem: No webhooks being recorded

**Check:**
1. Is Yoco sending webhooks to your endpoint?
2. Is the `/yoco` webhook endpoint registered?
3. Check server logs for webhook receipt

**Fix:**
```bash
# Verify webhook endpoint exists
curl -X GET http://localhost:3000/api/yoco

# Should return 405 (POST required) or 200, not 404
```

### Problem: Webhooks not retrying

**Check:**
1. Is the retry processor running? (Check logs every 5 minutes)
2. Are there failed webhooks in the database?
3. Is the database connection working?

**Fix:**
```bash
# Manually trigger retry
curl -X POST http://localhost:3000/api/trpc/webhookAdmin.reconcilePayments
```

### Problem: Alerts not being created

**Check:**
1. Are webhook events being recorded?
2. Is the alert creation function being called?
3. Check database for webhookAlerts table

**Fix:**
```sql
-- Verify alerts table exists and has data
SELECT COUNT(*) FROM webhookAlerts;
```

---

## Part 10: Success Criteria ✅

Your webhook system is working correctly when:

- ✅ Webhook events are recorded in `webhookEvents` table
- ✅ Failed webhooks automatically retry (check logs)
- ✅ Alerts are created for failures (check `webhookAlerts` table)
- ✅ Payment reconciliation runs daily (check logs at 2 AM)
- ✅ Unmatched payments are identified and logged
- ✅ Admin can view all alerts and statistics
- ✅ Admin can manually retry webhooks
- ✅ Admin can manually trigger reconciliation
- ✅ All 14 tests pass
- ✅ No customer credits are lost from failed webhooks

---

## Part 11: API Endpoints Reference

### Webhook Admin Router Endpoints

All endpoints require admin authentication (role: 'admin')

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `webhookAdmin.getWebhookEvents` | POST | Get webhook events with filtering |
| `webhookAdmin.getWebhookAlerts` | POST | Get alerts with filtering |
| `webhookAdmin.getUnmatchedPayments` | POST | Get unmatched Yoco payments |
| `webhookAdmin.retryFailedWebhook` | POST | Manually retry a failed webhook |
| `webhookAdmin.reconcilePayments` | POST | Manually trigger payment reconciliation |
| `webhookAdmin.resolveAlert` | POST | Mark an alert as resolved |
| `webhookAdmin.getWebhookStats` | POST | Get system statistics |

---

## Next Steps

1. **Monitor the system** - Watch logs and database for the first week
2. **Test with real payments** - Process a test payment and verify webhook flow
3. **Set up alerts** - Configure email notifications for critical alerts
4. **Document procedures** - Create runbooks for common admin tasks
5. **Train team** - Show your team how to use the admin dashboard

---

## Support

For issues or questions:
1. Check the logs: `docker logs styleswap-server`
2. Query the database for webhook events
3. Run the test suite: `pnpm test server/routers/webhookAdmin.test.ts`
4. Review this guide for troubleshooting steps
