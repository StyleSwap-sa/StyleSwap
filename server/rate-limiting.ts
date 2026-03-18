/**
 * Rate Limiting and Monitoring Service
 * Tracks API usage and enforces rate limits per app
 */

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

interface RequestRecord {
  timestamp: number;
  endpoint: string;
}

// In-memory storage for request tracking (in production, use Redis)
const requestHistory = new Map<string, RequestRecord[]>();

// Rate limit configurations by app status
const rateLimitConfigs: Record<string, RateLimitConfig> = {
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

/**
 * Check if API request is within rate limits
 */
export function checkRateLimit(
  apiKey: string,
  status: string
): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  reason?: string;
} {
  const config = rateLimitConfigs[status] || rateLimitConfigs.active;

  // If suspended or revoked, deny all requests
  if (config.requestsPerMinute === 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(),
      reason: `App is ${status}. No requests allowed.`,
    };
  }

  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Get request history for this API key
  const history = requestHistory.get(apiKey) || [];

  // Filter requests within time windows
  const requestsInLastMinute = history.filter((r) => r.timestamp > oneMinuteAgo).length;
  const requestsInLastHour = history.filter((r) => r.timestamp > oneHourAgo).length;
  const requestsInLastDay = history.filter((r) => r.timestamp > oneDayAgo).length;

  // Check against limits
  if (requestsInLastMinute >= config.requestsPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(oneMinuteAgo + 60 * 1000),
      reason: `Rate limit exceeded: ${requestsInLastMinute}/${config.requestsPerMinute} requests per minute`,
    };
  }

  if (requestsInLastHour >= config.requestsPerHour) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(oneHourAgo + 60 * 60 * 1000),
      reason: `Rate limit exceeded: ${requestsInLastHour}/${config.requestsPerHour} requests per hour`,
    };
  }

  if (requestsInLastDay >= config.requestsPerDay) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(oneDayAgo + 24 * 60 * 60 * 1000),
      reason: `Rate limit exceeded: ${requestsInLastDay}/${config.requestsPerDay} requests per day`,
    };
  }

  // Calculate remaining requests
  const remainingInMinute = config.requestsPerMinute - requestsInLastMinute;

  return {
    allowed: true,
    remaining: remainingInMinute,
    resetAt: new Date(oneMinuteAgo + 60 * 1000),
  };
}

/**
 * Record an API request
 */
export function recordRequest(apiKey: string, endpoint: string): void {
  const history = requestHistory.get(apiKey) || [];

  // Add new request
  history.push({
    timestamp: Date.now(),
    endpoint,
  });

  // Clean up old requests (older than 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = history.filter((r) => r.timestamp > oneDayAgo);

  requestHistory.set(apiKey, filtered);
}

/**
 * Get usage statistics for an API key
 */
export function getUsageStats(apiKey: string): {
  totalRequests: number;
  requestsInLastHour: number;
  requestsInLastDay: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
} {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const history = requestHistory.get(apiKey) || [];

  const requestsInLastHour = history.filter((r) => r.timestamp > oneHourAgo).length;
  const requestsInLastDay = history.filter((r) => r.timestamp > oneDayAgo).length;

  // Calculate top endpoints
  const endpointCounts = new Map<string, number>();
  history.forEach((r) => {
    const count = endpointCounts.get(r.endpoint) || 0;
    endpointCounts.set(r.endpoint, count + 1);
  });

  const topEndpoints = Array.from(endpointCounts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalRequests: history.length,
    requestsInLastHour,
    requestsInLastDay,
    topEndpoints,
  };
}

/**
 * Get rate limit configuration for a status
 */
export function getRateLimitConfig(status: string): RateLimitConfig {
  return rateLimitConfigs[status] || rateLimitConfigs.active;
}

/**
 * Update rate limit configuration (admin only)
 */
export function updateRateLimitConfig(
  status: string,
  config: Partial<RateLimitConfig>
): void {
  if (rateLimitConfigs[status]) {
    rateLimitConfigs[status] = {
      ...rateLimitConfigs[status],
      ...config,
    };
    console.log(`[Rate Limiting] Updated config for status "${status}":`, rateLimitConfigs[status]);
  }
}

/**
 * Reset request history for an API key (admin only)
 */
export function resetRequestHistory(apiKey: string): void {
  requestHistory.delete(apiKey);
  console.log(`[Rate Limiting] Reset request history for API key: ${apiKey}`);
}

/**
 * Get all active API keys with their usage
 */
export function getAllUsageStats(): Array<{
  apiKey: string;
  totalRequests: number;
  requestsInLastHour: number;
  requestsInLastDay: number;
}> {
  const stats: Array<{
    apiKey: string;
    totalRequests: number;
    requestsInLastHour: number;
    requestsInLastDay: number;
  }> = [];

  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  requestHistory.forEach((history, apiKey) => {
    const requestsInLastHour = history.filter((r) => r.timestamp > oneHourAgo).length;
    const requestsInLastDay = history.filter((r) => r.timestamp > oneDayAgo).length;

    stats.push({
      apiKey,
      totalRequests: history.length,
      requestsInLastHour,
      requestsInLastDay,
    });
  });

  return stats.sort((a, b) => b.totalRequests - a.totalRequests);
}
