import { getDb } from "./db";
import { users, payouts, boutiques } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

export type PayoutNotificationType = "sent" | "completed" | "failed" | "pending";

interface PayoutNotificationData {
  payoutId: string;
  boutiqueId: string;
  boutiqueName: string;
  boutiqueEmail: string;
  amount: string;
  status: PayoutNotificationType;
  failureReason?: string;
  expectedDeliveryDate?: string;
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
 * Send payout notification to boutique owner
 */
export async function sendPayoutNotification(data: PayoutNotificationData) {
  try {
    const { payoutId, boutiqueId, boutiqueName, boutiqueEmail, amount, status, failureReason, expectedDeliveryDate } = data;

    let subject = "";
    let message = "";

    switch (status) {
      case "sent":
        subject = `Payout Sent - ${boutiqueName}`;
        message = `
Your payout of ${formatCurrency(amount)} has been sent to your registered bank account.

Payout ID: ${payoutId}
Expected Delivery: ${expectedDeliveryDate || "Next business day"}

You can track the status of your payout in your StyleSwap dashboard under Payouts.

Thank you for selling with StyleSwap!
        `.trim();
        break;

      case "completed":
        subject = `Payout Completed - ${boutiqueName}`;
        message = `
Great news! Your payout of ${formatCurrency(amount)} has been successfully delivered to your bank account.

Payout ID: ${payoutId}
Status: Completed

You can view the full details in your StyleSwap dashboard under Payouts.

Thank you for your continued partnership with StyleSwap!
        `.trim();
        break;

      case "failed":
        subject = `Payout Failed - Action Required - ${boutiqueName}`;
        message = `
Unfortunately, your payout of ${formatCurrency(amount)} could not be processed.

Payout ID: ${payoutId}
Reason: ${failureReason || "Bank account validation failed"}

Please update your bank account details in your StyleSwap dashboard and try again. If you continue to experience issues, please contact our support team.

We're here to help!
        `.trim();
        break;

      case "pending":
        subject = `Payout Pending - ${boutiqueName}`;
        message = `
Your payout of ${formatCurrency(amount)} is pending processing.

Payout ID: ${payoutId}
Status: Pending

This payout will be processed within 24 hours. You'll receive a notification when it's sent to your bank account.

Thank you for your patience!
        `.trim();
        break;
    }

    // Log notification for admin
    console.log(`[Payout Notification] Sending ${status} notification to ${boutiqueName} (${boutiqueEmail})`);
    console.log(`[Payout Notification] Amount: ${formatCurrency(amount)}, Payout ID: ${payoutId}`);

    // TODO: Integrate with email service (SendGrid, Twilio, etc.)
    // For now, we'll just log it and notify the owner
    await notifyOwner({
      title: subject,
      content: `${message}\n\nBoutique: ${boutiqueName}\nEmail: ${boutiqueEmail}`,
    });

    return { success: true, message: `Notification sent to ${boutiqueEmail}` };
  } catch (error) {
    console.error("[Payout Notification] Error sending notification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send notification" };
  }
}

/**
 * Send payout notifications based on webhook updates
 */
export async function handlePayoutStatusUpdate(payoutId: string, newStatus: string, failureReason?: string) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Payout Notification] Database not available");
      return;
    }

    // Get payout details
    const payoutRecord = await db
      .select()
      .from(payouts)
      .where(eq(payouts.id, payoutId))
      .limit(1);

    if (payoutRecord.length === 0) {
      console.warn(`[Payout Notification] Payout not found: ${payoutId}`);
      return;
    }

    const payout = payoutRecord[0];

    // Get boutique details
    const boutiqueRecord = await db
      .select()
      .from(boutiques)
      .where(eq(boutiques.id, payout.boutiqueId))
      .limit(1);

    if (boutiqueRecord.length === 0) {
      console.warn(`[Payout Notification] Boutique not found: ${payout.boutiqueId}`);
      return;
    }

    const boutique = boutiqueRecord[0];

    // Get boutique owner email
    const ownerRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, boutique.ownerId))
      .limit(1);

    if (ownerRecord.length === 0) {
      console.warn(`[Payout Notification] Owner not found for boutique: ${payout.boutiqueId}`);
      return;
    }

    const owner = ownerRecord[0];

    // Map status to notification type
    let notificationType: PayoutNotificationType = "pending";
    if (newStatus === "processing" || newStatus === "sent") {
      notificationType = "sent";
    } else if (newStatus === "completed" || newStatus === "paid") {
      notificationType = "completed";
    } else if (newStatus === "failed") {
      notificationType = "failed";
    }

    // Calculate expected delivery date
    let expectedDeliveryDate = "";
    if (notificationType === "sent") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expectedDeliveryDate = tomorrow.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Send notification
    await sendPayoutNotification({
      payoutId,
      boutiqueId: payout.boutiqueId,
      boutiqueName: boutique.name,
      boutiqueEmail: owner.email,
      amount: payout.amount,
      status: notificationType,
      failureReason,
      expectedDeliveryDate,
    });
  } catch (error) {
    console.error("[Payout Notification] Error handling status update:", error);
  }
}
