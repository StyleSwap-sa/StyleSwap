import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { apiKeyLogs } from "../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

/**
 * Webhook Events Router
 * Handles logging, retrieval, and analysis of API webhook events
 */
export const webhookEventsRouter = router({
  /**
   * Get webhook events for the current boutique with filtering
   */
  getEvents: protectedProcedure
    .input(
      z.object({
        eventType: z.enum(["all", "try-on", "error", "rate-limit"]).optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            events: [],
            total: 0,
            hasMore: false,
          };
        }

        // Build query conditions
        const conditions = [];

        if (input.eventType && input.eventType !== "all") {
          // Map event types to status codes
          const statusMap: Record<string, number> = {
            "try-on": 200,
            error: 500,
            "rate-limit": 429,
          };
          conditions.push(eq(apiKeyLogs.statusCode, statusMap[input.eventType]));
        }

        if (input.startTime) {
          conditions.push(gte(apiKeyLogs.createdAt, new Date(input.startTime)));
        }

        if (input.endTime) {
          conditions.push(lte(apiKeyLogs.createdAt, new Date(input.endTime)));
        }

        // Query events
        const events = await db
          .select()
          .from(apiKeyLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(apiKeyLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        // Get total count
        const countResult = await db
          .select({ count: db.sql`COUNT(*)` })
          .from(apiKeyLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        const total = Number(countResult[0]?.count || 0);

        return {
          events: events.map((event) => ({
            id: event.id,
            type:
              event.statusCode === 200
                ? "try-on"
                : event.statusCode === 429
                  ? "rate-limit"
                  : "error",
            endpoint: event.endpoint,
            method: event.method,
            status:
              event.statusCode === 200
                ? "success"
                : event.statusCode === 429
                  ? "rate-limited"
                  : "error",
            statusCode: event.statusCode,
            timestamp: event.createdAt.toISOString(),
            responseTime: event.responseTime || "0ms",
            ipAddress: event.ipAddress || "unknown",
            userAgent: event.userAgent || "unknown",
          })),
          total,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        console.error("[webhookEventsRouter] Error fetching events:", error);
        return {
          events: [],
          total: 0,
          hasMore: false,
        };
      }
    }),

  /**
   * Get event statistics summary
   */
  getEventStats: protectedProcedure
    .input(
      z.object({
        startTime: z.number().optional(),
        endTime: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            totalEvents: 0,
            successRate: 0,
            errorCount: 0,
            rateLimitCount: 0,
            averageResponseTime: "0ms",
            successfulRequests: 0,
          };
        }

        const conditions = [];

        if (input.startTime) {
          conditions.push(gte(apiKeyLogs.createdAt, new Date(input.startTime)));
        }

        if (input.endTime) {
          conditions.push(lte(apiKeyLogs.createdAt, new Date(input.endTime)));
        }

        // Get all events in time range
        const events = await db
          .select()
          .from(apiKeyLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        const total = events.length;
        const successful = events.filter((e) => e.statusCode === 200).length;
        const errors = events.filter((e) => e.statusCode >= 500).length;
        const rateLimited = events.filter((e) => e.statusCode === 429).length;

        const avgResponseTime =
          events.length > 0
            ? Math.round(
                events.reduce((sum, e) => {
                  const ms = parseInt(e.responseTime || "0");
                  return sum + ms;
                }, 0) / events.length
              )
            : 0;

        return {
          totalEvents: total,
          successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
          errorCount: errors,
          rateLimitCount: rateLimited,
          averageResponseTime: `${avgResponseTime}ms`,
          successfulRequests: successful,
        };
      } catch (error) {
        console.error("[webhookEventsRouter] Error getting stats:", error);
        return {
          totalEvents: 0,
          successRate: 0,
          errorCount: 0,
          rateLimitCount: 0,
          averageResponseTime: "0ms",
          successfulRequests: 0,
        };
      }
    }),

  /**
   * Get error breakdown for pie chart
   */
  getErrorBreakdown: protectedProcedure
    .input(
      z.object({
        startTime: z.number().optional(),
        endTime: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return [];
        }

        const conditions: any[] = [];
        conditions.push(gte(apiKeyLogs.statusCode, 400));

        if (input.startTime) {
          conditions.push(gte(apiKeyLogs.createdAt, new Date(input.startTime)));
        }

        if (input.endTime) {
          conditions.push(lte(apiKeyLogs.createdAt, new Date(input.endTime)));
        }

        const errors = await db
          .select()
          .from(apiKeyLogs)
          .where(and(...conditions));

        // Group errors by status code
        const errorMap: Record<string, number> = {};
        errors.forEach((error) => {
          const message =
            error.statusCode === 429
              ? "Rate Limited (429)"
              : `Server Error (${error.statusCode})`;
          errorMap[message] = (errorMap[message] || 0) + 1;
        });

        return Object.entries(errorMap).map(([name, value]) => ({
          name,
          value,
        }));
      } catch (error) {
        console.error("[webhookEventsRouter] Error getting breakdown:", error);
        return [];
      }
    }),

  /**
   * Get usage trends over time
   */
  getUsageTrends: protectedProcedure
    .input(
      z.object({
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        interval: z.enum(["hour", "day"]).default("hour"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return [];
        }

        const conditions = [];

        if (input.startTime) {
          conditions.push(gte(apiKeyLogs.createdAt, new Date(input.startTime)));
        }

        if (input.endTime) {
          conditions.push(lte(apiKeyLogs.createdAt, new Date(input.endTime)));
        }

        const events = await db
          .select()
          .from(apiKeyLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(apiKeyLogs.createdAt);

        // Group by time interval
        const trendMap: Record<string, number> = {};

        events.forEach((event) => {
          let key: string;
          const date = new Date(event.createdAt);

          if (input.interval === "hour") {
            key = date.toISOString().slice(0, 13) + ":00";
          } else {
            key = date.toISOString().slice(0, 10);
          }

          trendMap[key] = (trendMap[key] || 0) + 1;
        });

        return Object.entries(trendMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, requests]) => ({
            time,
            requests,
          }));
      } catch (error) {
        console.error("[webhookEventsRouter] Error getting trends:", error);
        return [];
      }
    }),

  /**
   * Export events as CSV
   */
  exportEventsCSV: protectedProcedure
    .input(
      z.object({
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        eventType: z.enum(["all", "try-on", "error", "rate-limit"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return { csv: "", filename: "events.csv" };
        }

        const conditions = [];

        if (input.eventType && input.eventType !== "all") {
          const statusMap: Record<string, number> = {
            "try-on": 200,
            error: 500,
            "rate-limit": 429,
          };
          conditions.push(eq(apiKeyLogs.statusCode, statusMap[input.eventType]));
        }

        if (input.startTime) {
          conditions.push(gte(apiKeyLogs.createdAt, new Date(input.startTime)));
        }

        if (input.endTime) {
          conditions.push(lte(apiKeyLogs.createdAt, new Date(input.endTime)));
        }

        const events = await db
          .select()
          .from(apiKeyLogs)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(apiKeyLogs.createdAt));

        // Build CSV
        const headers = [
          "Timestamp",
          "Method",
          "Endpoint",
          "Status Code",
          "Response Time",
          "IP Address",
        ];
        const rows = events.map((e) => [
          e.createdAt.toISOString(),
          e.method,
          e.endpoint,
          e.statusCode.toString(),
          e.responseTime || "0ms",
          e.ipAddress || "unknown",
        ]);

        const csv =
          [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n") +
          "\n";

        const filename = `api-events-${new Date().toISOString().slice(0, 10)}.csv`;

        return { csv, filename };
      } catch (error) {
        console.error("[webhookEventsRouter] Error exporting CSV:", error);
        return { csv: "", filename: "events.csv" };
      }
    }),
});
