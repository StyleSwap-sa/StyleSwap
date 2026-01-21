import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createProduct,
  getProductById,
  getProductsByBoutique,
  getProductsByCategory,
  getProductBySku,
  updateProduct,
  deleteProduct,
  deactivateProduct,
  activateProduct,
  getProductCategories,
} from "../db.products";
import { getBoutiqueUserRole } from "../db.boutiques";
import { TRPCError } from "@trpc/server";
import { uploadProductImage, validateImageFile } from "../product.upload";

/**
 * Product Management Router
 * Handles per-boutique product catalogue operations
 */

export const productsRouter = router({
  /**
   * Get all products for a boutique
   */
  getByBoutique: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        activeOnly: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      return await getProductsByBoutique(input.boutiqueId, input.activeOnly);
    }),

  /**
   * Get products by category
   */
  getByCategory: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        category: z.string(),
        activeOnly: z.boolean().optional().default(true),
      })
    )
    .query(async ({ input }) => {
      return await getProductsByCategory(
        input.boutiqueId,
        input.category,
        input.activeOnly
      );
    }),

  /**
   * Get product by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const product = await getProductById(input.id);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      return product;
    }),

  /**
   * Get all categories for a boutique
   */
  getCategories: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ input }) => {
      return await getProductCategories(input.boutiqueId);
    }),

  /**
   * Create a new product
   */
  create: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        name: z.string().min(1).max(255),
        sku: z.string().max(100).optional(),
        description: z.string().optional(),
        category: z.string().min(1).max(100),
        imageUrl: z.string().url(),
        price: z.number().positive().optional(),
        currency: z.string().length(3).optional().default("ZAR"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization - user must be staff/manager/owner of boutique
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      // Check if SKU already exists for this boutique
      if (input.sku) {
        const existing = await getProductBySku(input.boutiqueId, input.sku);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Product SKU already exists in this boutique",
          });
        }
      }

      const result = await createProduct({
        boutiqueId: input.boutiqueId,
        name: input.name,
        sku: input.sku,
        description: input.description,
        category: input.category,
        imageUrl: input.imageUrl,
        price: input.price,
        currency: input.currency,
      });

      const productId = (result as any).insertId;
      return { id: productId, ...input };
    }),

  /**
   * Update product
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        boutiqueId: z.number(),
        name: z.string().optional(),
        sku: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        imageUrl: z.string().url().optional(),
        price: z.number().positive().optional(),
        currency: z.string().length(3).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      // Verify product belongs to boutique
      const product = await getProductById(input.id);
      if (!product || product.boutiqueId !== input.boutiqueId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check SKU uniqueness if updating
      if (input.sku && input.sku !== product.sku) {
        const existing = await getProductBySku(input.boutiqueId, input.sku);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Product SKU already exists in this boutique",
          });
        }
      }

      const { id, boutiqueId, ...updateData } = input;
      await updateProduct(id, updateData as any);

      return { id, boutiqueId, ...updateData };
    }),

  /**
   * Deactivate product (soft delete)
   */
  deactivate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        boutiqueId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      // Verify product belongs to boutique
      const product = await getProductById(input.id);
      if (!product || product.boutiqueId !== input.boutiqueId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await deactivateProduct(input.id);

      return { success: true };
    }),

  /**
   * Activate product
   */
  activate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        boutiqueId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      // Verify product belongs to boutique
      const product = await getProductById(input.id);
      if (!product || product.boutiqueId !== input.boutiqueId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await activateProduct(input.id);

      return { success: true };
    }),

  /**
   * Delete product (hard delete)
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        boutiqueId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization - only owner can delete
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || userRole.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only boutique owner can delete products",
        });
      }

      // Verify product belongs to boutique
      const product = await getProductById(input.id);
      if (!product || product.boutiqueId !== input.boutiqueId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await deleteProduct(input.id);

      return { success: true };
    }),

  /**
   * Upload product image to S3
   */
  uploadImage: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        productName: z.string(),
        filename: z.string(),
        mimeType: z.string(),
        fileBuffer: z.instanceof(Buffer),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this boutique",
        });
      }

      const validation = validateImageFile({
        size: input.fileBuffer.length,
        type: input.mimeType,
        name: input.filename,
      });

      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error || 'Invalid file',
        });
      }

      const uploadResult = await uploadProductImage({
        boutiqueId: input.boutiqueId,
        productName: input.productName,
        fileBuffer: input.fileBuffer,
        filename: input.filename,
        mimeType: input.mimeType,
      });

      if (!uploadResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: uploadResult.error || 'Failed to upload image',
        });
      }

      return { success: true, url: uploadResult.url };
    }),
});
