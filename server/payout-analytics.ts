import { getDb } from "./db";
import { payouts, shopOrders } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import Decimal from "decimal.js";

export interface PayoutAnalytics {
  totalEarnings: string;
  totalPayouts: string;
  averagePayoutAmount: string;
  payoutFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  payoutTrends: Array<{
    date: string;
    amount: string;
    count: number;
  }>;
  topEarningDays: Array<{
    date: string;
    amount: string;
  }>;
}

/**
 * Get payout analytics for a boutique
 */
export async function getPayoutAnalytics(boutiqueId: string, days: number = 90): Promise<PayoutAnalytics | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Payout Analytics] Database not available");
      return null;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get completed payouts in the period
    const completedPayouts = await db
      .select()
      .from(payouts)
      .where(
        and(
          eq(payouts.boutiqueId, boutiqueId),
          eq(payouts.status, "completed"),
          gte(payouts.updatedAt, startDate)
        )
      );

    if (completedPayouts.length === 0) {
      return {
        totalEarnings: "0.00",
        totalPayouts: "0.00",
        averagePayoutAmount: "0.00",
        payoutFrequency: {
          daily: 0,
          weekly: 0,
          monthly: 0,
        },
        payoutTrends: [],
        topEarningDays: [],
      };
    }

    // Calculate totals
    const totalPayouts = completedPayouts.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const averagePayoutAmount = totalPayouts / completedPayouts.length;

    // Group payouts by date for trends
    const payoutsByDate: Record<string, { amount: number; count: number }> = {};
    completedPayouts.forEach((payout) => {
      const date = payout.updatedAt.toISOString().split("T")[0];
      if (!payoutsByDate[date]) {
        payoutsByDate[date] = { amount: 0, count: 0 };
      }
      payoutsByDate[date].amount += parseFloat(payout.amount);
      payoutsByDate[date].count += 1;
    });

    // Convert to array and sort by date
    const payoutTrends = Object.entries(payoutsByDate)
      .map(([date, data]) => ({
        date,
        amount: new Decimal(data.amount).toFixed(2),
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get top earning days
    const topEarningDays = [...payoutTrends]
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 7);

    // Calculate payout frequency
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyPayouts = completedPayouts.filter((p) => p.updatedAt >= oneWeekAgo).length;
    const weeklyPayouts = completedPayouts.filter((p) => p.updatedAt >= oneMonthAgo).length;
    const monthlyPayouts = completedPayouts.length;

    return {
      totalEarnings: new Decimal(totalPayouts).toFixed(2),
      totalPayouts: completedPayouts.length.toString(),
      averagePayoutAmount: new Decimal(averagePayoutAmount).toFixed(2),
      payoutFrequency: {
        daily: dailyPayouts,
        weekly: weeklyPayouts,
        monthly: monthlyPayouts,
      },
      payoutTrends,
      topEarningDays,
    };
  } catch (error) {
    console.error("[Payout Analytics] Error calculating analytics:", error);
    return null;
  }
}

/**
 * Get order-based analytics for earnings
 */
export async function getOrderAnalytics(boutiqueId: string, days: number = 90) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Order Analytics] Database not available");
      return null;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get completed orders in the period
    const completedOrders = await db
      .select()
      .from(shopOrders)
      .where(
        and(
          eq(shopOrders.boutiqueId, boutiqueId),
          eq(shopOrders.status, "completed"),
          gte(shopOrders.createdAt, startDate)
        )
      );

    if (completedOrders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: "0.00",
        averageOrderValue: "0.00",
        orderTrends: [],
        topSellingDays: [],
      };
    }

    // Calculate totals
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const averageOrderValue = totalRevenue / completedOrders.length;

    // Group orders by date for trends
    const ordersByDate: Record<string, { revenue: number; count: number }> = {};
    completedOrders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      if (!ordersByDate[date]) {
        ordersByDate[date] = { revenue: 0, count: 0 };
      }
      ordersByDate[date].revenue += parseFloat(order.totalAmount);
      ordersByDate[date].count += 1;
    });

    // Convert to array and sort by date
    const orderTrends = Object.entries(ordersByDate)
      .map(([date, data]) => ({
        date,
        revenue: new Decimal(data.revenue).toFixed(2),
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get top selling days
    const topSellingDays = [...orderTrends]
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
      .slice(0, 7);

    return {
      totalOrders: completedOrders.length,
      totalRevenue: new Decimal(totalRevenue).toFixed(2),
      averageOrderValue: new Decimal(averageOrderValue).toFixed(2),
      orderTrends,
      topSellingDays,
    };
  } catch (error) {
    console.error("[Order Analytics] Error calculating analytics:", error);
    return null;
  }
}
