import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createApiKey,
  getApiKeysByBoutique,
  updateApiKeyName,
  revokeApiKey,
  getApiKeyStats,
} from "../db.apikeys";
import { getBoutiqueUserRole } from "../db.boutiques";
import { getDb } from "../db";
import { apiKeys } from "../../drizzle/schema";

/**
 * API Key Management Router
 * Handles all API key operations for boutiques
 */

export const apiKeysRouter = router({
  /**
   * Get all API keys for a boutique
   */
  getApiKeys: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      return await getApiKeysByBoutique(input.boutiqueId);
    }),

  /**
   * Create a new API key for a boutique
   */
  createApiKey: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        name: z.string().min(1, "API key name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || (userRole.role !== "owner" && userRole.role !== "manager")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to create API keys",
        });
      }

      try {
        const newKey = await createApiKey(input.boutiqueId, input.name, "live");
        return newKey;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create API key",
        });
      }
    }),

  /**
   * Create API key for onboarding (without boutique requirement)
   * Used during the developer onboarding flow
   */
  createOnboardingApiKey: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "API key name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection unavailable",
          });
        }

        // Generate API key
        const { generateApiKey } = await import("../db.apikeys");
        const { key, maskedKey } = generateApiKey("test");

        // For onboarding, use placeholder boutique ID (0) - will be updated later
        const result = await db.insert(apiKeys).values({
          boutiqueId: 0,
          name: input.name,
          key,
          maskedKey,
          status: "active",
          requestsCount: 0,
          createdAt: new Date().toISOString(),
        });

        return {
          id: result[0],
          boutiqueId: 0,
          name: input.name,
          key,
          maskedKey,
          status: "active" as const,
          requestsCount: 0,
          createdAt: new Date(),
        };
      } catch (error) {
        console.error("[API Keys] Failed to create onboarding API key:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create API key",
        });
      }
    }),

  /**
   * Update API key name
   */
  updateApiKeyName: protectedProcedure
    .input(
      z.object({
        keyId: z.number(),
        boutiqueId: z.number(),
        name: z.string().min(1, "API key name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || (userRole.role !== "owner" && userRole.role !== "manager")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update API keys",
        });
      }

      try {
        await updateApiKeyName(input.keyId, input.name);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update API key",
        });
      }
    }),

  /**
   * Revoke an API key
   */
  revokeApiKey: protectedProcedure
    .input(
      z.object({
        keyId: z.number(),
        boutiqueId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || (userRole.role !== "owner" && userRole.role !== "manager")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to revoke API keys",
        });
      }

      try {
        await revokeApiKey(input.keyId);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to revoke API key",
        });
      }
    }),

  /**
   * Get API key statistics
   */
  getApiKeyStats: protectedProcedure
    .input(
      z.object({
        keyId: z.number(),
        boutiqueId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      const stats = await getApiKeyStats(input.keyId);
      if (!stats) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }

      return stats;
    }),
});
