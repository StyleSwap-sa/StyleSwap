import crypto from "crypto";

/**
 * Webhook Service - Manages webhook operations
 */

interface WebhookConfig {
  id: number;
  apiKey: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  headers?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookEvent {
  id: number;
  webhookId: number;
  eventType: string;
  eventData: Record<string, any>;
  deliveryStatus: string;
  statusCode?: number;
  responseBody?: string;
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: Date;
  nextRetryAt?: Date;
  error?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate webhook secret for HMAC signature verification
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Build webhook payload with headers
 */
export function buildWebhookPayload(
  event: WebhookEvent,
  secret: string
): {
  body: string;
  headers: Record<string, string>;
} {
  const payload = JSON.stringify({
    id: event.id,
    type: event.eventType,
    data: event.eventData,
    timestamp: new Date().toISOString(),
  });

  const signature = generateWebhookSignature(payload, secret);

  return {
    body: payload,
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
      "X-Webhook-ID": event.id.toString(),
      "X-Webhook-Timestamp": new Date().toISOString(),
    },
  };
}

/**
 * Calculate next retry time with exponential backoff
 */
export function calculateNextRetryTime(
  retryCount: number,
  retryDelay: number,
  backoffMultiplier: number
): Date {
  const delayMs = retryDelay * Math.pow(backoffMultiplier, retryCount) * 1000;
  return new Date(Date.now() + delayMs);
}

/**
 * Format webhook for API response (hide sensitive data)
 */
export function formatWebhookForResponse(webhook: WebhookConfig): any {
  return {
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    isActive: webhook.isActive,
    retryPolicy: webhook.retryPolicy,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
    // Don't return secret
  };
}

/**
 * Validate webhook URL
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow https or http
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Validate webhook events
 */
export const VALID_WEBHOOK_EVENTS = [
  "app.registered",
  "tryon.completed",
  "tryon.failed",
  "credits.updated",
  "credits.low",
  "webhook.test",
];

export function isValidWebhookEvent(event: string): boolean {
  return VALID_WEBHOOK_EVENTS.includes(event);
}

/**
 * Test webhook by sending a test event
 */
export async function sendTestWebhook(
  webhook: WebhookConfig
): Promise<{
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
}> {
  const testEvent: WebhookEvent = {
    id: 0,
    webhookId: webhook.id,
    eventType: "webhook.test",
    eventData: {
      message: "This is a test webhook",
      timestamp: new Date().toISOString(),
    },
    deliveryStatus: "pending",
    retryCount: 0,
    maxRetries: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const { body, headers } = buildWebhookPayload(testEvent, webhook.secret);

  const startTime = Date.now();

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        ...headers,
        ...(webhook.headers || {}),
      },
      body,
      timeout: 10000, // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      responseTime,
      error: errorMessage,
    };
  }
}

/**
 * Format webhook event for logging
 */
export function formatWebhookEventForLog(event: WebhookEvent): any {
  return {
    id: event.id,
    webhookId: event.webhookId,
    eventType: event.eventType,
    status: event.deliveryStatus,
    retryCount: event.retryCount,
    statusCode: event.statusCode,
    error: event.error,
    createdAt: event.createdAt,
  };
}
