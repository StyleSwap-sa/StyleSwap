import { Request, Response } from "express";
import { getDb } from "../db";
import { transactions, userCredits, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmailNotification } from "../email";
import { verifyWebhookSignature } from "../yoko-payment";
import { sendPaymentConfirmationSMS } from "../sms";

export interface YokoWebhookPayload {
  id: string;
  type: string;
  data: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    metadata: {
      userId: string;
      packageId: string;
      credits: number;
      userName: string;
      userEmail: string;
    };
    created_at: string;
  };
}

/**
 * Handle Yoko payment webhooks
 */
export async function handleYokoWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["x-yoko-signature"] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.warn("[Yoko Webhook] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event: YokoWebhookPayload = req.body;

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data);
        break;
      case "payment_intent.failed":
        await handlePaymentFailed(event.data);
        break;
      case "payment_intent.canceled":
        await handlePaymentCanceled(event.data);
        break;
      default:
        console.log(`[Yoko Webhook] Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error("[Yoko Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(data: YokoWebhookPayload["data"]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const userId = parseInt(data.metadata.userId, 10);
  const credits = data.metadata.credits;
  const userEmail = data.metadata.userEmail;
  const userName = data.metadata.userName;

  try {
    // Get existing user credits
    const existingCredits = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    if (existingCredits.length === 0) {
      // Create new credit record
      await db.insert(userCredits).values({
        userId,
        totalCredits: credits,
        usedCredits: 0,
        remainingCredits: credits,
        expiresAt,
      });
    } else {
      // Update existing credit record
      const current = existingCredits[0];
      const newTotal = current.totalCredits + credits;
      const newRemaining = current.remainingCredits + credits;

      await db
        .update(userCredits)
        .set({
          totalCredits: newTotal,
          remainingCredits: newRemaining,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));
    }

    // Record transaction
    await db.insert(transactions).values({
      userId,
      type: "purchase",
      amount: credits,
      price: (data.amount / 100).toString(),
      currency: data.currency.toUpperCase(),
      description: `Purchased ${credits} try-on credits`,
      fitRoomOrderId: data.id,
      status: "completed",
    });

    // Send confirmation email
    const emailHtml = `<html><body style="font-family: Arial, sans-serif;"><h2>Purchase Confirmation</h2><p>Hi ${userName},</p><p>Thank you for your purchase! You have successfully purchased <strong>${credits} try-on credits</strong> for <strong>R${(data.amount / 100).toFixed(2)}</strong>.</p><p>Your credits are valid for 30 days from today.</p><p>Best regards,<br/>StyleSwap Team</p></body></html>`;
    await sendEmailNotification({
      userId,
      type: "purchase_confirmation",
      recipientEmail: userEmail,
      subject: "Purchase Confirmation - StyleSwap",
      htmlContent: emailHtml,
    });

    // Send SMS confirmation
    try {
      // Get user phone number from database
      const db = await getDb();
      if (db) {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (user.length > 0 && user[0].phone) {
          await sendPaymentConfirmationSMS(
            user[0].phone,
            credits,
            data.amount,
            data.metadata.packageId
          );
        }
      }
    } catch (smsError) {
      console.warn("[Yoko Webhook] Failed to send SMS:", smsError);
    }

    console.log(
      `[Yoko Webhook] Payment succeeded for user ${userId}: +${credits} credits`
    );
  } catch (error) {
    console.error("[Yoko Webhook] Error handling payment success:", error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(data: YokoWebhookPayload["data"]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const userId = parseInt(data.metadata.userId, 10);

  try {
    // Record failed transaction
    await db.insert(transactions).values({
      userId,
      type: "purchase",
      amount: data.metadata.credits,
      price: (data.amount / 100).toString(),
      currency: data.currency.toUpperCase(),
      description: `Failed purchase attempt for ${data.metadata.credits} credits`,
      fitRoomOrderId: data.id,
      status: "failed",
    });

    console.log(`[Yoko Webhook] Payment failed for user ${userId}`);
  } catch (error) {
    console.error("[Yoko Webhook] Error handling payment failure:", error);
    throw error;
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(data: YokoWebhookPayload["data"]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const userId = parseInt(data.metadata.userId, 10);

  try {
    // Record canceled transaction
    await db.insert(transactions).values({
      userId,
      type: "purchase",
      amount: data.metadata.credits,
      price: (data.amount / 100).toString(),
      currency: data.currency.toUpperCase(),
      description: `Canceled purchase for ${data.metadata.credits} credits`,
      fitRoomOrderId: data.id,
      status: "failed",
    });

    console.log(`[Yoko Webhook] Payment canceled for user ${userId}`);
  } catch (error) {
    console.error("[Yoko Webhook] Error handling payment cancellation:", error);
    throw error;
  }
}
