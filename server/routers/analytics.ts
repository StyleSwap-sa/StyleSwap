import { protectedProcedure, adminProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tryOnAnalytics, analyticsSnapshots, tryOnResults } from "../../drizzle/schema";
import { sql, eq, and, gte, lte, desc } from "drizzle-orm";

export const analyticsRouter = {
  // Get success rate metrics for a date range
  getSuccessRateMetrics: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        imageOptimizationVersion: z.string().optional(),
        flowType: z.enum(["b2c", "b2b"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate, imageOptimizationVersion, flowType } = input;

      let query = db.select({
        version: tryOnAnalytics.imageOptimizationVersion,
        flow: tryOnAnalytics.flowType,
        totalAttempts: sql<number>`COUNT(*)`,
        successfulAttempts: sql<number>`SUM(CASE WHEN ${tryOnAnalytics.success} = 1 THEN 1 ELSE 0 END)`,
        failedAttempts: sql<number>`SUM(CASE WHEN ${tryOnAnalytics.success} = 0 THEN 1 ELSE 0 END)`,
        successRate: sql<number>`ROUND(SUM(CASE WHEN ${tryOnAnalytics.success} = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2)`,
      }).from(tryOnAnalytics);

      const conditions: any[] = [];

      if (startDate) {
        conditions.push(gte(tryOnAnalytics.createdAt, startDate));
      }
      if (endDate) {
        conditions.push(lte(tryOnAnalytics.createdAt, endDate));
      }
      if (imageOptimizationVersion) {
        conditions.push(eq(tryOnAnalytics.imageOptimizationVersion, imageOptimizationVersion));
      }
      if (flowType) {
        conditions.push(eq(tryOnAnalytics.flowType, flowType));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.groupBy(
        tryOnAnalytics.imageOptimizationVersion,
        tryOnAnalytics.flowType
      );

      return result;
    }),

  // Get processing time statistics
  getProcessingTimeStats: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        imageOptimizationVersion: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate, imageOptimizationVersion } = input;

      let query = db
        .select({
          version: tryOnAnalytics.imageOptimizationVersion,
          avgProcessingTime: sql<number>`AVG(${tryOnAnalytics.processingTimeMs})`,
          minProcessingTime: sql<number>`MIN(${tryOnAnalytics.processingTimeMs})`,
          maxProcessingTime: sql<number>`MAX(${tryOnAnalytics.processingTimeMs})`,
          avgUploadTime: sql<number>`AVG(${tryOnAnalytics.uploadTimeMs})`,
          avgFitRoomResponseTime: sql<number>`AVG(${tryOnAnalytics.fitRoomResponseTime})`,
          sampleCount: sql<number>`COUNT(*)`,
        })
        .from(tryOnAnalytics)
        .where(eq(tryOnAnalytics.success, 1));

      const conditions: any[] = [];

      if (startDate) {
        conditions.push(gte(tryOnAnalytics.createdAt, startDate));
      }
      if (endDate) {
        conditions.push(lte(tryOnAnalytics.createdAt, endDate));
      }
      if (imageOptimizationVersion) {
        conditions.push(eq(tryOnAnalytics.imageOptimizationVersion, imageOptimizationVersion));
      }

      if (conditions.length > 0) {
        query = query.where(and(eq(tryOnAnalytics.success, 1), and(...conditions)));
      }

      const result = await query.groupBy(tryOnAnalytics.imageOptimizationVersion);

      return result;
    }),

  // Get error rate breakdown by error type
  getErrorRateByType: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate, limit } = input;

      let query = db
        .select({
          errorType: tryOnAnalytics.errorType,
          count: sql<number>`COUNT(*)`,
          latestError: sql<string>`MAX(${tryOnAnalytics.errorMessage})`,
        })
        .from(tryOnAnalytics)
        .where(eq(tryOnAnalytics.success, 0));

      const conditions: any[] = [];

      if (startDate) {
        conditions.push(gte(tryOnAnalytics.createdAt, startDate));
      }
      if (endDate) {
        conditions.push(lte(tryOnAnalytics.createdAt, endDate));
      }

      if (conditions.length > 0) {
        query = query.where(and(eq(tryOnAnalytics.success, 0), and(...conditions)));
      }

      const result = await query
        .groupBy(tryOnAnalytics.errorType)
        .orderBy(desc(sql<number>`COUNT(*)`))
        .limit(limit);

      return result;
    }),

  // Get image optimization impact metrics
  getImageOptimizationImpact: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate } = input;

      let query = db
        .select({
          version: tryOnAnalytics.imageOptimizationVersion,
          avgOriginalModelSize: sql<number>`AVG(${tryOnAnalytics.originalModelImageSize})`,
          avgOptimizedModelSize: sql<number>`AVG(${tryOnAnalytics.optimizedModelImageSize})`,
          avgOriginalClothSize: sql<number>`AVG(${tryOnAnalytics.originalClothImageSize})`,
          avgOptimizedClothSize: sql<number>`AVG(${tryOnAnalytics.optimizedClothImageSize})`,
          totalBandwidthSaved: sql<number>`ROUND(SUM(${tryOnAnalytics.originalModelImageSize} + ${tryOnAnalytics.originalClothImageSize}) - SUM(${tryOnAnalytics.optimizedModelImageSize} + ${tryOnAnalytics.optimizedClothImageSize}), 0)`,
        })
        .from(tryOnAnalytics);

      const conditions: any[] = [];

      if (startDate) {
        conditions.push(gte(tryOnAnalytics.createdAt, startDate));
      }
      if (endDate) {
        conditions.push(lte(tryOnAnalytics.createdAt, endDate));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.groupBy(tryOnAnalytics.imageOptimizationVersion);

      return result;
    }),

  // Get user funnel (uploads → success → completion)
  getConversionFunnel: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        flowType: z.enum(["b2c", "b2b"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate, flowType } = input;

      let conditions: any[] = [];

      if (startDate) {
        conditions.push(gte(tryOnAnalytics.createdAt, startDate));
      }
      if (endDate) {
        conditions.push(lte(tryOnAnalytics.createdAt, endDate));
      }
      if (flowType) {
        conditions.push(eq(tryOnAnalytics.flowType, flowType));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get unique users who uploaded
      const totalUploads = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${tryOnAnalytics.userId})`,
        })
        .from(tryOnAnalytics)
        .where(whereClause);

      // Get unique users with successful try-ons
      const successfulUsers = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${tryOnAnalytics.userId})`,
        })
        .from(tryOnAnalytics)
        .where(whereClause ? and(whereClause, eq(tryOnAnalytics.success, 1)) : eq(tryOnAnalytics.success, 1));

      // Get unique users with shared results
      const sharedResults = await db
        .select({
          count: sql<number>`COUNT(DISTINCT ${tryOnAnalytics.userId})`,
        })
        .from(tryOnAnalytics)
        .innerJoin(tryOnResults, eq(tryOnAnalytics.tryOnResultId, tryOnResults.id))
        .where(whereClause ? and(whereClause, eq(tryOnResults.isPublic, 1)) : eq(tryOnResults.isPublic, 1));

      const totalCount = totalUploads[0]?.count || 0;
      const successCount = successfulUsers[0]?.count || 0;
      const sharedCount = sharedResults[0]?.count || 0;

      return {
        totalUploads: totalCount,
        successfulTryOns: successCount,
        sharedResults: sharedCount,
        successRate: totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(2) : "0",
        sharingRate: successCount > 0 ? ((sharedCount / successCount) * 100).toFixed(2) : "0",
      };
    }),

  // Get daily analytics snapshot
  getDailySnapshot: adminProcedure
    .input(
      z.object({
        date: z.string(),
        imageOptimizationVersion: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { date, imageOptimizationVersion } = input;

      let query = db.select().from(analyticsSnapshots).where(eq(analyticsSnapshots.snapshotDate, date));

      if (imageOptimizationVersion) {
        query = query.where(eq(analyticsSnapshots.imageOptimizationVersion, imageOptimizationVersion));
      }

      const result = await query;

      return result;
    }),

  // Get analytics trend over time
  getAnalyticsTrend: adminProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        imageOptimizationVersion: z.string().optional(),
        groupBy: z.enum(["day", "week", "month"]).default("day"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate, imageOptimizationVersion, groupBy } = input;

      let dateFormat = "%Y-%m-%d"; // day
      if (groupBy === "week") {
        dateFormat = "%Y-W%u";
      } else if (groupBy === "month") {
        dateFormat = "%Y-%m";
      }

      let query = db
        .select({
          period: sql<string>`DATE_FORMAT(${tryOnAnalytics.createdAt}, '${sql.raw(dateFormat)}')`,
          totalAttempts: sql<number>`COUNT(*)`,
          successfulAttempts: sql<number>`SUM(CASE WHEN ${tryOnAnalytics.success} = 1 THEN 1 ELSE 0 END)`,
          successRate: sql<number>`ROUND(SUM(CASE WHEN ${tryOnAnalytics.success} = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2)`,
          avgProcessingTime: sql<number>`AVG(${tryOnAnalytics.processingTimeMs})`,
        })
        .from(tryOnAnalytics)
        .where(
          and(
            gte(tryOnAnalytics.createdAt, startDate),
            lte(tryOnAnalytics.createdAt, endDate),
            imageOptimizationVersion ? eq(tryOnAnalytics.imageOptimizationVersion, imageOptimizationVersion) : undefined
          )
        );

      const result = await query
        .groupBy(sql<string>`DATE_FORMAT(${tryOnAnalytics.createdAt}, '${sql.raw(dateFormat)}')`)
        .orderBy(sql<string>`DATE_FORMAT(${tryOnAnalytics.createdAt}, '${sql.raw(dateFormat)}')`);

      return result;
    }),
};


/**
 * API Key Usage Analytics Procedures
 * 
 * Provides analytics for API key usage, rate limiting, and request history
 */

// Add getApiKeyStats procedure
export const getApiKeyStats = protectedProcedure
  .input(
    z.object({
      apiKeyId: z.number(),
      timeRange: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
    })
  )
  .query(async ({ ctx, input }) => {
    // Mock implementation - returns sample data
    // In production, this would query the apiKeyLogs table
    return {
      totalRequests: 1250,
      errorCount: 15,
      avgResponseTime: 245,
      maxResponseTime: 1200,
      minResponseTime: 50,
      successRate: 98,
      timeRange: input.timeRange,
    };
  });

// Add getRequestHistory procedure
export const getRequestHistory = protectedProcedure
  .input(
    z.object({
      apiKeyId: z.number(),
      page: z.number().default(1),
      limit: z.number().default(20),
      status: z.enum(["all", "success", "error"]).default("all"),
    })
  )
  .query(async ({ ctx, input }) => {
    // Mock implementation - returns sample data
    return {
      requests: [
        {
          id: 1,
          endpoint: "/api/try-on",
          method: "POST",
          statusCode: 200,
          responseTimeMs: 234,
          error: null,
          createdAt: new Date(),
        },
      ],
      pagination: {
        page: input.page,
        limit: input.limit,
        total: 1250,
        pages: 63,
      },
    };
  });

// Add getUsageTrends procedure
export const getUsageTrends = protectedProcedure
  .input(
    z.object({
      apiKeyId: z.number(),
      timeRange: z.enum(["24h", "7d", "30d"]).default("24h"),
      interval: z.enum(["hourly", "daily"]).default("hourly"),
    })
  )
  .query(async ({ ctx, input }) => {
    // Mock implementation - returns sample trend data
    return {
      trends: [
        {
          timestamp: new Date().toISOString(),
          requests: 85,
          errors: 2,
          successRate: 97,
        },
      ],
      timeRange: input.timeRange,
      interval: input.interval,
    };
  });

// Add getRateLimitStatus procedure
export const getRateLimitStatus = protectedProcedure
  .input(z.object({ apiKeyId: z.number() }))
  .query(async ({ ctx, input }) => {
    // Mock implementation
    return {
      currentRequests: 45,
      rateLimit: 100,
      remaining: 55,
      resetTime: new Date(Date.now() + 60 * 1000),
      isLimited: false,
      percentageUsed: 45,
    };
  });

// Add getErrorBreakdown procedure
export const getErrorBreakdown = protectedProcedure
  .input(
    z.object({
      apiKeyId: z.number(),
      timeRange: z.enum(["24h", "7d", "30d"]).default("24h"),
    })
  )
  .query(async ({ ctx, input }) => {
    // Mock implementation
    return {
      errors: [
        {
          type: "Timeout",
          count: 8,
          percentage: 53,
        },
        {
          type: "Invalid Request",
          count: 5,
          percentage: 33,
        },
        {
          type: "Server Error",
          count: 2,
          percentage: 13,
        },
      ],
      timeRange: input.timeRange,
    };
  });
