import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createTryOnResult,
  getTryOnResultById,
  getBoutiqueTryOnResults,
  getProductTryOnResults,
  updateTryOnResult,
  createBoutiqueTransaction,
  getBoutiqueTransactions,
  getBoutiqueUsageStats,
} from "../db.tryons";
import { getProductById } from "../db.products";
import { getBoutiqueById, getBoutiqueCredits, deductBoutiqueCredit } from "../db.boutiques";
import { getFitroomClient } from "../_core/fitroom";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * B2B Try-On Router
 * Handles product-linked try-on flow for boutiques
 * Customers upload body photo, product image comes from boutique catalogue
 */

export const b2bTryonRouter = router({
  /**
   * Create B2B try-on (body photo + product ID)
   * This is the main B2B endpoint
   */
  createB2BTryOn: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        productId: z.number(),
        bodyPhotoBase64: z.string(), // Base64 encoded body photo
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // 1. Verify boutique exists and is active
        const boutique = await getBoutiqueById(input.boutiqueId);
        if (!boutique) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Boutique not found",
          });
        }

        if (boutique.status !== "active") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Boutique is not active",
          });
        }

        // 2. Verify product exists and belongs to boutique
        const product = await getProductById(input.productId);
        if (!product || product.boutiqueId !== input.boutiqueId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        if (product.isActive !== 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Product is not active",
          });
        }

        // 3. Check boutique has available credits
        const credits = await getBoutiqueCredits(input.boutiqueId);
        if (!credits || credits.remainingCredits < 1) {
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "Insufficient credits. Please purchase more credits.",
          });
        }


        // Create try-on with Fitroom API using base64 encoding
        const fitroomClient = getFitroomClient();
        
        // Download product image to get base64
        const axios = require('axios');
        const imageResponse = await axios.get(product.imageUrl, { responseType: 'arraybuffer' });
        const clothImageBase64 = Buffer.from(imageResponse.data).toString('base64');
        
        const fitRoomResult = await fitroomClient.createTryOnWithBase64({
          modelImageBase64: input.bodyPhotoBase64,
          clothImageBase64: clothImageBase64,
          clothType: 'single',
        });

        const requestId = uuidv4();

        // No temp files to clean up - using base64 encoding directly

        if (!fitRoomResult.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: fitRoomResult.error || "Failed to create try-on",
          });
        }

        // 5. Deduct credit from boutique
        await deductBoutiqueCredit(input.boutiqueId, 1);

        // 6. Save try-on result to database
        const tryOnResult = await createTryOnResult({
          boutiqueId: input.boutiqueId,
          userId: ctx.user.id,
          productId: input.productId,
          userPhotoUrl: "", // Will be updated when Fitroom provides URL
          fitRoomTaskId: fitRoomResult.taskId,
          fitRoomRequestId: fitRoomResult.taskId, // Use task ID as request ID
          flowType: "b2b",
          shareToken: uuidv4(),
        });

        const tryOnId = (tryOnResult as any).insertId;

        // 7. Log transaction for boutique
        await createBoutiqueTransaction({
          boutiqueId: input.boutiqueId,
          type: "usage",
          amount: 1,
          productId: input.productId,
          fitRoomRequestId: fitRoomResult.taskId,
          initiatedBy: ctx.user.id,
          description: `Try-on for product: ${product.name}`,
          status: "completed",
        });

        return {
          success: true,
          tryOnId,
          taskId: fitRoomResult.taskId,
          requestId: fitRoomResult.taskId,
          message: "Try-on created successfully",
        };
      } catch (error) {
        console.error("[B2B Try-On Error]", error);
        throw error;
      }
    }),

  /**
   * Get try-on result by ID
   */
  getResult: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await getTryOnResultById(input.id);
      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Try-on result not found",
        });
      }
      return result;
    }),

  /**
   * Get try-on results for a boutique (admin/owner only)
   */
  getBoutiqueResults: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user is owner/manager of boutique
      const { getBoutiqueUserRole } = await import("../db.boutiques");
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      return await getBoutiqueTryOnResults(input.boutiqueId, input.limit);
    }),

  /**
   * Get try-on results for a specific product
   */
  getProductResults: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify product exists
      const product = await getProductById(input.productId);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Verify user is staff of the boutique
      const { getBoutiqueUserRole } = await import("../db.boutiques");
      const userRole = await getBoutiqueUserRole(product.boutiqueId, ctx.user.id);
      
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this product",
        });
      }

      return await getProductTryOnResults(input.productId, input.limit);
    }),

  /**
   * Get boutique usage statistics
   */
  getUsageStats: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify user is owner/manager of boutique
      const { getBoutiqueUserRole } = await import("../db.boutiques");
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      return await getBoutiqueUsageStats(input.boutiqueId);
    }),

  /**
   * Get boutique transaction history
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        type: z.string().optional(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user is owner/manager of boutique
      const { getBoutiqueUserRole } = await import("../db.boutiques");
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      return await getBoutiqueTransactions(input.boutiqueId, input.type, input.limit);
    }),

  /**
   * Share try-on result (generate public link)
   */
  shareResult: protectedProcedure
    .input(z.object({ tryOnId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await getTryOnResultById(input.tryOnId);
      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Try-on result not found",
        });
      }

      // Verify ownership
      if (result.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to share this try-on",
        });
      }

      // Generate share token if not exists
      const shareToken = result.shareToken || uuidv4();
      
      await updateTryOnResult(input.tryOnId, {
        shareToken,
        isPublic: 1,
      });

      return {
        success: true,
        shareToken,
        shareUrl: `/share/${shareToken}`,
      };
    }),

  /**
   * Get shared try-on result (public)
   */
  getSharedResult: publicProcedure
    .input(z.object({ shareToken: z.string() }))
    .query(async ({ input }) => {
      const { getTryOnResultByShareToken } = await import("../db.tryons");
      const result = await getTryOnResultByShareToken(input.shareToken);
      
      if (!result || result.isPublic !== 1) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shared try-on not found",
        });
      }

      return result;
    }),
});
