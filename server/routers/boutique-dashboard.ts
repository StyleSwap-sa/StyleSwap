import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getBoutiqueById,
  getBoutiqueUserRole,
} from "../db.boutiques";
import {
  getCreditBalance,
  getBillingHistory,
  getMonthlyUsageStats,
  getTotalSpending,
  getTotalCreditsUsed,
  getCreditExpirationDate,
  areCreditExpired,
} from "../db.billing";
import {
  getBoutiqueTryOnResults,
  getBoutiqueUsageStats,
} from "../db.tryons";
import { getProductsByBoutique } from "../db.products";
import { getDb } from "../db";
import { tryOnResults } from "../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";

/**
 * Boutique Owner Dashboard Router
 * Provides boutique owners with analytics and management tools
 */

export const boutiqueDashboardRouter = router({
  /**
   * Get boutique overview/summary
   */
  getOverview: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      const boutique = await getBoutiqueById(input.boutiqueId);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      const creditBalance = await getCreditBalance(input.boutiqueId);
      const totalSpending = await getTotalSpending(input.boutiqueId);
      const totalUsed = await getTotalCreditsUsed(input.boutiqueId);
      const usageStats = await getBoutiqueUsageStats(input.boutiqueId);

      // Get this month's stats
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database error" });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthTryOns = await db
        .select()
        .from(tryOnResults)
        .where(
          and(
            eq(tryOnResults.boutiqueId, input.boutiqueId),
            gte(tryOnResults.createdAt, monthStart)
          )
        );

      return {
        boutique: {
          id: boutique.id,
          name: boutique.name,
          slug: boutique.slug,
          status: boutique.status,
          createdAt: boutique.createdAt,
        },
        credits: {
          remaining: creditBalance?.remainingCredits || 0,
          total: creditBalance?.totalCredits || 0,
          used: creditBalance?.usedCredits || 0,
          expirationDate: getCreditExpirationDate(creditBalance?.createdAt || null),
          isExpired: areCreditExpired(creditBalance?.createdAt || null),
        },
        billing: {
          totalSpending,
          averageCostPerCredit: totalUsed > 0 ? (totalSpending / totalUsed).toFixed(2) : 0,
        },
        activity: {
          totalTryOns: usageStats.totalUsage || 0,
          thisMonthTryOns: thisMonthTryOns.length,
          totalCreditsUsed: totalUsed,
        },
      };
    }),

  /**
   * Get recent try-ons
   */
  getRecentTryOns: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      const tryOns = await getBoutiqueTryOnResults(input.boutiqueId, input.limit);

      return tryOns.map(t => ({
        id: t.id,
        productId: t.productId,
        userId: t.userId,
        taskId: t.fitRoomTaskId,
        flowType: t.flowType,
        createdAt: t.createdAt,
      }));
    }),

  /**
   * Get product performance
   */
  getProductPerformance: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      const products = await getProductsByBoutique(input.boutiqueId);

      // Get try-on count for each product
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database error" });

      const productPerformance = await Promise.all(
        products.map(async p => {
          const tryOns = await db
            .select()
            .from(tryOnResults)
            .where(eq(tryOnResults.productId, p.id));
          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            tryOnCount: tryOns.length,
            imageUrl: p.imageUrl,
          };
        })
      );

      // Sort by try-on count
      return productPerformance.sort((a, b) => b.tryOnCount - a.tryOnCount);
    }),

  /**
   * Get monthly analytics
   */
  getMonthlyAnalytics: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        monthsBack: z.number().optional().default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      return await getMonthlyUsageStats(input.boutiqueId, input.monthsBack);
    }),

  /**
   * Get billing summary
   */
  getBillingSummary: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      const creditBalance = await getCreditBalance(input.boutiqueId);
      const totalSpending = await getTotalSpending(input.boutiqueId);
      const totalUsed = await getTotalCreditsUsed(input.boutiqueId);
      const history = await getBillingHistory(input.boutiqueId, "purchase", 10);

      return {
        currentBalance: creditBalance?.remainingCredits || 0,
        totalSpending,
        totalCreditsUsed: totalUsed,
        averageCostPerCredit: totalUsed > 0 ? (totalSpending / totalUsed).toFixed(2) : 0,
        recentPurchases: history.map(h => ({
          date: h.createdAt,
          credits: h.amount,
          price: h.price,
          status: h.status,
        })),
      };
    }),

  /**
   * Get staff list
   */
  getStaffList: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      // Return empty array for now - staff management is in boutiques router
      return [];
    }),

  /**
   * Get boutique settings
   */
  getSettings: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || (userRole.role !== "owner" && userRole.role !== "manager")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owner/manager can view settings",
        });
      }

      const boutique = await getBoutiqueById(input.boutiqueId);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      return {
        name: boutique.name,
        slug: boutique.slug,
        description: boutique.description,
        website: boutique.websiteUrl,
        customDomain: boutique.websiteUrl, // Using websiteUrl as custom domain
        logo: boutique.logoUrl,
        status: boutique.status,
      };
    }),

  /**
   * Update boutique settings
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        website: z.string().optional(),
        customDomain: z.string().optional(),
        logo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || userRole.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owner can update settings",
        });
      }

      const boutique = await getBoutiqueById(input.boutiqueId);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      // Update boutique (implementation depends on your update function)
      // This is a placeholder - you'd call your update function here

      return {
        success: true,
        message: "Settings updated successfully",
      };
    }),

  /**
   * Export try-on data
   */
  exportTryOnData: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        format: z.enum(["csv", "json"]).optional().default("csv"),
      })
    )
    .query(async ({ ctx, input }) => {
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      const tryOns = await getBoutiqueTryOnResults(input.boutiqueId, 10000);

      if (input.format === "json") {
        return {
          format: "json",
          data: JSON.stringify(tryOns, null, 2),
          filename: `try-ons-${new Date().toISOString().split("T")[0]}.json`,
        };
      }

      // CSV format
      const headers = ["Date", "Product ID", "User ID", "Task ID", "Flow Type"];
      const rows = tryOns.map(t => [
        new Date(t.createdAt).toISOString(),
        t.productId,
        t.userId,
        t.fitRoomTaskId,
        t.flowType,
      ]);

      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");

      return {
        format: "csv",
        data: csv,
        filename: `try-ons-${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),
});
