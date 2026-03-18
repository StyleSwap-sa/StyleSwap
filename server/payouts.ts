import { db } from "./db";
import { shopOrders, payouts, payoutTransactions, payoutAuditLog } from "@/drizzle/schema";
import { eq, gte, lte, and, desc } from "drizzle-orm";

// Constants
const STYLESWAP_COMMISSION_PERCENTAGE = 0.05; // 5%
const YOKO_FEE_PERCENTAGE = 0.025; // 2.5% (typical payment processor fee)

interface PayoutCalculation {
  totalRevenue: number;
  yokoFees: number;
  styleswapCommission: number;
  boutiquePayout: number;
}

/**
 * Calculate payout amounts for a given order
 */
export function calculateOrderPayout(orderAmount: number): PayoutCalculation {
  const yokoFees = orderAmount * YOKO_FEE_PERCENTAGE;
  const amountAfterYokoFees = orderAmount - yokoFees;
  const styleswapCommission = amountAfterYokoFees * STYLESWAP_COMMISSION_PERCENTAGE;
  const boutiquePayout = amountAfterYokoFees - styleswapCommission;

  return {
    totalRevenue: orderAmount,
    yokoFees,
    styleswapCommission,
    boutiquePayout,
  };
}

/**
 * Get all confirmed orders for a boutique in a date range
 */
export async function getBoutiqueOrdersInPeriod(
  boutiqueId: number,
  startDate: string,
  endDate: string
) {
  const orders = await db
    .select()
    .from(shopOrders)
    .where(
      and(
        eq(shopOrders.boutiqueId, boutiqueId),
        eq(shopOrders.status, "confirmed"),
        gte(shopOrders.createdAt, startDate),
        lte(shopOrders.createdAt, endDate)
      )
    );

  return orders;
}

/**
 * Calculate total payout for a boutique in a period
 */
export async function calculateBoutiquePayout(
  boutiqueId: number,
  startDate: string,
  endDate: string
): Promise<PayoutCalculation & { orders: any[] }> {
  const orders = await getBoutiqueOrdersInPeriod(boutiqueId, startDate, endDate);

  let totalRevenue = 0;
  let totalYokoFees = 0;
  let totalStyleswapCommission = 0;
  let totalBoutiquePayout = 0;

  for (const order of orders) {
    const calculation = calculateOrderPayout(Number(order.amount));
    totalRevenue += calculation.totalRevenue;
    totalYokoFees += calculation.yokoFees;
    totalStyleswapCommission += calculation.styleswapCommission;
    totalBoutiquePayout += calculation.boutiquePayout;
  }

  return {
    totalRevenue,
    yokoFees: totalYokoFees,
    styleswapCommission: totalStyleswapCommission,
    boutiquePayout: totalBoutiquePayout,
    orders,
  };
}

/**
 * Create a payout record for a boutique
 */
export async function createPayout(
  boutiqueId: number,
  startDate: string,
  endDate: string,
  calculation: PayoutCalculation & { orders: any[] }
) {
  // Generate reference number
  const referenceNumber = `PAY-${boutiqueId}-${Date.now()}`;

  // Create payout record
  const result = await db.insert(payouts).values({
    boutiqueId,
    payoutPeriodStart: startDate,
    payoutPeriodEnd: endDate,
    totalRevenue: calculation.totalRevenue.toString(),
    yokoFees: calculation.yokoFees.toString(),
    styleswapCommission: calculation.styleswapCommission.toString(),
    boutiquePayout: calculation.boutiquePayout.toString(),
    status: "pending",
    referenceNumber,
  });

  const payoutId = result.insertId;

  // Create payout transactions for each order
  for (const order of calculation.orders) {
    const orderCalculation = calculateOrderPayout(Number(order.amount));
    await db.insert(payoutTransactions).values({
      payoutId: Number(payoutId),
      orderId: order.id,
      orderAmount: order.amount.toString(),
      yokoFee: orderCalculation.yokoFees.toString(),
      styleswapCommission: orderCalculation.styleswapCommission.toString(),
      boutiqueShare: orderCalculation.boutiquePayout.toString(),
    });
  }

  // Log audit
  await db.insert(payoutAuditLog).values({
    payoutId: Number(payoutId),
    action: "PAYOUT_CREATED",
    oldStatus: null,
    newStatus: "pending",
    actorType: "system",
    details: JSON.stringify({
      totalRevenue: calculation.totalRevenue,
      boutiquePayout: calculation.boutiquePayout,
      orderCount: calculation.orders.length,
    }),
  });

  return payoutId;
}

/**
 * Update payout status
 */
export async function updatePayoutStatus(
  payoutId: number,
  newStatus: "pending" | "processing" | "completed" | "failed",
  notes?: string
) {
  const payout = await db.query.payouts.findFirst({
    where: eq(payouts.id, payoutId),
  });

  if (!payout) {
    throw new Error("Payout not found");
  }

  await db
    .update(payouts)
    .set({
      status: newStatus,
      ...(newStatus === "completed" && { payoutDate: new Date().toISOString() }),
      ...(notes && { notes }),
    })
    .where(eq(payouts.id, payoutId));

  // Log audit
  await db.insert(payoutAuditLog).values({
    payoutId,
    action: "PAYOUT_STATUS_UPDATED",
    oldStatus: payout.status,
    newStatus,
    actorType: "system",
    details: JSON.stringify({ notes }),
  });
}

/**
 * Get all pending payouts
 */
export async function getPendingPayouts() {
  return await db
    .select()
    .from(payouts)
    .where(eq(payouts.status, "pending"))
    .orderBy(desc(payouts.createdAt));
}

/**
 * Get payout history for a boutique
 */
export async function getBoutiquePayoutHistory(boutiqueId: number) {
  return await db
    .select()
    .from(payouts)
    .where(eq(payouts.boutiqueId, boutiqueId))
    .orderBy(desc(payouts.createdAt));
}

/**
 * Get payout details with transactions
 */
export async function getPayoutDetails(payoutId: number) {
  const payout = await db.query.payouts.findFirst({
    where: eq(payouts.id, payoutId),
  });

  if (!payout) {
    throw new Error("Payout not found");
  }

  const transactions = await db
    .select()
    .from(payoutTransactions)
    .where(eq(payoutTransactions.payoutId, payoutId));

  const auditLog = await db
    .select()
    .from(payoutAuditLog)
    .where(eq(payoutAuditLog.payoutId, payoutId))
    .orderBy(desc(payoutAuditLog.createdAt));

  return {
    payout,
    transactions,
    auditLog,
  };
}
