import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { appRegistrations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const developerDashboardRouter = router({
  /**
   * Get app details by API key
   */
  getAppByKey: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const result = await db
          .select()
          .from(appRegistrations)
          .where(eq(appRegistrations.apiKey, input.apiKey))
          .limit(1);

        if (!result.length) {
          return {
            success: false,
            error: "App not found",
          };
        }

        const app = result[0];
        return {
          success: true,
          app: {
            id: app.id,
            appName: app.appName,
            companyName: app.companyName,
            email: app.email,
            website: app.website,
            platformType: app.platformType,
            status: app.status,
            requestsCount: app.requestsCount,
            lastRequestAt: app.lastRequestAt,
            createdAt: app.createdAt,
            isLiveMode: app.isLiveMode,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get app usage statistics
   */
  getUsageStats: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const result = await db
          .select()
          .from(appRegistrations)
          .where(eq(appRegistrations.apiKey, input.apiKey))
          .limit(1);

        if (!result.length) {
          return {
            success: false,
            error: "App not found",
          };
        }

        const app = result[0];

        // Calculate usage metrics
        const requestsCount = app.requestsCount || 0;
        const registrationDate = new Date(app.createdAt);
        const daysSinceRegistration = Math.floor(
          (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const avgRequestsPerDay = daysSinceRegistration > 0 ? requestsCount / daysSinceRegistration : 0;

        return {
          success: true,
          stats: {
            totalRequests: requestsCount,
            daysSinceRegistration,
            avgRequestsPerDay: Math.round(avgRequestsPerDay * 100) / 100,
            lastRequestAt: app.lastRequestAt,
            status: app.status,
            isLiveMode: app.isLiveMode,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Regenerate API secret
   */
  regenerateApiSecret: publicProcedure
    .input(z.object({ apiKey: z.string(), currentSecret: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Verify the app exists and secret matches
        const result = await db
          .select()
          .from(appRegistrations)
          .where(eq(appRegistrations.apiKey, input.apiKey))
          .limit(1);

        if (!result.length) {
          return {
            success: false,
            error: "App not found",
          };
        }

        const app = result[0];
        if (app.apiSecret !== input.currentSecret) {
          return {
            success: false,
            error: "Invalid API secret",
          };
        }

        // Generate new secret
        const newSecret = crypto.randomBytes(32).toString("hex");

        // Update in database
        await db
          .update(appRegistrations)
          .set({ apiSecret: newSecret })
          .where(eq(appRegistrations.apiKey, input.apiKey));

        return {
          success: true,
          message: "API secret regenerated successfully",
          newSecret,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Toggle live mode
   */
  toggleLiveMode: publicProcedure
    .input(z.object({ apiKey: z.string(), enable: z.boolean() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Verify the app exists
        const result = await db
          .select()
          .from(appRegistrations)
          .where(eq(appRegistrations.apiKey, input.apiKey))
          .limit(1);

        if (!result.length) {
          return {
            success: false,
            error: "App not found",
          };
        }

        // Update live mode
        await db
          .update(appRegistrations)
          .set({ isLiveMode: input.enable })
          .where(eq(appRegistrations.apiKey, input.apiKey));

        return {
          success: true,
          message: `Live mode ${input.enable ? "enabled" : "disabled"}`,
          isLiveMode: input.enable,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get webhook configuration
   */
  getWebhookConfig: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const result = await db
          .select()
          .from(appRegistrations)
          .where(eq(appRegistrations.apiKey, input.apiKey))
          .limit(1);

        if (!result.length) {
          return {
            success: false,
            error: "App not found",
          };
        }

        // Return webhook configuration template
        return {
          success: true,
          webhookConfig: {
            events: [
              {
                name: "app.registered",
                description: "Triggered when the app is registered",
              },
              {
                name: "tryon.completed",
                description: "Triggered when a try-on is completed",
              },
              {
                name: "tryon.failed",
                description: "Triggered when a try-on fails",
              },
              {
                name: "credits.updated",
                description: "Triggered when credits are updated",
              },
            ],
            retryPolicy: {
              maxRetries: 5,
              retryDelay: 60, // seconds
            },
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),

  /**
   * Get API rate limits
   */
  getRateLimits: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const result = await db
          .select()
          .from(appRegistrations)
          .where(eq(appRegistrations.apiKey, input.apiKey))
          .limit(1);

        if (!result.length) {
          return {
            success: false,
            error: "App not found",
          };
        }

        const app = result[0];

        // Return rate limits based on status
        const rateLimits = {
          active: {
            requestsPerMinute: 60,
            requestsPerHour: 3000,
            requestsPerDay: 50000,
          },
          suspended: {
            requestsPerMinute: 0,
            requestsPerHour: 0,
            requestsPerDay: 0,
          },
          revoked: {
            requestsPerMinute: 0,
            requestsPerHour: 0,
            requestsPerDay: 0,
          },
        };

        const limits = rateLimits[app.status as keyof typeof rateLimits] || rateLimits.active;

        return {
          success: true,
          rateLimits: limits,
          status: app.status,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMessage,
        };
      }
    }),
});
