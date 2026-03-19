import { Router } from "express";
import { getDb } from "../db";
import { payouts, payoutAuditLog } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { handlePayoutStatusUpdate } from "../payout-notifications";

const router = Router();

/**
 * Yoco Payouts Webhook Handler
 * 
 * Webhook events from Yoco for payout status updates:
 * - payout.sent: Money request sent to bank
 * - payout.paid: Payout successful
 * - payout.unpaid: Payout failed after being successful (returned by bank)
 * - payout.failed: Payout rejected immediately
 */

interface YocoPayoutWebhookEvent {
  id: string;
  type: "payout.sent" | "payout.paid" | "payout.unpaid" | "payout.failed";
  data: {
    id: string;
    status: "sent" | "paid" | "unpaid" | "failed";
    amount: number;
    currency: string;
    reference?: string;
    metadata?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
    failureReason?: string;
  };
  createdAt: string;
}

/**
 * Map Yoco payout status to our internal status
 */
function mapYocoPayoutStatus(yocoStatus: string): "pending" | "processing" | "completed" | "failed" {
  switch (yocoStatus) {
    case "sent":
      return "processing";
    case "paid":
      return "completed";
    case "unpaid":
      return "failed";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * Handle Yoco payout webhook events
 */
router.post("/yoco-payouts", async (req, res) => {
  try {
    const event: YocoPayoutWebhookEvent = req.body;

    // Validate event structure
    if (!event.id || !event.type || !event.data) {
      console.warn("[Yoco Payouts Webhook] Invalid event structure:", event);
      return res.status(400).json({ error: "Invalid event structure" });
    }

    console.log(`[Yoco Payouts Webhook] Received event: ${event.type} for payout ${event.data.id}`);

    const db = await getDb();
    if (!db) {
      console.error("[Yoco Payouts Webhook] Database not available");
      return res.status(503).json({ error: "Database not available" });
    }

    // Find the payout by reference number (Yoco payout ID)
    const existingPayout = await db
      .select()
      .from(payouts)
      .where(eq(payouts.referenceNumber, event.data.id))
      .limit(1);

    if (existingPayout.length === 0) {
      console.warn(`[Yoco Payouts Webhook] Payout not found for Yoco ID: ${event.data.id}`);
      // Still return 200 to acknowledge receipt (idempotent)
      return res.json({ acknowledged: true });
    }

    const payout = existingPayout[0];
    const oldStatus = payout.status;
    const newStatus = mapYocoPayoutStatus(event.data.status);

    // Update payout status
    await db
      .update(payouts)
      .set({
        status: newStatus,
        updatedAt: new Date().toISOString(),
        notes: event.data.failureReason
          ? `Yoco payout ${event.data.status}: ${event.data.failureReason}`
          : undefined,
      })
      .where(eq(payouts.id, payout.id));

    // Log the status change
    await db.insert(payoutAuditLog).values({
      payout_id: payout.id,
      action: `payout_yoco_${event.data.status}`,
      oldStatus,
      newStatus,
      actorId: null,
      actorType: "system",
      details: JSON.stringify({
        yocoEventId: event.id,
        yocoPayoutId: event.data.id,
        yocoStatus: event.data.status,
        failureReason: event.data.failureReason,
        webhookReceivedAt: new Date().toISOString(),
      }),
    });

    console.log(
      `[Yoco Payouts Webhook] Updated payout ${payout.id}: ${oldStatus} → ${newStatus}`
    );

    // Handle specific status changes and send notifications
    if (event.data.status === "paid") {
      console.log(`[Yoco Payouts Webhook] Payout completed: ${payout.id}`);
      await handlePayoutStatusUpdate(payout.id.toString(), "completed");
    } else if (event.data.status === "failed" || event.data.status === "unpaid") {
      console.log(`[Yoco Payouts Webhook] Payout failed: ${payout.id}`);
      await handlePayoutStatusUpdate(payout.id.toString(), "failed", event.data.failureReason);
    } else if (event.data.status === "sent") {
      console.log(`[Yoco Payouts Webhook] Payout sent: ${payout.id}`);
      await handlePayoutStatusUpdate(payout.id.toString(), "processing");
    }

    res.json({ acknowledged: true });
  } catch (error) {
    console.error("[Yoco Payouts Webhook] Error processing webhook:", error);
    // Return 200 to prevent Yoco from retrying
    // Log the error for manual investigation
    res.status(200).json({ error: "Internal server error", acknowledged: false });
  }
});

/**
 * Health check endpoint for webhook
 */
router.get("/yoco-payouts/health", (req, res) => {
  res.json({ status: "ok", service: "yoco-payouts-webhook" });
});

export default router;
