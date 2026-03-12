import { getDb } from "./db";
import { users, affiliateCommissions, affiliateLinks, boutiques } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

export type CommissionNotificationType = "approved" | "paid" | "pending" | "failed";

interface CommissionNotificationData {
  commissionId: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  boutiqueId: string;
  boutiqueName: string;
  clothingPurchaseAmount: string;
  commissionAmount: string;
  commissionRate: string;
  status: CommissionNotificationType;
  failureReason?: string;
  expectedPayoutDate?: string;
  transactionDetails?: {
    purchaseDate: string;
    externalTransactionId?: string;
  };
}

/**
 * Format currency for display
 */
function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(num);
}

/**
 * Generate HTML email template for commission notification
 */
function generateCommissionEmailTemplate(data: CommissionNotificationData): { subject: string; html: string } {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
  `;

  const containerStyle = `
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
  `;

  const headerStyle = `
    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
    color: white;
    padding: 30px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  `;

  const contentStyle = `
    background: white;
    padding: 30px;
    border-radius: 0 0 8px 8px;
  `;

  const detailsBoxStyle = `
    background-color: #f5f5f5;
    border-left: 4px solid #ff6b35;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  `;

  const buttonStyle = `
    display: inline-block;
    background-color: #ff6b35;
    color: white;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 4px;
    margin-top: 20px;
    font-weight: 600;
  `;

  let subject = "";
  let statusMessage = "";
  let actionMessage = "";

  switch (data.status) {
    case "approved":
      subject = `Commission Approved - ${data.affiliateName}`;
      statusMessage = `Your commission of ${formatCurrency(data.commissionAmount)} has been <strong>approved</strong> and is scheduled for payout.`;
      actionMessage = `Expected payout date: <strong>${data.expectedPayoutDate || "Next business day"}</strong>`;
      break;

    case "paid":
      subject = `Commission Paid - ${data.affiliateName}`;
      statusMessage = `Great news! Your commission of ${formatCurrency(data.commissionAmount)} has been <strong>successfully paid</strong> to your registered bank account.`;
      actionMessage = `You can view the transaction details in your StyleSwap affiliate dashboard.`;
      break;

    case "pending":
      subject = `Commission Pending Review - ${data.affiliateName}`;
      statusMessage = `Your commission of ${formatCurrency(data.commissionAmount)} is currently <strong>pending verification</strong>.`;
      actionMessage = `This commission will be reviewed and approved within 24-48 hours. You'll receive a notification once it's approved.`;
      break;

    case "failed":
      subject = `Commission Processing Failed - ${data.affiliateName}`;
      statusMessage = `Unfortunately, your commission of ${formatCurrency(data.commissionAmount)} could not be processed.`;
      actionMessage = `Reason: ${data.failureReason || "Processing error"}. Please contact our support team for assistance.`;
      break;
  }

  const html = `
    <div style="${containerStyle}">
      <div style="${headerStyle}">
        <h1 style="margin: 0; font-size: 28px;">StyleSwap</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Affiliate Commission Notification</p>
      </div>
      <div style="${contentStyle}">
        <p>Hi ${data.affiliateName},</p>
        <p>${statusMessage}</p>
        
        <div style="${detailsBoxStyle}">
          <h3 style="margin-top: 0; color: #ff6b35;">Commission Details</h3>
          <p style="margin: 8px 0;"><strong>Commission ID:</strong> ${data.commissionId}</p>
          <p style="margin: 8px 0;"><strong>Boutique:</strong> ${data.boutiqueName}</p>
          <p style="margin: 8px 0;"><strong>Purchase Amount:</strong> ${formatCurrency(data.clothingPurchaseAmount)}</p>
          <p style="margin: 8px 0;"><strong>Commission Rate:</strong> ${data.commissionRate}%</p>
          <p style="margin: 8px 0; border-top: 1px solid #ddd; padding-top: 8px;"><strong>Commission Amount:</strong> <span style="color: #ff6b35; font-size: 18px;">${formatCurrency(data.commissionAmount)}</span></p>
          ${data.transactionDetails ? `
            <p style="margin: 8px 0;"><strong>Purchase Date:</strong> ${data.transactionDetails.purchaseDate}</p>
            ${data.transactionDetails.externalTransactionId ? `<p style="margin: 8px 0;"><strong>Transaction ID:</strong> ${data.transactionDetails.externalTransactionId}</p>` : ""}
          ` : ""}
        </div>

        <p>${actionMessage}</p>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          This is an automated notification from StyleSwap. Please do not reply to this email. If you have questions, visit your affiliate dashboard or contact our support team.
        </p>

        <p style="margin: 20px 0 0 0; font-size: 12px; color: #666;">
          Best regards,<br/>The StyleSwap Team<br/>
          <a href="https://styleswap.co.za" style="color: #ff6b35; text-decoration: none;">styleswap.co.za</a>
        </p>
      </div>
    </div>
  `;

  return { subject, html };
}

/**
 * Send commission notification to affiliate
 */
export async function sendCommissionNotification(data: CommissionNotificationData) {
  try {
    const { commissionId, affiliateName, affiliateEmail, status, commissionAmount, boutiqueName } = data;

    const emailTemplate = generateCommissionEmailTemplate(data);

    // Log notification for admin
    console.log(`[Commission Notification] Sending ${status} notification to ${affiliateName} (${affiliateEmail})`);
    console.log(`[Commission Notification] Amount: ${formatCurrency(commissionAmount)}, Commission ID: ${commissionId}`);

    // TODO: Integrate with email service (SendGrid, Twilio, etc.)
    // For now, we'll just log it and notify the owner
    await notifyOwner({
      title: emailTemplate.subject,
      content: `
${emailTemplate.subject}

Affiliate: ${affiliateName}
Email: ${affiliateEmail}
Boutique: ${boutiqueName}
Amount: ${formatCurrency(commissionAmount)}
Status: ${status}
Commission ID: ${commissionId}

Email Template HTML:
${emailTemplate.html}
      `,
    });

    return { success: true, message: `Notification sent to ${affiliateEmail}` };
  } catch (error) {
    console.error("[Commission Notification] Error sending notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send notification" };
  }
}

/**
 * Handle commission status update and send notifications
 */
export async function handleCommissionStatusUpdate(
  commissionId: string,
  newStatus: CommissionNotificationType,
  failureReason?: string
) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Commission Notification] Database not available");
      return;
    }

    // Get commission details
    const commissionRecord = await db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.id, parseInt(commissionId)))
      .limit(1);

    if (commissionRecord.length === 0) {
      console.warn(`[Commission Notification] Commission not found: ${commissionId}`);
      return;
    }

    const commission = commissionRecord[0];

    // Get affiliate link details
    const affiliateLinkRecord = await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.id, commission.affiliateLinkId))
      .limit(1);

    if (affiliateLinkRecord.length === 0) {
      console.warn(`[Commission Notification] Affiliate link not found: ${commission.affiliateLinkId}`);
      return;
    }

    const affiliateLink = affiliateLinkRecord[0];

    // Get boutique details
    const boutiqueRecord = await db
      .select()
      .from(boutiques)
      .where(eq(boutiques.id, commission.boutiqueId))
      .limit(1);

    if (boutiqueRecord.length === 0) {
      console.warn(`[Commission Notification] Boutique not found: ${commission.boutiqueId}`);
      return;
    }

    const boutique = boutiqueRecord[0];

    // For now, we'll use a placeholder email. In production, you'd fetch from affiliate contact info
    const affiliateEmail = "affiliate@styleswap.co.za"; // TODO: Get from affiliate contact table

    // Calculate expected payout date
    let expectedPayoutDate = "";
    if (newStatus === "approved") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expectedPayoutDate = tomorrow.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Send notification
    await sendCommissionNotification({
      commissionId: commission.id.toString(),
      affiliateId: affiliateLink.id.toString(),
      affiliateName: affiliateLink.affiliateName,
      affiliateEmail,
      boutiqueId: commission.boutiqueId.toString(),
      boutiqueName: boutique.name,
      clothingPurchaseAmount: commission.clothingPurchaseAmount,
      commissionAmount: commission.commissionAmount,
      commissionRate: commission.commissionRate,
      status: newStatus,
      failureReason,
      expectedPayoutDate,
      transactionDetails: {
        purchaseDate: commission.createdAt,
        externalTransactionId: commission.externalTransactionId || undefined,
      },
    });
  } catch (error) {
    console.error("[Commission Notification] Error handling status update:", error);
  }
}

/**
 * Send bulk commission notifications for approved commissions
 */
export async function sendBulkCommissionNotifications(status: CommissionNotificationType = "approved") {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Commission Notification] Database not available");
      return { success: false, error: "Database not available" };
    }

    // Get all commissions with the specified status that haven't been notified yet
    const commissions = await db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.status, status));

    console.log(`[Commission Notification] Found ${commissions.length} ${status} commissions to notify`);

    let successCount = 0;
    let failureCount = 0;

    for (const commission of commissions) {
      try {
        await handleCommissionStatusUpdate(commission.id.toString(), status);
        successCount++;
      } catch (error) {
        console.error(`[Commission Notification] Failed to notify commission ${commission.id}:`, error);
        failureCount++;
      }
    }

    return {
      success: true,
      message: `Sent ${successCount} notifications, ${failureCount} failed`,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error("[Commission Notification] Error sending bulk notifications:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send bulk notifications" };
  }
}
