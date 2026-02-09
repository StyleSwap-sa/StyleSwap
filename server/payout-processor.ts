import { getDb } from "./db";
import { shopOrders, payouts, payoutTransactions, payoutAuditLog, boutiqueBankAccounts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { Decimal } from "decimal.js";

/**
 * Calculate payout amounts based on order total
 * 
 * Revenue Split:
 * - Customer pays: 100%
 * - Yoco takes: 2.5%
 * - StyleSwap takes: 5% commission
 * - Boutique receives: 92.5% (after Yoco fee and StyleSwap commission)
 * 
 * Example: Customer pays R100
 * - Yoco fee: R2.50 (2.5%)
 * - StyleSwap commission: R5.00 (5%)
 * - Boutique payout: R92.50 (92.5%)
 */
export function calculatePayoutAmounts(orderAmount: number | string) {
  const amount = new Decimal(orderAmount);
  
  // Yoco takes 2.5% of the total
  const yocoFee = amount.times(0.025);
  
  // StyleSwap takes 5% of the total
  const styleswapCommission = amount.times(0.05);
  
  // Boutique gets 92.5% of the total
  const boutiqueShare = amount.times(0.925);
  
  return {
    totalAmount: amount,
    yocoFee: yocoFee.toNumber(),
    styleswapCommission: styleswapCommission.toNumber(),
    boutiqueShare: boutiqueShare.toNumber(),
  };
}

/**
 * Process immediate payout for a boutique order
 * Called after successful payment confirmation
 */
export async function processOrderPayout(orderId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    console.log(`[Payout] Processing payout for order ID: ${orderId}`);

    // 1. Get order details
    const order = await db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const orderData = order[0];
    const boutiqueId = orderData.boutiqueId;
    const orderAmount = parseFloat(orderData.amount.toString());

    // 2. Check if boutique has verified bank account
    const bankAccount = await db
      .select()
      .from(boutiqueBankAccounts)
      .where(eq(boutiqueBankAccounts.boutiqueId, boutiqueId))
      .limit(1);

    if (bankAccount.length === 0) {
      console.warn(`[Payout] No bank account found for boutique ${boutiqueId}, payout pending`);
      // Create payout record with pending status
      await createPendingPayout(db, boutiqueId, orderId, orderAmount);
      return;
    }

    if (!bankAccount[0].isVerified) {
      console.warn(`[Payout] Bank account not verified for boutique ${boutiqueId}, payout pending`);
      // Create payout record with pending status
      await createPendingPayout(db, boutiqueId, orderId, orderAmount);
      return;
    }

    // 3. Calculate payout amounts
    const payoutAmounts = calculatePayoutAmounts(orderAmount);

    // 4. Create payout record
    const today = new Date();
    const payoutPeriodStart = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const payoutPeriodEnd = today.toISOString().split("T")[0];

    const payoutResult = await db.insert(payouts).values({
      boutiqueId,
      payoutPeriodStart,
      payoutPeriodEnd,
      totalRevenue: orderAmount.toString(),
      yokoFees: payoutAmounts.yocoFee.toString(),
      styleswapCommission: payoutAmounts.styleswapCommission.toString(),
      boutiquePayout: payoutAmounts.boutiqueShare.toString(),
      status: "processing",
      payoutDate: new Date(),
      referenceNumber: `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      notes: `Immediate payout for order ${orderData.orderNumber}`,
    });

    const payoutId = (payoutResult as any).insertId;
    console.log(`[Payout] Created payout record: ${payoutId}`);

    // 5. Create payout transaction record
    await db.insert(payoutTransactions).values({
      payoutId,
      orderId,
      orderAmount: orderAmount.toString(),
      yokoFee: payoutAmounts.yocoFee.toString(),
      styleswapCommission: payoutAmounts.styleswapCommission.toString(),
      boutiqueShare: payoutAmounts.boutiqueShare.toString(),
    });

    // 6. Log audit entry
    await db.insert(payoutAuditLog).values({
      payoutId,
      action: "payout_created",
      oldStatus: null,
      newStatus: "processing",
      actorId: null,
      actorType: "system",
      details: JSON.stringify({
        orderNumber: orderData.orderNumber,
        orderAmount,
        yocoFee: payoutAmounts.yocoFee,
        styleswapCommission: payoutAmounts.styleswapCommission,
        boutiqueShare: payoutAmounts.boutiqueShare,
        bankAccount: bankAccount[0].accountNumber.slice(-4), // Last 4 digits
      }),
    });

    // 7. TODO: Integrate with actual payment processor (e.g., Paystack, Flutterwave)
    // For now, mark as completed (in production, this would call the payment API)
    await db
      .update(payouts)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(payouts.id, payoutId));

    // 8. Log completion
    await db.insert(payoutAuditLog).values({
      payoutId,
      action: "payout_completed",
      oldStatus: "processing",
      newStatus: "completed",
      actorId: null,
      actorType: "system",
      details: JSON.stringify({
        completedAt: new Date().toISOString(),
        bankAccount: bankAccount[0].accountNumber.slice(-4),
      }),
    });

    console.log(`[Payout] Payout processed successfully: ${payoutId}`);
    return { payoutId, status: "completed", amount: payoutAmounts.boutiqueShare };
  } catch (error) {
    console.error("[Payout] Error processing payout:", error);
    throw error;
  }
}

/**
 * Create a pending payout when bank account is not verified
 */
async function createPendingPayout(
  db: any,
  boutiqueId: number,
  orderId: number,
  orderAmount: number
) {
  try {
    const payoutAmounts = calculatePayoutAmounts(orderAmount);
    const today = new Date();
    const payoutPeriodStart = today.toISOString().split("T")[0];
    const payoutPeriodEnd = today.toISOString().split("T")[0];

    const payoutResult = await db.insert(payouts).values({
      boutiqueId,
      payoutPeriodStart,
      payoutPeriodEnd,
      totalRevenue: orderAmount.toString(),
      yokoFees: payoutAmounts.yocoFee.toString(),
      styleswapCommission: payoutAmounts.styleswapCommission.toString(),
      boutiquePayout: payoutAmounts.boutiqueShare.toString(),
      status: "pending",
      referenceNumber: `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      notes: `Pending payout for order - awaiting bank account verification`,
    });

    const payoutId = (payoutResult as any).insertId;

    // Create payout transaction record
    await db.insert(payoutTransactions).values({
      payoutId,
      orderId,
      orderAmount: orderAmount.toString(),
      yokoFee: payoutAmounts.yocoFee.toString(),
      styleswapCommission: payoutAmounts.styleswapCommission.toString(),
      boutiqueShare: payoutAmounts.boutiqueShare.toString(),
    });

    // Log audit entry
    await db.insert(payoutAuditLog).values({
      payoutId,
      action: "payout_pending",
      oldStatus: null,
      newStatus: "pending",
      actorId: null,
      actorType: "system",
      details: JSON.stringify({
        reason: "Bank account not verified",
        orderAmount,
      }),
    });

    console.log(`[Payout] Created pending payout: ${payoutId}`);
    return payoutId;
  } catch (error) {
    console.error("[Payout] Error creating pending payout:", error);
    throw error;
  }
}

/**
 * Get payout history for a boutique
 */
export async function getBoutiquePayoutHistory(boutiqueId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const payoutHistory = await db
      .select()
      .from(payouts)
      .where(eq(payouts.boutiqueId, boutiqueId))
      .orderBy(payouts.createdAt);

    return payoutHistory;
  } catch (error) {
    console.error("[Payout] Error fetching payout history:", error);
    throw error;
  }
}

/**
 * Get payout details with transactions
 */
export async function getPayoutDetails(payoutId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const payout = await db
      .select()
      .from(payouts)
      .where(eq(payouts.id, payoutId))
      .limit(1);

    if (payout.length === 0) {
      throw new Error(`Payout not found: ${payoutId}`);
    }

    const transactions = await db
      .select()
      .from(payoutTransactions)
      .where(eq(payoutTransactions.payoutId, payoutId));

    const auditLog = await db
      .select()
      .from(payoutAuditLog)
      .where(eq(payoutAuditLog.payoutId, payoutId));

    return {
      payout: payout[0],
      transactions,
      auditLog,
    };
  } catch (error) {
    console.error("[Payout] Error fetching payout details:", error);
    throw error;
  }
}
