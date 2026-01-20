import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAllBoutiques,
  updateBoutique,
  getBoutiqueById,
  getBoutiquesByOwner,
} from "../db.boutiques";
import { getBillingHistory, getTotalSpending, getTotalCreditsUsed } from "../db.billing";
import { getBoutiqueTryOnResults, getBoutiqueUsageStats } from "../db.tryons";
import { getDb } from "../db";
import { boutiqueTransactions, tryOnResults } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Admin Management Router
 * Platform-level controls and monitoring
 */

export const adminRouter = router({
  /**
   * Get all boutiques (admin only)
   */
  getAllBoutiques: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "suspended", "inactive"]).optional(),
        limit: z.number().optional().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view all boutiques",
        });
      }

      return await getAllBoutiques(input.status);
    }),

  /**
   * Get boutique details with analytics
   */
  getBoutiqueDetails: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view boutique details",
        });
      }

      const boutique = await getBoutiqueById(input.boutiqueId);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      const totalSpending = await getTotalSpending(input.boutiqueId);
      const totalUsed = await getTotalCreditsUsed(input.boutiqueId);
      const usageStats = await getBoutiqueUsageStats(input.boutiqueId);

      return {
        ...boutique,
        analytics: {
          totalSpending,
          totalCreditsUsed: totalUsed,
          usageStats,
        },
      };
    }),

  /**
   * Suspend boutique
   */
  suspendBoutique: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can suspend boutiques",
        });
      }

      const boutique = await getBoutiqueById(input.boutiqueId);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      await updateBoutique(input.boutiqueId, { status: "suspended" });

      return {
        success: true,
        message: `Boutique ${boutique.name} has been suspended`,
      };
    }),

  /**
   * Reactivate boutique
   */
  reactivateBoutique: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can reactivate boutiques",
        });
      }

      const boutique = await getBoutiqueById(input.boutiqueId);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      await updateBoutique(input.boutiqueId, { status: "active" });

      return {
        success: true,
        message: `Boutique ${boutique.name} has been reactivated`,
      };
    }),

  /**
   * Get platform statistics
   */
  getPlatformStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view platform stats",
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    // Get total boutiques
    const allBoutiques = await getAllBoutiques();
    const activeBoutiques = await getAllBoutiques("active");

    // Get total try-ons
    const allTryOns = await db.select().from(tryOnResults);

    // Get total revenue
    const allTransactions = await db.select().from(boutiqueTransactions);
    const totalRevenue = allTransactions
      .filter(t => t.type === "purchase" && t.status === "completed")
      .reduce((sum, t) => sum + (typeof t.price === 'number' ? t.price : 0), 0);

    const totalCreditsUsed = allTransactions
      .filter(t => t.type === "usage")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Get this month's stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthTryOns = allTryOns.filter(t => new Date(t.createdAt) >= monthStart).length;
    const thisMonthRevenue = allTransactions
      .filter(
        t =>
          t.type === "purchase" &&
          t.status === "completed" &&
          new Date(t.createdAt) >= monthStart
      )
      .reduce((sum, t) => sum + (typeof t.price === 'number' ? t.price : 0), 0);

    return {
      totalBoutiques: allBoutiques.length,
      activeBoutiques: activeBoutiques.length,
      totalTryOns: allTryOns.length,
      totalCreditsUsed,
      totalRevenue,
      thisMonthTryOns,
      thisMonthRevenue,
      averageRevenuePerBoutique:
        activeBoutiques.length > 0 ? (totalRevenue / activeBoutiques.length).toFixed(2) : 0,
    };
  }),

  /**
   * Get recent transactions
   */
  getRecentTransactions: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view transactions",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      return await db
        .select()
        .from(boutiqueTransactions)
        .orderBy(desc(boutiqueTransactions.createdAt))
        .limit(input.limit);
    }),

  /**
   * Get top performing boutiques
   */
  getTopBoutiques: protectedProcedure
    .input(
      z.object({
        metric: z.enum(["revenue", "usage", "tryons"]).optional().default("revenue"),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view top boutiques",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const allBoutiques = await getAllBoutiques();

      // Calculate metrics for each boutique
      const boutiquesWithMetrics = await Promise.all(
        allBoutiques.map(async b => {
          const revenue = await getTotalSpending(b.id);
          const used = await getTotalCreditsUsed(b.id);
          const tryOns = await db
            .select()
            .from(tryOnResults)
            .where(eq(tryOnResults.boutiqueId, b.id));

          return {
            id: b.id,
            name: b.name,
            revenue,
            creditsUsed: used,
            tryOns: tryOns.length,
          };
        })
      );

      // Sort by metric
      let sorted = boutiquesWithMetrics;
      if (input.metric === "revenue") {
        sorted = boutiquesWithMetrics.sort((a, b) => b.revenue - a.revenue);
      } else if (input.metric === "usage") {
        sorted = boutiquesWithMetrics.sort((a, b) => b.creditsUsed - a.creditsUsed);
      } else if (input.metric === "tryons") {
        sorted = boutiquesWithMetrics.sort((a, b) => b.tryOns - a.tryOns);
      }

      return sorted.slice(0, input.limit);
    }),

  /**
   * Export boutique data (CSV)
   */
  exportBoutiqueData: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can export data",
        });
      }

      const boutique = await getBoutiqueById(input.boutiqueId);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      const transactions = await getBillingHistory(input.boutiqueId);
      const tryOns = await getBoutiqueTryOnResults(input.boutiqueId, 1000);

      // Format as CSV
      const headers = ["Date", "Type", "Amount", "Price", "Description", "Status"];
      const rows = transactions.map(t => [
        new Date(t.createdAt).toISOString(),
        t.type,
        t.amount,
        t.price,
        t.description,
        t.status,
      ]);

      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");

      return {
        filename: `${boutique.slug}-data-${new Date().toISOString().split("T")[0]}.csv`,
        data: csv,
        transactionCount: transactions.length,
        tryOnCount: tryOns.length,
      };
    }),
});
