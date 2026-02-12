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
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "../_core/cookies";
import { adminPayoutsRouter } from "./admin-payouts";

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

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        const boutique = await getBoutiqueById(input.boutiqueId);
        if (!boutique) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Boutique not found",
          });
        }

        const [billingHistory, usageStats, tryOnResults] = await Promise.all([
          getBillingHistory(input.boutiqueId),
          getBoutiqueUsageStats(input.boutiqueId),
          getBoutiqueTryOnResults(input.boutiqueId),
        ]);

        return {
          ...boutique,
          billingHistory,
          usageStats,
          tryOnResults,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch boutique details",
        });
      }
    }),

  /**
   * Get platform metrics
   */
  getPlatformMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view platform metrics",
      });
    }

    try {
      return await getPlatformMetrics();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch platform metrics",
      });
    }
  }),

  /**
   * Get monthly credits usage
   */
  getMonthlyCreditsUsage: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can view credits usage",
      });
    }

    try {
      return await getMonthlyCreditsUsage();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch credits usage",
      });
    }
  }),

  /**
   * Get top boutiques by usage
   */
  getTopBoutiques: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view top boutiques",
        });
      }

      try {
        return await getTopBoutiques(input.limit);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch top boutiques",
        });
      }
    }),

  /**
   * Update boutique status
   */
  updateBoutiqueStatus: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        status: z.enum(["active", "suspended", "inactive"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update boutique status",
        });
      }

      try {
        const updated = await updateBoutique(input.boutiqueId, {
          status: input.status,
        });

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Boutique not found",
          });
        }

        return updated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update boutique status",
        });
      }
    }),

  /**
   * Get AR mode analytics
   */
  getARModeAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view AR analytics",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const results = await db
          .select()
          .from(tryOnResults)
          .where(gte(tryOnResults.createdAt, startDate));

        const totalTryOns = results.length;
        const arTryOns = results.filter((r) => r.arMode === true).length;
        const uploadTryOns = totalTryOns - arTryOns;

        // Calculate conversion rates
        const completedAR = results.filter((r) => r.arMode === true && r.status === "completed").length;
        const completedUpload = results.filter((r) => r.arMode === false && r.status === "completed").length;

        const conversionRateAR = arTryOns > 0 ? (completedAR / arTryOns) * 100 : 0;
        const conversionRateUpload = uploadTryOns > 0 ? (completedUpload / uploadTryOns) * 100 : 0;

        // Group by date for trends
        const trendData: Record<
          string,
          { ar: number; upload: number; date: string }
        > = {};
        results.forEach((result) => {
          const date = result.createdAt.toISOString().split("T")[0];
          if (!trendData[date]) {
            trendData[date] = { ar: 0, upload: 0, date };
          }
          if (result.arMode) {
            trendData[date].ar++;
          } else {
            trendData[date].upload++;
          }
        });

        const trends = Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date));

        // Estimate percentages
        const estimatedARCount = arTryOns;
        const estimatedUploadCount = uploadTryOns;

        return {
          totalARTryOns: estimatedARCount,
          totalUploadTryOns: estimatedUploadCount,
          arPercentage: estimatedARCount > 0 ? (estimatedARCount / totalTryOns) * 100 : 0,
          uploadPercentage: estimatedUploadCount > 0 ? (estimatedUploadCount / totalTryOns) * 100 : 0,
          conversionRateAR,
          conversionRateUpload,
          trendData: trends,
        };
      } catch (error) {
        console.error("[Admin] Failed to get AR mode analytics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch AR mode analytics",
        });
      }
    }),

  /**
   * Get paginated boutiques list with credits info
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

      try {
        const db = getDb();
        const boutiquesData = await db
          .select({
            id: boutiques.id,
            name: boutiques.name,
            status: boutiques.status,
            createdAt: boutiques.createdAt,
            totalCredits: sql`COALESCE(SUM(${boutiqueCredits.totalCredits}), 0)`,
            usedCredits: sql`COALESCE(SUM(${boutiqueCredits.usedCredits}), 0)`,
            remainingCredits: sql`COALESCE(SUM(${boutiqueCredits.remainingCredits}), 0)`,
          })
          .from(boutiques)
          .leftJoin(boutiqueCredits, eq(boutiques.id, boutiqueCredits.boutiqueId))
          .groupBy(boutiques.id)
          .limit(input.limit)
          .offset(input.offset);

        return boutiquesData.map((b) => ({
          id: b.id,
          name: b.name,
          status: b.status,
          createdAt: b.createdAt,
          totalCredits: Number(b.totalCredits) || 0,
          usedCredits: Number(b.usedCredits) || 0,
          remainingCredits: Number(b.remainingCredits) || 0,
        }));
      } catch (error) {
        console.error("[Admin] Failed to get boutiques list:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch boutiques list",
        });
      }
    }),

  /**
   * Payout management sub-router
   */
  payouts: adminPayoutsRouter,
});
