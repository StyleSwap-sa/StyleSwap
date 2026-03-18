import { TRPCError } from '@trpc/server';
import { checkRateLimit, logApiRequest } from '../rateLimiter';
import { getDb } from '../db';
import { apiKeys } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Extract API key from request headers
 * Supports both Authorization header and x-api-key header
 */
export function extractApiKey(headers: Record<string, string | string[] | undefined>): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = headers['authorization'] || headers['Authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check x-api-key header
  const apiKeyHeader = headers['x-api-key'] || headers['X-API-Key'];
  if (apiKeyHeader && typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Verify API key and get associated API key record
 */
export async function verifyApiKey(apiKeyString: string) {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database connection unavailable',
    });
  }

  try {
    const keyRecord = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, apiKeyString))
      .limit(1);

    if (keyRecord.length === 0) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid API key',
      });
    }

    const key = keyRecord[0];

    // Check if key is revoked
    if (key.status === 'revoked') {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'API key has been revoked',
      });
    }

    return key;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify API key',
    });
  }
}

/**
 * Rate limit middleware for API procedures
 * Should be used with API endpoints that require rate limiting
 */
export async function applyRateLimit(
  apiKeyId: number,
  method: string,
  endpoint: string,
  ipAddress?: string,
  userAgent?: string
) {
  const startTime = Date.now();

  try {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(apiKeyId);

    if (!rateLimitResult.allowed) {
      // Log the failed request
      await logApiRequest(
        apiKeyId,
        method,
        endpoint,
        429, // Too Many Requests
        Date.now() - startTime,
        ipAddress,
        userAgent
      );

      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Max ${rateLimitResult.limit} requests per minute. Retry after ${rateLimitResult.retryAfter} seconds.`,
      });
    }

    // Return rate limit info for response headers
    return {
      allowed: true,
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      resetAt: rateLimitResult.resetAt,
      logRequest: async (statusCode: number) => {
        await logApiRequest(
          apiKeyId,
          method,
          endpoint,
          statusCode,
          Date.now() - startTime,
          ipAddress,
          userAgent
        );
      },
    };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Rate limit check failed',
    });
  }
}
