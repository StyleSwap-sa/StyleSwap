import { Request, Response } from "express";

/**
 * Test endpoint to simulate Yoco webhook
 * POST /api/webhooks/yoco/test
 * 
 * Example usage:
 * curl -X POST http://localhost:3000/api/webhooks/yoco/test \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "boutiqueId": 120017,
 *     "credits": 200,
 *     "amount": 75000
 *   }'
 */
export async function testYocoBoutiqueWebhook(req: Request, res: Response) {
  try {
    const { boutiqueId, credits, amount } = req.body;

    if (!boutiqueId || !credits || !amount) {
      return res.status(400).json({
        error: "Missing required fields: boutiqueId, credits, amount",
      });
    }

    // Simulate a Yoco webhook event
    const webhookPayload = {
      id: `evt_test_${Date.now()}`,
      type: "checkout.completed",
      created: Math.floor(Date.now() / 1000),
      data: {
        id: `ch_test_${Date.now()}`,
        status: "succeeded",
        amount: amount, // in cents
        currency: "ZAR",
        metadata: {
          boutiqueId: boutiqueId.toString(),
          credits: credits.toString(),
          packageId: `pkg_${credits}_credits`,
        },
      },
    };

    console.log("[Test Webhook] Simulating Yoco webhook:", webhookPayload);

    // Call the actual webhook handler
    const response = await fetch("http://localhost:3000/api/webhooks/yoco/boutique", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    const result = await response.json();

    console.log("[Test Webhook] Webhook response:", result);

    res.json({
      success: true,
      message: `Test webhook sent for boutique ${boutiqueId}`,
      payload: webhookPayload,
      webhookResponse: result,
    });
  } catch (error) {
    console.error("[Test Webhook] Error:", error);
    res.status(500).json({
      error: "Failed to send test webhook",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
