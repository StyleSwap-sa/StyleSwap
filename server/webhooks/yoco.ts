import { Request, Response } from "express";
import { getDb } from "../db";
import { transactions, userCredits, users, boutiqueCredits, shopOrders } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { sendEmailNotification } from "../email";
import { verifyWebhookSignature } from "../yoko-payment";
import { sendPaymentConfirmationSMS } from "../sms";
import { processOrderPayout } from "../payout-processor";
import { reactivateSubscription } from "../middleware/subscriptionValidation";
import {
  recordWebhookEvent,
  markWebhookSuccess,
  scheduleWebhookRetry,
  recordYocoPayment,
  matchPaymentWithCredits,
} from "../webhookRetryService";

export interface YokoWebhookNestedData {
  id: string;
  status: string;
  amount: number;
  currency: string;
  metadata: {
    userId?: string;
    boutiqueId?: string;
    packageId: string;
    credits: number;
    userName?: string;
    userEmail?: string;
  };
  created_at?: string;
}

export interface YokoWebhookData extends YokoWebhookNestedData {
  payload?: YokoWebhookNestedData;
}

export interface YokoWebhookPayload {
  id: string;
  type: string;
  data: YokoWebhookData;
}

/**
 * Handle Yoko payment webhooks
 */
export async function handleYokoWebhook(req: Request, res: Response) {
  console.log("[Yoko Webhook] ========== WEBHOOK RECEIVED ==========");
  console.log("[Yoko Webhook] Method:", req.method);
  console.log("[Yoko Webhook] URL:", req.url);
  console.log("[Yoko Webhook] Headers:", JSON.stringify(req.headers, null, 2));
  console.log("[Yoko Webhook] Body:", JSON.stringify(req.body, null, 2));
  console.log("[Yoko Webhook] =======================================");
  const event: YokoWebhookPayload = req.body;
  const externalEventId = event.id;

  try {
    // 1. Record webhook event immediately (before processing)
    await recordWebhookEvent(
      'yoco',
      event.type,
      externalEventId,
      event
    );
    console.log(`[Yoko Webhook] Recorded webhook event: ${externalEventId}`);

    // In yoco.ts, inside handleYokoWebhook:
    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;

    // Get the required Svix headers
    const signature = (req.headers["webhook-signature"] as string) || "";
    const webhookId = (req.headers["webhook-id"] as string) || "";
    const webhookTimestamp = (req.headers["webhook-timestamp"] as string) || "";
    
    // Use the exact un-stringified raw body text if available, or fall back to req.body
    const payload = (req as any).rawBody || JSON.stringify(req.body);

    // Verify webhook signature with the new arguments
    if (!signature || !webhookSecret || !verifyWebhookSignature(payload, signature, webhookSecret, webhookId, webhookTimestamp)) {
      console.warn("[Yoko Webhook] Invalid signature");
      await scheduleWebhookRetry(externalEventId, "Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data, externalEventId);
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

    // 2. Mark webhook as successfully processed
    await markWebhookSuccess(externalEventId);
    console.log(`[Yoko Webhook] Successfully processed: ${externalEventId}`);

    // Acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error("[Yoko Webhook] Error processing webhook:", error);
    // 3. Schedule for retry on error
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    await scheduleWebhookRetry(externalEventId, errorMsg);
    // Return 500 so Yoco knows to retry
    res.status(500).json({ error: "Processing failed, will retry" });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(data: YokoWebhookPayload["data"], externalEventId: string) {
  console.log("[Yoko Webhook] Processing payment succeeded");
  
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 🔥 Handle both formats: direct and nested
  const payload = data.payload || data;
  const metadata = payload.metadata || data.metadata || {};

  const userId = metadata.userId ? parseInt(metadata.userId, 10) : null;
  const credits = metadata.credits != null ? Number(metadata.credits) : 0;
  const userEmail = metadata.userEmail || "";
  const userName = metadata.userName || "Customer";
  const paymentId = payload.id || data.id;

  console.log(`[Yoko Webhook] Parsed: userId=${userId}, credits=${credits}, paymentId=${paymentId}`);

  if (!userId || credits <= 0) {
    console.error("[Yoko Webhook] Missing userId or credits in metadata");
    return;
  }

  try {
    // Get existing user credits
    const existingCredits = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const expiresAtString = expiresAt.toISOString();

    if (existingCredits.length === 0) {
      // Create new credit record
      await db.insert(userCredits).values({
        userId,
        totalCredits: credits,
        usedCredits: 0,
        remainingCredits: credits,
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
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(userCredits.userId, userId));
    }

    // Record transaction
    await db.insert(transactions).values({
      userId,
      amount: credits.toString(),
      status: "completed",
      reason: `Purchased ${credits} try-on credits via Yoco payment (Order: ${data.id})`,
    });

    // Send confirmation email
    if (userEmail) {
      const emailHtml = `<html><body style="font-family: Arial, sans-serif;"><h2>Purchase Confirmation</h2><p>Hi ${userName},</p><p>Thank you for your purchase! You have successfully purchased <strong>${credits} try-on credits</strong> for <strong>R${(data.amount / 100).toFixed(2)}</strong>.</p><p>Your credits are valid for 30 days from today.</p><p>Best regards,<br/>StyleSwap Team</p></body></html>`;
      await sendEmailNotification({
        userId,
        type: "purchase_confirmation",
        recipientEmail: userEmail,
        subject: "Purchase Confirmation - StyleSwap",
        htmlContent: emailHtml,
      });
    }

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
 * Handle boutique credit purchase
 */
async function handleBoutiqueCreditPurchase(
  db: any,
  boutiqueId: number,
  credits: number,
  data: YokoWebhookPayload["data"]
) {
  try {
    // Get existing boutique credits
    const existingCredits = await db
      .select()
      .from(boutiqueCredits)
      .where(eq(boutiqueCredits.boutiqueId, boutiqueId))
      .limit(1);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    if (existingCredits.length === 0) {
      // Create new boutique credit record
      await db.insert(boutiqueCredits).values({
        boutiqueId,
        totalCredits: credits,
        usedCredits: 0,
        remainingCredits: credits,
        expiresAt,
      });
    } else {
      // Update existing boutique credit record
      const current = existingCredits[0];
      const newTotal = current.totalCredits + credits;
      const newRemaining = current.remainingCredits + credits;

      await db
        .update(boutiqueCredits)
        .set({
          totalCredits: newTotal,
          remainingCredits: newRemaining,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(boutiqueCredits.boutiqueId, boutiqueId));
    }

    // TODO: Record boutique transaction in a separate boutique_transactions table

    // Reactivate subscription if it was suspended
    try {
      await reactivateSubscription(boutiqueId);
      console.log(`[Yoko Webhook] Subscription reactivated for boutique ${boutiqueId}`);
    } catch (error) {
      console.warn(`[Yoko Webhook] Could not reactivate subscription for boutique ${boutiqueId}:`, error);
    }

    console.log(
      `[Yoko Webhook] Payment succeeded for boutique ${boutiqueId}: +${credits} credits`
    );
  } catch (error) {
    console.error("[Yoko Webhook] Error handling boutique credit purchase:", error);
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

  const userId = data.metadata.userId ? parseInt(data.metadata.userId, 10) : null;
  const boutiqueId = data.metadata.boutiqueId ? parseInt(data.metadata.boutiqueId, 10) : null;

  try {
    // Record failed transaction (only if userId exists)
    if (userId) {
      await db.insert(transactions).values({
        userId,
        amount: data.metadata.credits.toString(),
        status: "failed",
        reason: `Failed purchase attempt for ${data.metadata.credits} credits (Order: ${data.id})`,
      });
    }

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

  const userId = data.metadata.userId ? parseInt(data.metadata.userId, 10) : null;
  const boutiqueId = data.metadata.boutiqueId ? parseInt(data.metadata.boutiqueId, 10) : null;

  try {
    // Record canceled transaction (only if userId exists)
    if (userId) {
      await db.insert(transactions).values({
        userId,
        amount: data.metadata.credits.toString(),
        status: "failed",
        reason: `Canceled purchase for ${data.metadata.credits} credits (Order: ${data.id})`,
      });
    }

    console.log(`[Yoko Webhook] Payment canceled for user ${userId}`);
  } catch (error) {
    console.error("[Yoko Webhook] Error handling payment cancellation:", error);
    throw error;
  }
}


/**
 * Handle order payment success (Phase 2 & Phase 3)
 */
export async function handleOrderPaymentSucceeded(data: YokoWebhookPayload["data"], externalEventId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const userId = data.metadata.userId ? parseInt(data.metadata.userId, 10) : null;
  const userEmail = data.metadata.userEmail || "";
  const userName = data.metadata.userName || "Customer";
  const orderNumber = `ORDER-${Date.now()}`;

  if (!userId) {
    throw new Error("Missing userId in metadata");
  }

  try {
    // 1. Get order details
    const order = await db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.orderNumber, orderNumber))
      .limit(1);

    if (order.length === 0) {
      throw new Error(`Order not found: ${orderNumber}`);
    }

    const orderData = order[0];
    const orderId = orderData.id;
    
    // 2. Update order status to confirmed
    await db
      .update(shopOrders)
      .set({ 
        status: "confirmed",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(shopOrders.orderNumber, orderNumber));

    // 3. Record transaction
    await db.insert(transactions).values({
      userId,
      amount: "1",
      status: "completed",
      reason: `Order payment for ${orderNumber} (Order: ${data.id})`,
    });

    // 4. Process immediate payout to boutique (Phase 3)
    try {
      await processOrderPayout(orderId);
      console.log(`[Yoko Webhook] Payout processed for order: ${orderNumber}`);
    } catch (payoutError) {
      console.error(`[Yoko Webhook] Payout processing failed for order ${orderNumber}:`, payoutError);
      // Don't throw - payout failure shouldn't block order confirmation
    }

    // 5. Send order confirmation email to customer
    if (userEmail) {
      const emailHtml = `
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #FF6B35;">Order Confirmed</h2>
              <p>Hi ${userName},</p>
              <p>Thank you for your order! Your order has been confirmed and is being processed.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Order Total:</strong> R${(data.amount / 100).toFixed(2)}</p>
                <p><strong>Delivery Address:</strong> ${orderData.deliveryAddress || 'To be confirmed'}</p>
              </div>
              
              <p>You will receive a shipping notification with tracking information soon.</p>
              <p>If you have any questions, please contact us at <a href="mailto:sales@styleswap.co.za">sales@styleswap.co.za</a></p>
              
              <p style="margin-top: 30px; color: #666; font-size: 12px;">
                Best regards,<br/>
                <strong>StyleSwap Team</strong>
              </p>
            </div>
          </body>
        </html>
      `;
      
      await sendEmailNotification({
        userId,
        type: "order_confirmation",
        recipientEmail: userEmail,
        subject: `Order Confirmation - ${orderNumber}`,
        htmlContent: emailHtml,
      });
    }

    console.log(`[Yoko Webhook] Order payment succeeded: ${orderNumber}`);
  } catch (error) {
    console.error("[Yoko Webhook] Error handling order payment:", error);
    throw error;
  }
}
