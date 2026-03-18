import { getDb } from "./db";
import { emailNotifications } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { eq } from "drizzle-orm";

export type EmailType = "purchase_confirmation" | "try_on_complete" | "credits_expiring" | "promotional";

interface EmailPayload {
  userId: number;
  type: EmailType;
  recipientEmail: string;
  subject: string;
  htmlContent: string;
}

/**
 * Email template generators
 */
export function generatePurchaseConfirmationEmail(
  userName: string,
  credits: number,
  amount: string,
  currency: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 8px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          .highlight { color: #FF6B35; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>StyleSwap - Purchase Confirmation</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Thank you for your purchase! Your transaction has been completed successfully.</p>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Purchase Details:</strong></p>
              <p>Credits Purchased: <span class="highlight">${credits} try-ons</span></p>
              <p>Amount: <span class="highlight">${currency} ${amount}</span></p>
              <p>Valid for: 30 days from today</p>
            </div>
            <p>You can now start using your credits to create virtual try-ons! Visit your dashboard to get started.</p>
            <p style="margin-top: 20px; color: #666;">If you have any questions, please contact us at info@styleswap.co.za</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 StyleSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateTryOnCompleteEmail(
  userName: string,
  garmentName: string,
  shareUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 8px; }
          .button { display: inline-block; background-color: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Virtual Try-On is Ready!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Great news! Your virtual try-on for <strong>${garmentName}</strong> has been generated successfully.</p>
            <p>You can now:</p>
            <ul>
              <li>View your try-on result in your dashboard</li>
              <li>Share it on social media (Instagram, TikTok, Twitter, WhatsApp)</li>
              <li>Save it to your favorites</li>
              <li>Try on more garments</li>
            </ul>
            <a href="${shareUrl}" class="button">View Your Try-On</a>
            <p style="margin-top: 20px; color: #666;">Happy styling!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 StyleSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateCreditsExpiringEmail(
  userName: string,
  remainingCredits: number,
  expiryDate: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF6B35; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 8px; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Credits are Expiring Soon</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <div class="warning">
              <p><strong>⚠️ Reminder:</strong> You have <strong>${remainingCredits} try-ons</strong> remaining that will expire on <strong>${expiryDate}</strong>.</p>
            </div>
            <p>Don't miss out! Use your remaining credits before they expire to create virtual try-ons.</p>
            <p>You can renew your subscription anytime to continue enjoying StyleSwap's features.</p>
            <p style="margin-top: 20px; color: #666;">If you have any questions, please contact us at info@styleswap.co.za</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 StyleSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send email notification
 */
export async function sendEmailNotification(payload: EmailPayload): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Email Service] Database not available");
      return false;
    }

    // Record notification in database
    await db.insert(emailNotifications).values({
      userId: payload.userId,
      type: payload.type,
      subject: payload.subject,
      recipientEmail: payload.recipientEmail,
      status: "pending",
    });

    // Use Manus notification system to send email
    const result = await notifyOwner({
      title: payload.subject,
      content: `Email notification queued for ${payload.recipientEmail}`,
    });

    // Update notification status
    if (result) {
      const db2 = await getDb();
      if (db2) {
        await db2
          .update(emailNotifications)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(emailNotifications.userId, payload.userId));
      }
    }

    return result;
  } catch (error) {
    console.error("[Email Service] Error sending notification:", error);
    return false;
  }
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmationEmail(
  userId: number,
  userName: string,
  email: string,
  credits: number,
  amount: string,
  currency: string
): Promise<boolean> {
  const htmlContent = generatePurchaseConfirmationEmail(userName, credits, amount, currency);

  return sendEmailNotification({
    userId,
    type: "purchase_confirmation",
    recipientEmail: email,
    subject: `Purchase Confirmation - ${credits} StyleSwap Credits`,
    htmlContent,
  });
}

/**
 * Send try-on complete email
 */
export async function sendTryOnCompleteEmail(
  userId: number,
  userName: string,
  email: string,
  garmentName: string,
  shareUrl: string
): Promise<boolean> {
  const htmlContent = generateTryOnCompleteEmail(userName, garmentName, shareUrl);

  return sendEmailNotification({
    userId,
    type: "try_on_complete",
    recipientEmail: email,
    subject: "Your Virtual Try-On is Ready!",
    htmlContent,
  });
}

/**
 * Send credits expiring email
 */
export async function sendCreditsExpiringEmail(
  userId: number,
  userName: string,
  email: string,
  remainingCredits: number,
  expiryDate: string
): Promise<boolean> {
  const htmlContent = generateCreditsExpiringEmail(userName, remainingCredits, expiryDate);

  return sendEmailNotification({
    userId,
    type: "credits_expiring",
    recipientEmail: email,
    subject: "Your StyleSwap Credits are Expiring Soon",
    htmlContent,
  });
}


/**
 * Generate credit alert email for boutique owners
 */
export function generateCreditAlertEmail(
  boutiqueOwnerName: string,
  boutiqueName: string,
  usagePercentage: number,
  remainingCredits: number,
  totalCredits: number,
  alertLevel: "10" | "20" | "50" | "80"
): string {
  const alertMessages = {
    "80": {
      title: "🚨 CRITICAL: Your Credits are Almost Depleted",
      color: "#dc3545",
      message: "Your boutique is using 80% of its allocated credits. Immediate action required!"
    },
    "50": {
      title: "⚠️ WARNING: High Credit Usage",
      color: "#ff9800",
      message: "Your boutique is using 50% of its allocated credits. Consider purchasing more soon."
    },
    "20": {
      title: "📊 NOTICE: Moderate Credit Usage",
      color: "#ffc107",
      message: "Your boutique is using 20% of its allocated credits. Monitor your usage."
    },
    "10": {
      title: "ℹ️ INFO: Low Credit Usage",
      color: "#17a2b8",
      message: "Your boutique is using 10% of its allocated credits. Everything is running smoothly."
    }
  };

  const alert = alertMessages[alertLevel];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${alert.color}; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; background-color: #f9f9f9; margin-top: 20px; border-radius: 8px; }
          .stats { background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${alert.color}; }
          .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .stat-row:last-child { border-bottom: none; }
          .stat-label { font-weight: bold; }
          .stat-value { color: ${alert.color}; font-weight: bold; }
          .button { display: inline-block; background-color: ${alert.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          .progress-bar { background-color: #e0e0e0; height: 20px; border-radius: 10px; margin: 15px 0; overflow: hidden; }
          .progress-fill { background-color: ${alert.color}; height: 100%; width: ${usagePercentage}%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${alert.title}</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${boutiqueOwnerName}</strong>,</p>
            <p>${alert.message}</p>
            
            <div class="stats">
              <h3 style="margin-top: 0; color: ${alert.color};">Boutique: ${boutiqueName}</h3>
              <div class="progress-bar">
                <div class="progress-fill">${usagePercentage}%</div>
              </div>
              <div class="stat-row">
                <span class="stat-label">Credits Used:</span>
                <span class="stat-value">${totalCredits - remainingCredits} / ${totalCredits}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Credits Remaining:</span>
                <span class="stat-value">${remainingCredits}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Usage Percentage:</span>
                <span class="stat-value">${usagePercentage}%</span>
              </div>
            </div>

            <p><strong>What should you do?</strong></p>
            <ul>
              <li>Monitor your credit usage closely</li>
              <li>Consider purchasing additional credits to avoid service interruption</li>
              <li>Review your try-on volume and optimize if needed</li>
            </ul>

            <a href="https://styleswap.co.za/dashboard/credits" class="button">Purchase Credits Now</a>

            <p style="margin-top: 20px; color: #666;">If you have any questions or need assistance, please contact our support team at support@styleswap.co.za</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 StyleSwap. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send credit alert email to boutique owner
 */
export async function sendCreditAlertEmail(
  boutiqueOwnerId: number,
  boutiqueOwnerName: string,
  boutiqueOwnerEmail: string,
  boutiqueName: string,
  usagePercentage: number,
  remainingCredits: number,
  totalCredits: number,
  alertLevel: "10" | "20" | "50" | "80"
): Promise<boolean> {
  const htmlContent = generateCreditAlertEmail(
    boutiqueOwnerName,
    boutiqueName,
    usagePercentage,
    remainingCredits,
    totalCredits,
    alertLevel
  );

  const alertTitles = {
    "80": "CRITICAL",
    "50": "WARNING",
    "20": "NOTICE",
    "10": "INFO"
  };

  return sendEmailNotification({
    userId: boutiqueOwnerId,
    type: "promotional", // Using promotional as a generic type for alerts
    recipientEmail: boutiqueOwnerEmail,
    subject: `[${alertTitles[alertLevel]}] Credit Usage Alert - ${boutiqueName} (${usagePercentage}%)`,
    htmlContent,
  });
}
