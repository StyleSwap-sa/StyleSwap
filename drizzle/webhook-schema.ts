import { mysqlTable, text, timestamp, int, varchar, json, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Webhooks table - stores webhook endpoint configurations
 */
export const webhooks = mysqlTable("webhooks", {
  id: int("id").primaryKey().autoincrement(),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  url: text("url").notNull(), // Webhook endpoint URL
  events: json("events").$type<string[]>().notNull(), // Array of event types to subscribe to
  isActive: boolean("is_active").default(true),
  secret: varchar("secret", { length: 255 }).notNull(), // For HMAC signature verification
  retryPolicy: json("retry_policy").$type<{
    maxRetries: number;
    retryDelay: number; // in seconds
    backoffMultiplier: number;
  }>().notNull().default({
    maxRetries: 5,
    retryDelay: 60,
    backoffMultiplier: 2,
  }),
  headers: json("headers").$type<Record<string, string>>().default({}), // Custom headers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

/**
 * Webhook events table - stores event delivery history
 */
export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").primaryKey().autoincrement(),
  webhookId: int("webhook_id").notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(), // e.g., "tryon.completed"
  eventData: json("event_data").notNull(), // Full event payload
  deliveryStatus: varchar("delivery_status", { length: 50 }).default("pending"), // pending, success, failed, retrying
  statusCode: int("status_code"), // HTTP response code
  responseBody: text("response_body"), // Response from webhook endpoint
  retryCount: int("retry_count").default(0),
  maxRetries: int("max_retries").default(5),
  lastRetryAt: timestamp("last_retry_at"),
  nextRetryAt: timestamp("next_retry_at"),
  error: text("error"), // Error message if failed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

/**
 * Webhook delivery logs table - detailed logs for debugging
 */
export const webhookLogs = mysqlTable("webhook_logs", {
  id: int("id").primaryKey().autoincrement(),
  webhookId: int("webhook_id").notNull(),
  eventId: int("event_id"),
  action: varchar("action", { length: 100 }).notNull(), // "sent", "retry", "success", "failed"
  requestBody: text("request_body"),
  responseStatus: int("response_status"),
  responseBody: text("response_body"),
  error: text("error"),
  duration: int("duration"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Relations
 */
export const webhooksRelations = relations(webhooks, ({ many }) => ({
  events: many(webhookEvents),
  logs: many(webhookLogs),
}));

export const webhookEventsRelations = relations(webhookEvents, ({ one, many }) => ({
  webhook: one(webhooks, {
    fields: [webhookEvents.webhookId],
    references: [webhooks.id],
  }),
  logs: many(webhookLogs),
}));

export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookLogs.webhookId],
    references: [webhooks.id],
  }),
  event: one(webhookEvents, {
    fields: [webhookLogs.eventId],
    references: [webhookEvents.id],
  }),
}));
