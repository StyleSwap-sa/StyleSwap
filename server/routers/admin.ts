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
import { getDb, getPlatformMetrics, getBoutiquesList, getMonthlyCreditsUsage, getTopBoutiques } from "../db";
import { boutiqueTransactions, tryOnResults, boutiques, boutiqueCredits } from "../../drizzle/schema";
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

  /**
   * Get platform-wide metrics (admin dashboard)
   */
  getPlatformMetricsData: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view platform metrics",
      });
    }

    const metrics = await getPlatformMetrics();
    if (!metrics) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch platform metrics",
      });
    }

    return metrics;
  }),

  /**
   * Get boutiques list with pagination
   */
  getBoutiquesListPaginated: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view boutiques list",
        });
      }

      return await getBoutiquesList(input.limit, input.offset);
    }),

  /**
   * Get monthly credits usage analytics
   */
  getCreditsUsageAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view analytics",
      });
    }

    return await getMonthlyCreditsUsage();
  }),

  /**
   * Get top performing boutiques
   */
  getTopPerformingBoutiques: protectedProcedure
    .input(
      z.object({
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

      return await getTopBoutiques(input.limit);
    }),

  /**
   * Check boutiques that need credit alerts
   * Returns boutiques at 80%, 50%, 20%, and 10% credit usage thresholds
   */
  checkCreditAlerts: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can check credit alerts",
      });
    }

    const db = await getDb();
    if (!db) return { alerts80: [], alerts50: [], alerts20: [], alerts10: [] };

    try {
      
      
      // Get all boutiques with their credit status
      const boutiquesWithCredits = await db
        .select({
          id: boutiques.id,
          name: boutiques.name,
          slug: boutiques.slug,
          totalCredits: boutiqueCredits.totalCredits,
          usedCredits: boutiqueCredits.usedCredits,
          remainingCredits: boutiqueCredits.remainingCredits,
        })
        .from(boutiques)
        .leftJoin(boutiqueCredits, eq(boutiques.id, boutiqueCredits.boutiqueId))
        .where(eq(boutiques.status, "active"));

      // Categorize boutiques by alert threshold
      const alerts80: any[] = [];
      const alerts50: any[] = [];
      const alerts20: any[] = [];
      const alerts10: any[] = [];

      for (const boutique of boutiquesWithCredits) {
        if (!boutique.totalCredits || boutique.totalCredits === 0) continue;
        
        const usagePercentage = (boutique.usedCredits || 0) / boutique.totalCredits * 100;
        
        if (usagePercentage >= 80) alerts80.push(boutique);
        else if (usagePercentage >= 50) alerts50.push(boutique);
        else if (usagePercentage >= 20) alerts20.push(boutique);
        else if (usagePercentage >= 10) alerts10.push(boutique);
      }

      return { alerts80, alerts50, alerts20, alerts10 };
    } catch (error) {
      console.error('[Admin] Failed to check credit alerts:', error);
      return { alerts80: [], alerts50: [], alerts20: [], alerts10: [] };
    }
  }),

  /**
   * Get credit alert status for a specific boutique
   */
  getBoutiqueAlertStatus: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view boutique alert status",
        });
      }

      const db = await getDb();
      if (!db) return null;

      try {
        
        
        const result = await db
          .select({
            id: boutiques.id,
            name: boutiques.name,
            totalCredits: boutiqueCredits.totalCredits,
            usedCredits: boutiqueCredits.usedCredits,
            remainingCredits: boutiqueCredits.remainingCredits,
          })
          .from(boutiques)
          .leftJoin(boutiqueCredits, eq(boutiques.id, boutiqueCredits.boutiqueId))
          .where(eq(boutiques.id, input.boutiqueId))
          .limit(1);

        if (result.length === 0) return null;

        const boutique = result[0];
        const totalCredits = boutique.totalCredits || 0;
        const usedCredits = boutique.usedCredits || 0;
        const usagePercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;

        let alertLevel: "none" | "10" | "20" | "50" | "80" = "none";
        if (usagePercentage >= 80) alertLevel = "80";
        else if (usagePercentage >= 50) alertLevel = "50";
        else if (usagePercentage >= 20) alertLevel = "20";
        else if (usagePercentage >= 10) alertLevel = "10";

        return {
          ...boutique,
          usagePercentage: Math.round(usagePercentage),
          alertLevel,
          daysUntilEmpty: usedCredits > 0 ? Math.ceil(totalCredits / (usedCredits / 30)) : null,
        };
      } catch (error) {
        console.error('[Admin] Failed to get boutique alert status:', error);
        return null;
      }
    }),
});
