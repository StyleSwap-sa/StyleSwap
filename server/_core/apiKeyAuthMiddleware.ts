import { TRPCError } from "@trpc/server";
import { middleware } from "./trpc";
import { db } from "../db";

import { apiKeys } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * API Key Authentication Middleware
 * 
 * This middleware validates API keys from request headers and extracts
 * boutique context for use in protected API procedures.
 * 
 * Usage:
 * - Add to request headers: Authorization: Bearer sk_live_xxxxx
 * - Or query parameter: ?api_key=sk_live_xxxxx
 */

export interface ApiKeyContext {
  apiKeyId: number;
  boutiqueId: number;
  keyName: string;
  isValid: boolean;
}

/**
 * Extract and validate API key from request
 * Supports both Authorization header and query parameter
 */
export async function validateApiKey(
  authHeader?: string,
  queryKey?: string
): Promise<ApiKeyContext | null> {
  let apiKeyString: string | null = null;

  // Try Authorization header first (Bearer token)
  if (authHeader && authHeader.startsWith("Bearer ")) {
    apiKeyString = authHeader.substring(7);
  }

  // Fall back to query parameter
  if (!apiKeyString && queryKey) {
    apiKeyString = queryKey;
  }

  if (!apiKeyString) {
    return null;
  }

  try {
    // Hash the provided key to match stored hash
    const keyHash = crypto
      .createHash("sha256")
      .update(apiKeyString)
      .digest("hex");

    // Look up the API key in the database
    const apiKey = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!apiKey || apiKey.length === 0) {
      return null;
    }

    const key = apiKey[0];

    // Check if key is revoked
    if (key.isRevoked) {
      return null;
    }

    // Check if key has expired (if expiration is set)
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return null;
    }

    // Update last used timestamp
    try {
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, key.id));
    } catch (error) {
      console.error("Failed to update API key last used timestamp:", error);
    }

    return {
      apiKeyId: key.id,
      boutiqueId: key.boutiqueId,
      keyName: key.name,
      isValid: true,
    };
  } catch (error) {
    console.error("Error validating API key:", error);
    return null;
  }
}

/**
 * tRPC middleware for API key authentication
 * 
 * Usage in procedures:
 * export const apiKeyProtectedProcedure = publicProcedure.use(apiKeyAuthMiddleware);
 */
export const apiKeyAuthMiddleware = async (opts: any): Promise<any> => {
  const { ctx, next } = opts;

  // Extract API key from request headers or query
  const authHeader = ctx.req?.headers?.authorization;
  const queryKey = (ctx.req?.query as any)?.api_key;

  const apiKeyContext = await validateApiKey(authHeader, queryKey);

  if (!apiKeyContext) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or missing API key",
    });
  }

  // Add API key context to the context object
  return next({
    ctx: {
      ...ctx,
      apiKey: apiKeyContext,
    },
  });
};

/**
 * Create a protected procedure that requires API key authentication
 * 
 * Usage:
 * export const apiKeyProtectedProcedure = publicProcedure.use(apiKeyAuthMiddleware);
 * 
 * Then in routers:
 * apiKeyProtectedProcedure.query(({ ctx }) => {
 *   const boutiqueId = ctx.apiKey.boutiqueId;
 *   // ... your logic
 * });
 */
export function createApiKeyProtectedProcedure(baseProcedure: any) {
  return baseProcedure.use(apiKeyAuthMiddleware);
}

/**
 * Validate API key and return context
 * Useful for non-tRPC API endpoints
 */
export async function validateApiKeyForEndpoint(
  req: any
): Promise<{ valid: boolean; context?: ApiKeyContext; error?: string }> {
  const authHeader = req.headers?.authorization;
  const queryKey = req.query?.api_key;

  const apiKeyContext = await validateApiKey(authHeader, queryKey);

  if (!apiKeyContext) {
    return {
      valid: false,
      error: "Invalid or missing API key",
    };
  }

  return {
    valid: true,
    context: apiKeyContext,
  };
}

/**
 * Log API request for analytics and monitoring
 */
export async function logApiRequest(
  apiKeyId: number,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  error?: string
) {
  try {
    // TODO: Implement request logging to apiKeyLogs table
    // This will be used for analytics and rate limiting
    console.log(
      `[API] ${method} ${endpoint} - Status: ${statusCode} - Time: ${responseTime}ms - Key: ${apiKeyId}`
    );

    if (error) {
      console.error(`[API Error] ${endpoint} - ${error}`);
    }
  } catch (err) {
    console.error("Failed to log API request:", err);
  }
}
