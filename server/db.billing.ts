import { getDb } from "./db";
import { boutiqueCredits, boutiqueTransactions } from "../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

/**
 * Billing & Credit Database Helpers
 * Manages credit purchases, usage tracking, and billing
 */

/**
 * Credit pricing tiers (South African Rand)
 */
export const CREDIT_TIERS = [
  { credits: 5, price: 5.00, pricePerCredit: 1.00 },
  { credits: 10, price: 45, pricePerCredit: 4.50 },
  { credits: 20, price: 80, pricePerCredit: 4.00 },
  { credits: 50, price: 150, pricePerCredit: 3.00 },
  { credits: 100, price: 385, pricePerCredit: 3.85 },
  { credits: 200, price: 750, pricePerCredit: 3.75 },
  { credits: 500, price: 1350, pricePerCredit: 2.70 },
  { credits: 1000, price: 2200, pricePerCredit: 2.20 },
  { credits: 5000, price: 6250, pricePerCredit: 1.25 },
  { credits: 20000, price: 18600, pricePerCredit: 0.93 },
];

/**
 * Get credit tier by amount
 */
export function getCreditTier(creditAmount: number) {
  return CREDIT_TIERS.find(tier => tier.credits === creditAmount);
}

/**
 * Get all credit tiers
 */
export function getAllCreditTiers() {
  return CREDIT_TIERS;
}

/**
 * Calculate price for credit amount
 */
export function calculateCreditPrice(creditAmount: number): number | null {
  const tier = getCreditTier(creditAmount);
  return tier ? tier.price : null;
}

/**
 * Create credit purchase transaction
 */
export async function createCreditPurchase(data: {
  boutiqueId: number;
  credits: number;
  price: number;
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
  initiatedBy?: number;
  status?: "pending" | "completed" | "failed";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create transaction record
  const result = await db.insert(boutiqueTransactions).values({
    boutiqueId: data.boutiqueId,
    type: "purchase",
    amount: data.credits,
    price: data.price,
    currency: data.currency || "ZAR",
    initiatedBy: data.initiatedBy,
    description: `Credit purchase: ${data.credits} credits for R${data.price}`,
    status: data.status || "pending",
  } as any);

  return result;
}

/**
 * Complete credit purchase and add credits to boutique
 */
export async function completeCreditPurchase(
  boutiqueId: number,
  credits: number,
  transactionId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current credits
  const creditRecord = await db
    .select()
    .from(boutiqueCredits)
    .where(eq(boutiqueCredits.boutiqueId, boutiqueId))
    .limit(1);

  if (creditRecord.length === 0) {
    throw new Error("Boutique credit record not found");
  }

  const current = creditRecord[0];
  const newTotal = (current.totalCredits || 0) + credits;
  const newRemaining = (current.remainingCredits || 0) + credits;

  // Update credits
  await db
    .update(boutiqueCredits)
    .set({
      totalCredits: newTotal,
      remainingCredits: newRemaining,
    })
    .where(eq(boutiqueCredits.boutiqueId, boutiqueId));

  return { totalCredits: newTotal, remainingCredits: newRemaining };
}

/**
 * Deduct credits for try-on usage
 */
export async function deductCreditsForUsage(
  boutiqueId: number,
  creditsToDeduct: number,
  fitRoomRequestId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current credits
  const creditRecord = await db
    .select()
    .from(boutiqueCredits)
    .where(eq(boutiqueCredits.boutiqueId, boutiqueId))
    .limit(1);

  if (creditRecord.length === 0) {
    throw new Error("Boutique credit record not found");
  }

  const current = creditRecord[0];
  if ((current.remainingCredits || 0) < creditsToDeduct) {
    throw new Error("Insufficient credits");
  }

  const newRemaining = (current.remainingCredits || 0) - creditsToDeduct;
  const newUsed = (current.usedCredits || 0) + creditsToDeduct;

  // Update credits
  await db
    .update(boutiqueCredits)
    .set({
      remainingCredits: newRemaining,
      usedCredits: newUsed,
    })
    .where(eq(boutiqueCredits.boutiqueId, boutiqueId));

  // Log usage transaction
  await db.insert(boutiqueTransactions).values({
    boutiqueId,
    type: "usage",
    amount: creditsToDeduct,
    fitRoomRequestId,
    description: `Try-on usage: ${creditsToDeduct} credits`,
    status: "completed",
  } as any);

  return { remainingCredits: newRemaining, usedCredits: newUsed };
}

/**
 * Get credit balance for boutique
 */
export async function getCreditBalance(boutiqueId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(boutiqueCredits)
    .where(eq(boutiqueCredits.boutiqueId, boutiqueId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Get boutique billing history
 */
export async function getBillingHistory(
  boutiqueId: number,
  type?: "purchase" | "usage" | "refund",
  limit = 50
) {
  const db = await getDb();
  if (!db) return [];

  if (type) {
    return await db
      .select()
      .from(boutiqueTransactions)
      .where(
        and(
          eq(boutiqueTransactions.boutiqueId, boutiqueId),
          eq(boutiqueTransactions.type, type)
        )
      )
      .orderBy(desc(boutiqueTransactions.createdAt))
      .limit(limit);
  }

  return await db
    .select()
    .from(boutiqueTransactions)
    .where(eq(boutiqueTransactions.boutiqueId, boutiqueId))
    .orderBy(desc(boutiqueTransactions.createdAt))
    .limit(limit);
}

/**
 * Get monthly usage statistics
 */
export async function getMonthlyUsageStats(boutiqueId: number, monthsBack = 12) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);

  const transactions = await db
    .select()
    .from(boutiqueTransactions)
    .where(
      and(
        eq(boutiqueTransactions.boutiqueId, boutiqueId),
        eq(boutiqueTransactions.type, "usage"),
        gte(boutiqueTransactions.createdAt, startDate)
      )
    )
    .orderBy(desc(boutiqueTransactions.createdAt));

  // Group by month
  const monthlyStats: Record<string, number> = {};
  transactions.forEach(t => {
    const date = new Date(t.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + (t.amount || 0);
  });

  return Object.entries(monthlyStats).map(([month, credits]) => ({
    month,
    credits,
  }));
}

/**
 * Get total spending (all purchases)
 */
export async function getTotalSpending(boutiqueId: number) {
  const db = await getDb();
  if (!db) return 0;

  const purchases = await db
    .select()
    .from(boutiqueTransactions)
    .where(
      and(
        eq(boutiqueTransactions.boutiqueId, boutiqueId),
        eq(boutiqueTransactions.type, "purchase"),
        eq(boutiqueTransactions.status, "completed")
      )
    );

  return purchases.reduce((sum, p) => sum + (typeof p.price === 'number' ? p.price : 0), 0);
}

/**
 * Get total credits purchased
 */
export async function getTotalCreditsPurchased(boutiqueId: number) {
  const db = await getDb();
  if (!db) return 0;

  const purchases = await db
    .select()
    .from(boutiqueTransactions)
    .where(
      and(
        eq(boutiqueTransactions.boutiqueId, boutiqueId),
        eq(boutiqueTransactions.type, "purchase"),
        eq(boutiqueTransactions.status, "completed")
      )
    );

  return purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
}

/**
 * Get total credits used
 */
export async function getTotalCreditsUsed(boutiqueId: number) {
  const db = await getDb();
  if (!db) return 0;

  const usage = await db
    .select()
    .from(boutiqueTransactions)
    .where(
      and(
        eq(boutiqueTransactions.boutiqueId, boutiqueId),
        eq(boutiqueTransactions.type, "usage")
      )
    );

  return usage.reduce((sum, u) => sum + (u.amount || 0), 0);
}

/**
 * Check if credits are expired (30 days from purchase)
 */
export function areCreditExpired(lastPurchaseDate: Date | null): boolean {
  if (!lastPurchaseDate) return false;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(lastPurchaseDate) < thirtyDaysAgo;
}

/**
 * Get credit expiration date (30 days from purchase)
 */
export function getCreditExpirationDate(lastPurchaseDate: Date | null): Date | null {
  if (!lastPurchaseDate) return null;
  const expirationDate = new Date(lastPurchaseDate);
  expirationDate.setDate(expirationDate.getDate() + 30);
  return expirationDate;
}
