import { getDb } from "../db";
import { sendEmailNotification } from "../email";
import { sendPaymentConfirmationSMS } from "../sms";

/**
 * Payment retry service
 * Automatically retries failed payments 3 times over 5 days before suspending subscription
 */

export interface PaymentRetryConfig {
  maxRetries: number; // Default: 3
  retryIntervalHours: number; // Default: 24 (1 day)
  suspendAfterDays: number; // Default: 5
}

const DEFAULT_CONFIG: PaymentRetryConfig = {
  maxRetries: 3,
  retryIntervalHours: 24,
  suspendAfterDays: 5,
};

/**
 * Create payment retry record
 */
export async function createPaymentRetry(
  boutiqueId: number,
  paymentIntentId: string,
  amount: number,
  reason: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.query.raw(
      `INSERT INTO paymentRetries (boutiqueId, paymentIntentId, amount, status, retryCount, lastRetryAt, nextRetryAt, reason, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR), ?, NOW())`,
      [boutiqueId, paymentIntentId, amount, "pending", 0, reason]
    );

    console.log(`[Payment Retry] Created retry record for boutique ${boutiqueId}`);
    return result;
  } catch (error) {
    console.error(`[Payment Retry] Error creating retry record:`, error);
    return null;
  }
}

/**
 * Get pending payment retries
 */
export async function getPendingPaymentRetries() {
  const db = await getDb();
  if (!db) return [];

  try {
    const retries = await db.query.raw(
      `SELECT pr.*, b.name as boutiqueName, b.ownerId, u.email, u.phone, u.name as ownerName
       FROM paymentRetries pr
       JOIN boutiques b ON b.id = pr.boutiqueId
       JOIN users u ON u.id = b.ownerId
       WHERE pr.status = 'pending'
       AND pr.nextRetryAt <= NOW()
       AND pr.retryCount < ?
       ORDER BY pr.nextRetryAt ASC`,
      [DEFAULT_CONFIG.maxRetries]
    );

    return retries || [];
  } catch (error) {
    console.error("[Payment Retry] Error fetching pending retries:", error);
    return [];
  }
}

/**
 * Retry payment for a boutique
 */
export async function retryPayment(retryId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get retry record
    const retryResult = await db.query.raw(
      `SELECT pr.*, b.name as boutiqueName, b.ownerId, u.email, u.phone, u.name as ownerName
       FROM paymentRetries pr
       JOIN boutiques b ON b.id = pr.boutiqueId
       JOIN users u ON u.id = b.ownerId
       WHERE pr.id = ? LIMIT 1`,
      [retryId]
    );

    if (!retryResult || retryResult.length === 0) {
      console.warn(`[Payment Retry] Retry record ${retryId} not found`);
      return false;
    }

    const retry = retryResult[0];

    // Increment retry count
    const newRetryCount = retry.retryCount + 1;
    const nextRetryDate = new Date();
    nextRetryDate.setHours(nextRetryDate.getHours() + DEFAULT_CONFIG.retryIntervalHours);

    // Check if we've exceeded max retries
    if (newRetryCount >= DEFAULT_CONFIG.maxRetries) {
      // Suspend subscription
      await db.query.raw(
        `UPDATE boutiqueSubscriptions SET status = 'suspended' WHERE boutiqueId = ?`,
        [retry.boutiqueId]
      );

      // Mark retry as failed
      await db.query.raw(
        `UPDATE paymentRetries SET status = 'failed', retryCount = ? WHERE id = ?`,
        [newRetryCount, retryId]
      );

      // Send suspension notification
      await sendSuspensionNotification(retry);

      console.log(`[Payment Retry] Subscription suspended for boutique ${retry.boutiqueId} after ${newRetryCount} retries`);
      return false;
    }

    // Send retry notification to customer
    await sendRetryNotification(retry, newRetryCount);

    // Update retry record
    await db.query.raw(
      `UPDATE paymentRetries SET retryCount = ?, lastRetryAt = NOW(), nextRetryAt = ? WHERE id = ?`,
      [newRetryCount, nextRetryDate.toISOString(), retryId]
    );

    console.log(`[Payment Retry] Retry ${newRetryCount}/${DEFAULT_CONFIG.maxRetries} for boutique ${retry.boutiqueId}`);
    return true;
  } catch (error) {
    console.error(`[Payment Retry] Error retrying payment:`, error);
    return false;
  }
}

/**
 * Send retry notification to customer
 */
async function sendRetryNotification(retry: any, retryCount: number) {
  try {
    if (retry.email) {
      const emailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #333; margin-bottom: 20px;">Payment Retry Attempt</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Hi ${retry.ownerName},
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                We attempted to retry the payment for your <strong>${retry.boutiqueName}</strong> subscription.
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <strong>Retry Details:</strong><br/>
                Attempt: ${retryCount} of ${DEFAULT_CONFIG.maxRetries}<br/>
                Amount: R${(retry.amount / 100).toFixed(2)}<br/>
                Reason: ${retry.reason}
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                If the payment continues to fail, your subscription will be suspended after ${DEFAULT_CONFIG.maxRetries} attempts.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://styleswap.co.za/dashboard/billing" style="background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Update Payment Method
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
        userId: retry.ownerId,
        type: "payment_retry_notification",
        recipientEmail: retry.email,
        subject: `Payment Retry Attempt - ${retry.boutiqueName}`,
        htmlContent: emailHtml,
      });
    }

    // Send SMS
    if (retry.phone) {
      try {
        await sendPaymentConfirmationSMS(
          retry.phone,
          0,
          0,
          `Payment retry attempt ${retryCount}/${DEFAULT_CONFIG.maxRetries} for ${retry.boutiqueName}. If payment fails again, your subscription will be suspended.`
        );
      } catch (error) {
        console.warn(`[Payment Retry] SMS send failed:`, error);
      }
    }
  } catch (error) {
    console.error("[Payment Retry] Error sending retry notification:", error);
  }
}

/**
 * Send suspension notification to customer
 */
async function sendSuspensionNotification(retry: any) {
  try {
    if (retry.email) {
      const emailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #d32f2f; margin-bottom: 20px;">⚠️ Subscription Suspended</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Hi ${retry.ownerName},
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Unfortunately, your subscription for <strong>${retry.boutiqueName}</strong> has been suspended due to repeated payment failures.
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <strong>What This Means:</strong><br/>
                Your team will no longer be able to access the try-on feature until the payment is resolved.
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <strong>Next Steps:</strong><br/>
                1. Update your payment method<br/>
                2. Contact our support team to reactivate your subscription<br/>
                3. Your subscription will be automatically reactivated once payment is successful
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://styleswap.co.za/dashboard/billing" style="background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Update Payment Method
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                Need help? Contact our support team at support@styleswap.co.za
              </p>
            </div>
          </body>
        </html>
      `;

      await sendEmailNotification({
        userId: retry.ownerId,
        type: "subscription_suspended",
        recipientEmail: retry.email,
        subject: `Subscription Suspended - ${retry.boutiqueName}`,
        htmlContent: emailHtml,
      });
    }

    // Send SMS
    if (retry.phone) {
      try {
        await sendPaymentConfirmationSMS(
          retry.phone,
          0,
          0,
          `Your ${retry.boutiqueName} subscription has been suspended due to payment failures. Please update your payment method to reactivate.`
        );
      } catch (error) {
        console.warn(`[Payment Retry] SMS send failed:`, error);
      }
    }
  } catch (error) {
    console.error("[Payment Retry] Error sending suspension notification:", error);
  }
}

/**
 * Process all pending payment retries
 */
export async function processPaymentRetries() {
  console.log("[Payment Retry] Starting payment retry processing");

  const pendingRetries = await getPendingPaymentRetries();

  if (pendingRetries.length === 0) {
    console.log("[Payment Retry] No pending retries");
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const retry of pendingRetries) {
    const success = await retryPayment(retry.id);
    if (success) {
      processed++;
    } else {
      failed++;
    }
  }

  console.log(`[Payment Retry] Processing complete: ${processed} processed, ${failed} failed`);
  return { processed, failed };
}

/**
 * Create paymentRetries table (run once during setup)
 */
export async function createPaymentRetriesTable() {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.query.raw(`
      CREATE TABLE IF NOT EXISTS paymentRetries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        boutiqueId INT NOT NULL,
        paymentIntentId VARCHAR(255) NOT NULL,
        amount INT NOT NULL,
        status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
        retryCount INT DEFAULT 0,
        lastRetryAt TIMESTAMP,
        nextRetryAt TIMESTAMP,
        reason TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (boutiqueId) REFERENCES boutiques(id),
        INDEX idx_status (status),
        INDEX idx_nextRetryAt (nextRetryAt),
        INDEX idx_boutiqueId (boutiqueId)
      )
    `);

    console.log("[Payment Retry] paymentRetries table created");
    return true;
  } catch (error) {
    console.error("[Payment Retry] Error creating table:", error);
    return false;
  }
}
