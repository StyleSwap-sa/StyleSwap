import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  generateWebhookSecret,
  isValidWebhookUrl,
  isValidWebhookEvent,
  VALID_WEBHOOK_EVENTS,
  sendTestWebhook,
  formatWebhookForResponse,
} from "../webhook-service";

/**
 * Mock webhook storage (in production, use database)
 */
const webhookStorage = new Map<string, any[]>();

export const webhooksRouter = router({
  /**
   * Create a new webhook
   */
  createWebhook: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        url: z.string().url(),
        events: z.array(z.string()),
        headers: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate URL
        if (!isValidWebhookUrl(input.url)) {
          return {
            success: false,
            error: "Invalid webhook URL. Must be HTTPS or HTTP.",
          };
        }

        // Validate events
        const invalidEvents = input.events.filter((e) => !isValidWebhookEvent(e));
        if (invalidEvents.length > 0) {
          return {
            success: false,
            error: `Invalid events: ${invalidEvents.join(", ")}. Valid events are: ${VALID_WEBHOOK_EVENTS.join(", ")}`,
          };
        }

        // Create webhook
        const webhook = {
          id: Math.random(),
          apiKey: input.apiKey,
          url: input.url,
          events: input.events,
          isActive: true,
          secret: generateWebhookSecret(),
          retryPolicy: {
            maxRetries: 5,
            retryDelay: 60,
            backoffMultiplier: 2,
          },
          headers: input.headers || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Store webhook
        const webhooks = webhookStorage.get(input.apiKey) || [];
        webhooks.push(webhook);
        webhookStorage.set(input.apiKey, webhooks);

        return {
          success: true,
          webhook: formatWebhookForResponse(webhook),
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
   * Get all webhooks for an API key
   */
  getWebhooks: publicProcedure
    .input(z.object({ apiKey: z.string() }))
    .query(({ input }) => {
      try {
        const webhooks = webhookStorage.get(input.apiKey) || [];
        return {
          success: true,
          webhooks: webhooks.map(formatWebhookForResponse),
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
   * Get a specific webhook
   */
  getWebhook: publicProcedure
    .input(z.object({ apiKey: z.string(), webhookId: z.number() }))
    .query(({ input }) => {
      try {
        const webhooks = webhookStorage.get(input.apiKey) || [];
        const webhook = webhooks.find((w) => w.id === input.webhookId);

        if (!webhook) {
          return {
            success: false,
            error: "Webhook not found",
          };
        }

        return {
          success: true,
          webhook: formatWebhookForResponse(webhook),
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
   * Update a webhook
   */
  updateWebhook: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        webhookId: z.number(),
        url: z.string().url().optional(),
        events: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        headers: z.record(z.string()).optional(),
      })
    )
    .mutation(({ input }) => {
      try {
        const webhooks = webhookStorage.get(input.apiKey) || [];
        const webhookIndex = webhooks.findIndex((w) => w.id === input.webhookId);

        if (webhookIndex === -1) {
          return {
            success: false,
            error: "Webhook not found",
          };
        }

        const webhook = webhooks[webhookIndex];

        // Validate URL if provided
        if (input.url && !isValidWebhookUrl(input.url)) {
          return {
            success: false,
            error: "Invalid webhook URL",
          };
        }

        // Validate events if provided
        if (input.events) {
          const invalidEvents = input.events.filter((e) => !isValidWebhookEvent(e));
          if (invalidEvents.length > 0) {
            return {
              success: false,
              error: `Invalid events: ${invalidEvents.join(", ")}`,
            };
          }
        }

        // Update webhook
        webhook.url = input.url || webhook.url;
        webhook.events = input.events || webhook.events;
        webhook.isActive = input.isActive !== undefined ? input.isActive : webhook.isActive;
        webhook.headers = input.headers || webhook.headers;
        webhook.updatedAt = new Date();

        webhooks[webhookIndex] = webhook;
        webhookStorage.set(input.apiKey, webhooks);

        return {
          success: true,
          webhook: formatWebhookForResponse(webhook),
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
   * Delete a webhook
   */
  deleteWebhook: publicProcedure
    .input(z.object({ apiKey: z.string(), webhookId: z.number() }))
    .mutation(({ input }) => {
      try {
        const webhooks = webhookStorage.get(input.apiKey) || [];
        const filteredWebhooks = webhooks.filter((w) => w.id !== input.webhookId);

        if (filteredWebhooks.length === webhooks.length) {
          return {
            success: false,
            error: "Webhook not found",
          };
        }

        webhookStorage.set(input.apiKey, filteredWebhooks);

        return {
          success: true,
          message: "Webhook deleted successfully",
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
   * Test a webhook
   */
  testWebhook: publicProcedure
    .input(z.object({ apiKey: z.string(), webhookId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const webhooks = webhookStorage.get(input.apiKey) || [];
        const webhook = webhooks.find((w) => w.id === input.webhookId);

        if (!webhook) {
          return {
            success: false,
            error: "Webhook not found",
          };
        }

        const result = await sendTestWebhook(webhook);

        return {
          success: result.success,
          statusCode: result.statusCode,
          responseTime: result.responseTime,
          error: result.error,
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
   * Get valid webhook events
   */
  getValidEvents: publicProcedure.query(() => {
    return {
      success: true,
      events: VALID_WEBHOOK_EVENTS.map((event) => ({
        name: event,
        description: getEventDescription(event),
      })),
    };
  }),

  /**
   * Get webhook delivery logs
   */
  getDeliveryLogs: publicProcedure
    .input(z.object({ apiKey: z.string(), webhookId: z.number(), limit: z.number().default(50) }))
    .query(({ input }) => {
      try {
        // Mock logs - in production, fetch from database
        const logs = [
          {
            id: 1,
            webhookId: input.webhookId,
            action: "sent",
            responseStatus: 200,
            duration: 245,
            createdAt: new Date(Date.now() - 5 * 60000),
          },
          {
            id: 2,
            webhookId: input.webhookId,
            action: "success",
            responseStatus: 200,
            duration: 198,
            createdAt: new Date(Date.now() - 10 * 60000),
          },
          {
            id: 3,
            webhookId: input.webhookId,
            action: "retry",
            responseStatus: 500,
            error: "Internal Server Error",
            duration: 1000,
            createdAt: new Date(Date.now() - 15 * 60000),
          },
        ];

        return {
          success: true,
          logs: logs.slice(0, input.limit),
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

/**
 * Helper function to get event description
 */
function getEventDescription(event: string): string {
  const descriptions: Record<string, string> = {
    "app.registered": "Triggered when your app is registered",
    "tryon.completed": "Triggered when a try-on is completed successfully",
    "tryon.failed": "Triggered when a try-on fails",
    "credits.updated": "Triggered when app credits are updated",
    "credits.low": "Triggered when app credits are running low",
    "webhook.test": "Test event for webhook verification",
  };
  return descriptions[event] || "Webhook event";
}
