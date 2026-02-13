import { getDb } from "../db";
import { sendEmailNotification } from "../email";
import { sendPaymentConfirmationSMS } from "../sms";
import { notifyOwner } from "../_core/notification";

/**
 * Subscription reminder service
 * Sends renewal reminders to customers before their subscription expires
 */

/**
 * Get subscriptions expiring within N days
 */
export async function getExpiringSubscriptions(daysUntilExpiry: number = 7) {
  const db = await getDb();
  if (!db) return [];

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

  const subscriptions = await db.query.raw(
    `SELECT bs.*, b.name as boutiqueName, b.ownerId, u.email, u.phone, u.name as ownerName
     FROM boutiqueSubscriptions bs
     JOIN boutiques b ON b.id = bs.boutiqueId
     JOIN users u ON u.id = b.ownerId
     WHERE bs.status = 'active'
     AND bs.autoRenew = 1
     AND bs.usagePeriodEnd <= ?
     AND bs.usagePeriodEnd > NOW()
     AND (
       SELECT COUNT(*) FROM subscriptionAuditLog sal
       WHERE sal.boutiqueId = bs.boutiqueId
       AND sal.action = 'reminder_sent'
       AND sal.createdAt > DATE_SUB(NOW(), INTERVAL 1 DAY)
     ) = 0`,
    [expiryDate.toISOString()]
  );

  return subscriptions || [];
}

/**
 * Send renewal reminder to a boutique
 */
export async function sendRenewalReminder(boutiqueId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get boutique and subscription details
    const subscriptionResult = await db.query.raw(
      `SELECT bs.*, b.name as boutiqueName, b.ownerId, u.email, u.phone, u.name as ownerName
       FROM boutiqueSubscriptions bs
       JOIN boutiques b ON b.id = bs.boutiqueId
       JOIN users u ON u.id = b.ownerId
       WHERE bs.boutiqueId = ? LIMIT 1`,
      [boutiqueId]
    );

    if (!subscriptionResult || subscriptionResult.length === 0) {
      console.warn(`[Subscription Reminder] Boutique ${boutiqueId} not found`);
      return false;
    }

    const subscription = subscriptionResult[0];
    const daysUntilExpiry = Math.ceil(
      (new Date(subscription.usagePeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send email reminder
    if (subscription.email) {
      const emailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #333; margin-bottom: 20px;">Subscription Renewal Reminder</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Hi ${subscription.ownerName},
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Your subscription for <strong>${subscription.boutiqueName}</strong> will expire in <strong>${daysUntilExpiry} days</strong> (${new Date(subscription.usagePeriodEnd).toLocaleDateString()}).
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <strong>Plan Details:</strong><br/>
                Plan: ${subscription.planName}<br/>
                Monthly Limit: ${subscription.monthlyLimit} try-ons<br/>
                Billing Cycle: ${subscription.billingCycle}
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                To avoid any interruption in service, please renew your subscription before the expiry date. After expiration, your team will not be able to access the try-on feature.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://styleswap.co.za/dashboard/subscription" style="background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Renew Subscription
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                If you have any questions, please contact our support team at support@styleswap.co.za
              </p>
            </div>
          </body>
        </html>
      `;

      await sendEmailNotification({
        userId: subscription.ownerId,
        type: "subscription_renewal_reminder",
        recipientEmail: subscription.email,
        subject: `Subscription Renewal Reminder - ${subscription.boutiqueName}`,
        htmlContent: emailHtml,
      });
    }

    // Send SMS reminder
    if (subscription.phone) {
      try {
        await sendPaymentConfirmationSMS(
          subscription.phone,
          0,
          0,
          `Reminder: Your ${subscription.boutiqueName} subscription expires in ${daysUntilExpiry} days. Renew now to avoid service interruption.`
        );
      } catch (error) {
        console.warn(`[Subscription Reminder] SMS send failed for boutique ${boutiqueId}:`, error);
      }
    }

    // Log the reminder in audit log
    await db.query.raw(
      `INSERT INTO subscriptionAuditLog (boutiqueId, action, reason, createdAt)
       VALUES (?, ?, ?, NOW())`,
      [boutiqueId, "reminder_sent", `Renewal reminder sent - ${daysUntilExpiry} days until expiry`]
    );

    console.log(`[Subscription Reminder] Reminder sent for boutique ${boutiqueId}`);
    return true;
  } catch (error) {
    console.error(`[Subscription Reminder] Error sending reminder for boutique ${boutiqueId}:`, error);
    return false;
  }
}

/**
 * Send reminders for all expiring subscriptions
 */
export async function sendAllRenewalReminders(daysUntilExpiry: number = 7) {
  try {
    const expiringSubscriptions = await getExpiringSubscriptions(daysUntilExpiry);

    if (expiringSubscriptions.length === 0) {
      console.log(`[Subscription Reminder] No subscriptions expiring within ${daysUntilExpiry} days`);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const subscription of expiringSubscriptions) {
      const success = await sendRenewalReminder(subscription.boutiqueId);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    // Notify owner of reminder batch
    await notifyOwner({
      title: "Subscription Renewal Reminders Sent",
      content: `Sent ${sent} renewal reminders to expiring subscriptions. Failed: ${failed}.`,
    });

    console.log(`[Subscription Reminder] Batch complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    console.error("[Subscription Reminder] Error sending batch reminders:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Schedule reminder job (call this from a cron job or scheduled task)
 */
export async function scheduleSubscriptionReminders() {
  console.log("[Subscription Reminder] Starting scheduled reminder job");

  // Send reminders for subscriptions expiring in 7 days
  await sendAllRenewalReminders(7);

  // Send urgent reminders for subscriptions expiring in 3 days
  await sendAllRenewalReminders(3);

  // Send critical reminders for subscriptions expiring in 1 day
  await sendAllRenewalReminders(1);

  console.log("[Subscription Reminder] Scheduled reminder job completed");
}
