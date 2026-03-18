import { getDb } from "./db";
import { shopOrders, payouts, payoutTransactions, payoutAuditLog, boutiqueBankAccounts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { Decimal } from "decimal.js";
import { createPayout, formatBankAccountType, validateBankAccountDetails } from "./yoco-payouts";

/**
 * StyleSwap Credit-Based System
 * 
 * StyleSwap operates on a CREDIT-BASED model only:
 * - Customers purchase credits to use try-on features
 * - Boutiques purchase credits to generate try-ons for their products
 * - NO commission is taken by StyleSwap
 * - NO payout processing for boutiques (they purchase credits directly)
 * 
 * Revenue Model:
 * - Customers buy credits: R10 = 100 credits
 * - Boutiques buy credits: R10 = 100 credits
 * - Each try-on costs 1 credit (paid by customer)
 * - Boutiques use credits to generate try-ons for their products
 * 
 * This file is maintained for backward compatibility but all functions
 * now return credit-based responses instead of commission calculations.
 */

/**
 * Calculate credit-based amounts (no commissions)
 * 
 * @deprecated This function is kept for backward compatibility
 * StyleSwap no longer uses commission-based payouts
 */
export function calculatePayoutAmounts(orderAmount: number | string) {
  const amount = new Decimal(orderAmount);
  
  // StyleSwap credit-based system: no commissions
  // All revenue goes to StyleSwap as credit purchases
  return {
    totalAmount: amount,
    yocoFee: new Decimal(0).toNumber(), // No Yoco fee in credit system
    styleswapCommission: new Decimal(0).toNumber(), // No commission
    boutiqueShare: new Decimal(0).toNumber(), // No payout (credit-based only)
  };
}

/**
 * Process credit purchase for a boutique
 * Called after successful credit purchase payment
 * 
 * @deprecated StyleSwap uses credit-based system, not commission payouts
 */
export async function processOrderPayout(orderId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    console.log(`[Credit System] Processing credit purchase for order ID: ${orderId}`);

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

    // 2. Log credit purchase (no payout needed in credit-based system)
    const today = new Date();
    const payoutPeriodStart = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const payoutPeriodEnd = today.toISOString().split("T")[0];

    // Create record for audit purposes only
    const payoutResult = await db.insert(payouts).values({
      boutiqueId,
      payoutPeriodStart,
      payoutPeriodEnd,
      totalRevenue: orderAmount.toString(),
      yokoFees: "0", // No Yoco fees in credit system
      styleswapCommission: "0", // No commission
      boutiquePayout: "0", // No payout (credits purchased directly)
      status: "completed", // Credit purchases are immediate
      payoutDate: new Date(),
      referenceNumber: `CREDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      notes: `Credit purchase for order ${orderData.orderNumber} - StyleSwap credit-based system`,
    });

    const payoutId = (payoutResult as any).insertId;
    console.log(`[Credit System] Recorded credit purchase: ${payoutId}`);

    // 3. Create transaction record for audit
    await db.insert(payoutTransactions).values({
      payoutId,
      orderId,
      orderAmount: orderAmount.toString(),
      yokoFee: "0",
      styleswapCommission: "0",
      boutiqueShare: "0",
    });

    // 4. Log audit entry
    await db.insert(payoutAuditLog).values({
      payoutId,
      action: "credit_purchase",
      oldStatus: null,
      newStatus: "completed",
      actorId: null,
      actorType: "system",
      details: JSON.stringify({
        orderNumber: orderData.orderNumber,
        orderAmount,
        creditsPurchased: Math.floor(orderAmount * 10), // Example: R10 = 100 credits
        system: "credit-based",
      }),
    });

    console.log(`[Credit System] Credit purchase completed: ${payoutId}`);
    return { payoutId, status: "completed", amount: orderAmount, creditsAdded: Math.floor(orderAmount * 10) };
  } catch (error) {
    console.error("[Credit System] Error processing credit purchase:", error);
    throw error;
  }
}

/**
 * Get payout history for a boutique
 * In credit-based system, this returns credit purchase history
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

    // Transform to credit purchase history
    return payoutHistory.map((record: any) => ({
      ...record,
      type: "credit_purchase",
      creditsAdded: Math.floor(parseFloat(record.totalRevenue) * 10),
    }));
  } catch (error) {
    console.error("[Credit System] Error fetching credit purchase history:", error);
    throw error;
  }
}

/**
 * Get payout details with transactions
 * In credit-based system, this returns credit purchase details
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
      throw new Error(`Credit purchase record not found: ${payoutId}`);
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
      payout: {
        ...payout[0],
        type: "credit_purchase",
        creditsAdded: Math.floor(parseFloat(payout[0].totalRevenue) * 10),
      },
      transactions,
      auditLog,
    };
  } catch (error) {
    console.error("[Credit System] Error fetching credit purchase details:", error);
    throw error;
  }
}
