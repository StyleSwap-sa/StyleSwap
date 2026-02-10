import { getDb } from './db';
import { apiKeys, apiKeyLogs } from '../drizzle/schema';
import { eq, and, gte } from 'drizzle-orm';

/**
 * Rate Limiter Configuration
 * Implements a sliding window rate limiter for API keys
 */
export const RATE_LIMIT_CONFIG = {
  // 100 requests per minute per API key
  requestsPerMinute: 100,
  windowMs: 60 * 1000, // 1 minute in milliseconds
};

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds
}

/**
 * Check if an API key has exceeded rate limits
 * Uses sliding window algorithm with database storage
 */
export async function checkRateLimit(apiKeyId: number): Promise<RateLimitResult> {
  const db = await getDb();
  if (!db) {
    // If database is unavailable, allow the request
    return {
      allowed: true,
      limit: RATE_LIMIT_CONFIG.requestsPerMinute,
      remaining: RATE_LIMIT_CONFIG.requestsPerMinute,
      resetAt: new Date(Date.now() + RATE_LIMIT_CONFIG.windowMs),
    };
  }

  try {
    // Get the current time and the window start time
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.windowMs);

    // Count requests in the current window
    const logsInWindow = await db
      .select()
      .from(apiKeyLogs)
      .where(
        and(
          eq(apiKeyLogs.apiKeyId, apiKeyId),
          gte(apiKeyLogs.createdAt, windowStart.toISOString())
        )
      );

    const requestCount = logsInWindow.length;
    const limit = RATE_LIMIT_CONFIG.requestsPerMinute;
    const remaining = Math.max(0, limit - requestCount);
    const allowed = requestCount < limit;

    // Calculate reset time (when the oldest request in the window expires)
    let resetAt = new Date(now.getTime() + RATE_LIMIT_CONFIG.windowMs);
    if (logsInWindow.length > 0) {
      const oldestLog = logsInWindow[0];
      if (oldestLog.createdAt) {
        const oldestTime = new Date(oldestLog.createdAt).getTime();
        resetAt = new Date(oldestTime + RATE_LIMIT_CONFIG.windowMs);
      }
    }

    const retryAfter = allowed ? undefined : Math.ceil((resetAt.getTime() - now.getTime()) / 1000);

    return {
      allowed,
      limit,
      remaining,
      resetAt,
      retryAfter,
    };
  } catch (error) {
    console.error('[RateLimiter] Error checking rate limit:', error);
    // If there's an error, allow the request to proceed
    return {
      allowed: true,
      limit: RATE_LIMIT_CONFIG.requestsPerMinute,
      remaining: RATE_LIMIT_CONFIG.requestsPerMinute,
      resetAt: new Date(Date.now() + RATE_LIMIT_CONFIG.windowMs),
    };
  }
}

/**
 * Log an API request for rate limiting tracking
 */
export async function logApiRequest(
  apiKeyId: number,
  method: string,
  endpoint: string,
  statusCode: number,
  responseTime?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[RateLimiter] Cannot log request: database not available');
    return;
  }

  try {
    await db.insert(apiKeyLogs).values({
      apiKeyId,
      method,
      endpoint,
      statusCode,
      responseTime,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[RateLimiter] Failed to log API request:', error);
    // Don't throw - logging failures shouldn't break the API
  }
}

/**
 * Get rate limit statistics for an API key
 */
export async function getRateLimitStats(apiKeyId: number) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.windowMs);

    // Get logs in current window
    const currentWindowLogs = await db
      .select()
      .from(apiKeyLogs)
      .where(
        and(
          eq(apiKeyLogs.apiKeyId, apiKeyId),
          gte(apiKeyLogs.createdAt, windowStart.toISOString())
        )
      );

    // Get logs from last 24 hours for daily stats
    const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dailyLogs = await db
      .select()
      .from(apiKeyLogs)
      .where(
        and(
          eq(apiKeyLogs.apiKeyId, apiKeyId),
          gte(apiKeyLogs.createdAt, dayStart.toISOString())
        )
      );

    // Calculate average response time
    const responseTimes = dailyLogs
      .filter(log => log.responseTime !== null && log.responseTime !== undefined)
      .map(log => log.responseTime as number);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Count errors (5xx status codes)
    const errorCount = dailyLogs.filter(log => log.statusCode >= 500).length;

    return {
      currentWindowRequests: currentWindowLogs.length,
      dailyRequests: dailyLogs.length,
      avgResponseTime,
      errorCount,
      lastRequestAt: dailyLogs.length > 0 ? dailyLogs[0].createdAt : null,
    };
  } catch (error) {
    console.error('[RateLimiter] Failed to get rate limit stats:', error);
    return null;
  }
}

/**
 * Clean up old logs (older than 7 days) to keep database size manageable
 */
export async function cleanupOldLogs(): Promise<number> {
  const db = await getDb();
  if (!db) {
    return 0;
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // This is a simplified cleanup - in production you'd use a proper DELETE query
    // For now, we'll just log that cleanup would happen
    console.log(`[RateLimiter] Cleanup would remove logs older than ${sevenDaysAgo.toISOString()}`);
    
    return 0;
  } catch (error) {
    console.error('[RateLimiter] Failed to cleanup old logs:', error);
    return 0;
  }
}
