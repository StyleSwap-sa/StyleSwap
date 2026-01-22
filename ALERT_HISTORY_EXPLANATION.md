# Alert History Explanation

## What You See in Alert History

The Alert History section shows a record of all credit alert emails that have been sent to boutiques. Each entry displays:

1. **Boutique Name** - The boutique that received the alert
2. **Timestamp** - When the alert was sent (date and time)
3. **Alert Level** - The credit threshold that triggered the alert
4. **Status** - Whether the email was successfully sent or failed

---

## Understanding the Statuses

### ✅ **"Sent" Status** (Green checkmark)

**Meaning:** The alert email was successfully delivered to the boutique owner.

**What happened:**
- The system detected that the boutique's credit usage reached a configured threshold
- An email was generated with the alert details
- The email was successfully sent to the boutique owner's email address
- The boutique owner received the notification

**Example from your dashboard:**
```
Luxury Boutique
2026-01-22 09:00 • Critical (80%)
✅ Sent
```
This means: "On January 22, 2026 at 09:00, Luxury Boutique was sent an alert because their credits reached 80% usage."

---

### ❌ **"Failed" Status** (Red X)

**Meaning:** The system attempted to send the alert email but it could NOT be delivered.

**Why it might fail:**
1. **Invalid email address** - The boutique owner's email address on file is incorrect or no longer active
2. **Email service issue** - Temporary problem with the email sending service
3. **Network connectivity** - Server couldn't reach the email service at that moment
4. **Email blocked** - The recipient's email provider blocked the message as spam
5. **Mailbox full** - The recipient's email mailbox is full and can't receive new messages

**Example from your dashboard:**
```
Elegant Styles
2026-01-20 09:00 • Critical (80%)
❌ Failed
```
This means: "On January 20, 2026 at 09:00, the system tried to send an alert to Elegant Styles because their credits reached 80% usage, but the email could not be delivered."

---

## What Each Alert Level Means

| Alert Level | Credit Usage | Color | Severity |
|---|---|---|---|
| **Critical** | 80% used | 🔴 Red | Urgent - Credits running out fast |
| **Warning** | 50% used | 🟠 Orange | Moderate - Halfway through credits |
| **Notice** | 20% used | 🟡 Yellow | Informational - Getting low |
| **Info** | 10% used | 🔵 Blue | Low priority - Just a heads up |

---

## Your Current Alert History

Based on what's shown on your dashboard:

| Boutique | Time | Level | Status | Meaning |
|---|---|---|---|---|
| Luxury Boutique | 2026-01-22 09:00 | Critical (80%) | ✅ Sent | Alert successfully delivered |
| Urban Fashion Co | 2026-01-22 09:05 | Warning (50%) | ✅ Sent | Alert successfully delivered |
| Vintage Threads | 2026-01-21 09:00 | Notice (20%) | ✅ Sent | Alert successfully delivered |
| Elegant Styles | 2026-01-20 09:00 | Critical (80%) | ❌ Failed | Email delivery failed |

---

## What to Do About Failed Alerts

### If you see a "Failed" status:

1. **Check the boutique's email address**
   - Go to the boutique details
   - Verify the owner's email is correct
   - Update it if it's wrong

2. **Manually contact the boutique owner**
   - Send them a message through the platform
   - Let them know their credits are running low
   - Provide them with a link to purchase more credits

3. **Try sending again**
   - The "Send Alerts Now" button will retry failed alerts
   - Click it to attempt delivery again

4. **Check email service status**
   - Verify that the email service is working
   - Check if there are any service outages

---

## How Alerts Are Triggered

The Alert Scheduler runs automatically at the configured time (default: 09:00 daily) and:

1. **Checks each boutique's credit usage**
2. **Compares it against thresholds** (80%, 50%, 20%, 10%)
3. **Generates alert emails** for boutiques that crossed a threshold
4. **Attempts to send emails** to boutique owners
5. **Records the status** (Sent or Failed) in Alert History

---

## Current Configuration (From Your Dashboard)

```
Frequency:        Daily
Send Time:        09:00 (9:00 AM)
Active Thresholds: 3/4 (80%, 50%, 20% enabled; 10% disabled)
Status:           Active
```

This means:
- Alerts are checked every day at 9:00 AM
- Boutiques are alerted when credits reach 80%, 50%, or 20% usage
- The 10% threshold is currently disabled (unchecked)

---

## Summary

- **"Sent"** = Email successfully delivered to boutique owner ✅
- **"Failed"** = Email could not be delivered ❌
- Both statuses are tracked for your records
- You can manually retry failed alerts using "Send Alerts Now" button
- Check boutique email addresses if you see repeated failures
