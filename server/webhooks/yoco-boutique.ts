import { Request, Response } from "express";
import { getDb } from "../db";
import { boutiqueCredits } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { addBoutiqueCredit } from "../db.boutiques";
import crypto from "crypto";

export interface YocoCheckoutWebhook {
  id: string;
  type: string;
  created: number;
  data: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: {
      boutiqueId?: string;
      credits?: number;
      packageId?: string;
    };
  };
}

/**
 * Verify Yoco webhook signature
 */
function verifyYocoSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hash = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return hash === signature;
  } catch (error) {
    console.error("[Yoco Webhook] Signature verification error:", error);
    return false;
  }
}

/**
 * Handle Yoco boutique payment webhooks
 */
export async function handleYocoBoutiqueWebhook(req: Request, res: Response) {
  try {
    console.log("[Yoco Boutique Webhook] Received webhook event");
    console.log("[Yoco Boutique Webhook] Headers:", req.headers);
    console.log("[Yoco Boutique Webhook] Body:", JSON.stringify(req.body, null, 2));

    const event: YocoCheckoutWebhook = req.body;

    // Log event details
    console.log(`[Yoco Boutique Webhook] Event type: ${event.type}`);
    console.log(`[Yoco Boutique Webhook] Event ID: ${event.id}`);
    console.log(`[Yoco Boutique Webhook] Checkout status: ${event.data.status}`);

    // Handle different event types
    switch (event.type) {
      case "checkout.completed":
        console.log("[Yoco Boutique Webhook] Processing checkout.completed event");
        await handleCheckoutCompleted(event.data);
        break;
      case "checkout.expired":
        console.log("[Yoco Boutique Webhook] Checkout expired");
        break;
      case "checkout.payment_failed":
        console.log("[Yoco Boutique Webhook] Checkout payment failed");
        break;
      default:
        console.log(`[Yoco Boutique Webhook] Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error("[Yoco Boutique Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle successful checkout
 */
async function handleCheckoutCompleted(data: YocoCheckoutWebhook["data"]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Extract boutique ID and credits from metadata
    const boutiqueIdStr = data.metadata?.boutiqueId || "0";
    const creditsStr = data.metadata?.credits || "0";
    const boutiqueId = typeof boutiqueIdStr === 'string' ? parseInt(boutiqueIdStr, 10) : boutiqueIdStr;
    const credits = typeof creditsStr === 'string' ? parseInt(creditsStr, 10) : creditsStr;
    const packageId = data.metadata?.packageId || "";

    console.log(`[Yoco Boutique Webhook] Processing checkout for boutique ${boutiqueId}`);
    console.log(`[Yoco Boutique Webhook] Credits: ${credits}, Amount: R${data.amount / 100}`);

    if (!boutiqueId || !credits) {
      console.error("[Yoco Boutique Webhook] Missing boutique ID or credits in metadata");
      return;
    }

    // Add credits to boutique
    await addBoutiqueCredit(boutiqueId, credits);

    console.log(
      `[Yoco Boutique Webhook] Successfully added ${credits} credits to boutique ${boutiqueId}`
    );
  } catch (error) {
    console.error("[Yoco Boutique Webhook] Error handling checkout completion:", error);
    throw error;
  }
}
