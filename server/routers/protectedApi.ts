import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { checkRateLimit } from "../rateLimiter";
import { validateApiKey } from "../_core/apiKeyAuthMiddleware";

/**
 * Protected API Router
 * Endpoints that require API key authentication and rate limiting
 */

export const protectedApiRouter = router({
  /**
   * Generate virtual try-on image
   * POST /api/protected/try-on
   */
  generateTryOn: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        productId: z.string().min(1),
        productName: z.string().min(1),
        userImage: z.string().url(),
        garmentImage: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate API key
        const apiKeyData = await validateApiKey(input.apiKey);
        if (!apiKeyData) {
          return {
            success: false,
            error: "Invalid API key",
            statusCode: 401,
          };
        }

        // Apply rate limiting
        const rateLimitResult = await checkRateLimit(apiKeyData.id);
        if (!rateLimitResult.allowed) {
          return {
            success: false,
            error: "Rate limit exceeded. Maximum 100 requests per minute.",
            statusCode: 429,
            retryAfter: rateLimitResult.resetTime,
          };
        }

        // TODO: Call actual try-on generation service
        // For now, return mock response
        return {
          success: true,
          statusCode: 200,
          data: {
            tryOnId: `tryon_${Date.now()}`,
            imageUrl: "https://example.com/tryon-result.jpg",
            generatedAt: new Date().toISOString(),
            processingTime: 2500,
          },
          rateLimit: {
            limit: 100,
            remaining: rateLimitResult.remaining,
            reset: rateLimitResult.resetTime,
          },
        };
      } catch (error) {
        console.error("[Protected API] Error in generateTryOn:", error);
        return {
          success: false,
          error: "Internal server error",
          statusCode: 500,
        };
      }
    }),

  /**
   * Get API usage statistics
   * GET /api/protected/usage
   */
  getUsageStats: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
        period: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
      })
    )
    .query(async ({ input }) => {
      try {
        // Validate API key
        const apiKeyData = await validateApiKey(input.apiKey);
        if (!apiKeyData) {
          return {
            success: false,
            error: "Invalid API key",
            statusCode: 401,
          };
        }

        // TODO: Query actual usage statistics from database
        // For now, return mock data
        return {
          success: true,
          statusCode: 200,
          data: {
            period: input.period,
            totalRequests: 1250,
            successfulRequests: 1200,
            failedRequests: 50,
            rateLimitedRequests: 0,
            averageResponseTime: 2300,
            successRate: 96,
            quotaUsage: {
              used: 1250,
              limit: 10000,
              percentage: 12.5,
            },
          },
        };
      } catch (error) {
        console.error("[Protected API] Error in getUsageStats:", error);
        return {
          success: false,
          error: "Internal server error",
          statusCode: 500,
        };
      }
    }),

  /**
   * Verify API key validity
   * GET /api/protected/verify
   */
  verifyApiKey: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const apiKeyData = await validateApiKey(input.apiKey);

        if (!apiKeyData) {
          return {
            success: false,
            statusCode: 401,
            valid: false,
          };
        }

        return {
          success: true,
          statusCode: 200,
          valid: true,
          data: {
            keyId: apiKeyData.id,
            boutiqueId: apiKeyData.boutiqueId,
            name: apiKeyData.name,
            status: apiKeyData.status,
            createdAt: apiKeyData.createdAt,
            lastUsed: apiKeyData.lastUsed,
          },
        };
      } catch (error) {
        console.error("[Protected API] Error in verifyApiKey:", error);
        return {
          success: false,
          error: "Internal server error",
          statusCode: 500,
        };
      }
    }),

  /**
   * Verify API key (mutation version for onboarding)
   * Used during retailer onboarding to test API key
   */
  verifyApiKeyMutation: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const apiKeyData = await validateApiKey(input.apiKey);

        if (!apiKeyData) {
          return {
            valid: false,
            message: "API key is invalid or revoked",
          };
        }

        return {
          valid: true,
          message: "API key verified successfully",
          keyId: apiKeyData.id,
        };
      } catch (error) {
        console.error("[Protected API] Error in verifyApiKeyMutation:", error);
        return {
          valid: false,
          message: "Error verifying API key",
        };
      }
    }),

  /**
   * Get rate limit status
   * GET /api/protected/rate-limit-status
   */
  getRateLimitStatus: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const apiKeyData = await validateApiKey(input.apiKey);
        if (!apiKeyData) {
          return {
            success: false,
            error: "Invalid API key",
            statusCode: 401,
          };
        }

        const rateLimitStatus = await checkRateLimit(apiKeyData.id);

        return {
          success: true,
          statusCode: 200,
          data: {
            limit: 100,
            remaining: rateLimitStatus.remaining,
            reset: rateLimitStatus.resetTime,
            resetIn: Math.ceil(
              (rateLimitStatus.resetTime - Date.now()) / 1000
            ),
            allowed: rateLimitStatus.allowed,
          },
        };
      } catch (error) {
        console.error("[Protected API] Error in getRateLimitStatus:", error);
        return {
          success: false,
          error: "Internal server error",
          statusCode: 500,
        };
      }
    }),
});
