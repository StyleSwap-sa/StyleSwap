import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createBoutique,
  getBoutiqueById,
  getBoutiqueBySlug,
  getBoutiquesByOwner,
  getAllBoutiques,
  updateBoutique,
  deleteBoutique,
  addBoutiqueUser,
  getBoutiqueUsers,
  getUserBoutiques,
  getBoutiqueUserRole,
  updateBoutiqueUserRole,
  removeBoutiqueUser,
  getBoutiqueSettings,
  createBoutiqueSettings,
  updateBoutiqueSettings,
  getBoutiqueCredits,
  createBoutiqueCredits,
  updateBoutiqueCredits,
  deductBoutiqueCredit,
  addBoutiqueCredit,
} from "../db.boutiques";
import { TRPCError } from "@trpc/server";

/**
 * Boutique Management Router
 * Handles all boutique-related operations for B2B flow
 */

export const boutiquesRouter = router({
  /**
   * Get current user's boutiques
   */
  myBoutiques: protectedProcedure.query(async ({ ctx }) => {
    const userBoutiques = await getUserBoutiques(ctx.user.id);
    return userBoutiques;
  }),

  /**
   * Get boutique by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const boutique = await getBoutiqueById(input.id);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }
      return boutique;
    }),

  /**
   * Get boutique by slug (for public access)
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const boutique = await getBoutiqueBySlug(input.slug);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }
      return boutique;
    }),

  /**
   * Create a new boutique (self-service registration)
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
        description: z.string().optional(),
        logoUrl: z.string().url().optional(),
        websiteUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existing = await getBoutiqueBySlug(input.slug);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Boutique slug already exists",
        });
      }

      // Create boutique
      const result = await createBoutique({
        name: input.name,
        slug: input.slug,
        ownerId: ctx.user.id,
        description: input.description,
        logoUrl: input.logoUrl,
        websiteUrl: input.websiteUrl,
      });

      const boutiqueId = (result as any).insertId;

      // Create default settings
      await createBoutiqueSettings({
        boutiqueId,
        enableSharing: 1,
        enableAnalytics: 1,
      });

      // Create default credits (0 credits, must purchase)
      await createBoutiqueCredits({
        boutiqueId,
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
      });

      // Add owner to boutique staff
      await addBoutiqueUser({
        boutiqueId,
        userId: ctx.user.id,
        role: "owner",
      });

      return { id: boutiqueId, name: input.name, slug: input.slug, description: input.description, logoUrl: input.logoUrl, websiteUrl: input.websiteUrl };
    }),

  /**
   * Update boutique details
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        logoUrl: z.string().url().optional(),
        websiteUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization
      const boutique = await getBoutiqueById(input.id);
      if (!boutique) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Boutique not found",
        });
      }

      const userRole = await getBoutiqueUserRole(input.id, ctx.user.id);
      if (!userRole || (userRole.role !== "owner" && userRole.role !== "manager")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this boutique",
        });
      }

      await updateBoutique(input.id, {
        name: input.name,
        description: input.description,
        logoUrl: input.logoUrl,
        websiteUrl: input.websiteUrl,
      });

      return { id: input.id, name: input.name, description: input.description, logoUrl: input.logoUrl, websiteUrl: input.websiteUrl };
    }),

  /**
   * Get boutique staff
   */
  getStaff: protectedProcedure
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

      return await getBoutiqueUsers(input.boutiqueId);
    }),

  /**
   * Add staff member to boutique
   */
  addStaff: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        userId: z.number(),
        role: z.enum(["manager", "staff"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization - only owner/manager can add staff
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || (userRole.role !== "owner" && userRole.role !== "manager")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage staff",
        });
      }

      // Check if user already exists in boutique
      const existing = await getBoutiqueUserRole(input.boutiqueId, input.userId);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this boutique",
        });
      }

      await addBoutiqueUser({
        boutiqueId: input.boutiqueId,
        userId: input.userId,
        role: input.role,
      });

      return { success: true };
    }),

  /**
   * Update staff role
   */
  updateStaffRole: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        userId: z.number(),
        role: z.enum(["manager", "staff"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization - only owner can change roles
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || userRole.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only boutique owner can change staff roles",
        });
      }

      await updateBoutiqueUserRole(input.boutiqueId, input.userId, input.role);

      return { success: true };
    }),

  /**
   * Remove staff member
   */
  removeStaff: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization - only owner can remove staff
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || userRole.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only boutique owner can remove staff",
        });
      }

      await removeBoutiqueUser(input.boutiqueId, input.userId);

      return { success: true };
    }),

  /**
   * Get boutique settings
   */
  getSettings: protectedProcedure
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

      const settings = await getBoutiqueSettings(input.boutiqueId);
      return settings || null;
    }),

  /**
   * Update boutique settings
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        brandingColor: z.string().optional(),
        customDomain: z.string().optional(),
        enableSharing: z.number().optional(),
        enableAnalytics: z.number().optional(),
        webhookUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check authorization - only owner/manager can update settings
      const userRole = await getBoutiqueUserRole(input.boutiqueId, ctx.user.id);
      if (!userRole || (userRole.role !== "owner" && userRole.role !== "manager")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update settings",
        });
      }

      const { boutiqueId, ...data } = input;
      await updateBoutiqueSettings(boutiqueId, data);

      return { success: true };
    }),

  /**
   * Get boutique credits
   */
  getCredits: protectedProcedure
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

      const credits = await getBoutiqueCredits(input.boutiqueId);
      return credits || null;
    }),

  /**
   * Admin: Get all boutiques
   */
  getAllBoutiques: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view all boutiques",
        });
      }

      return await getAllBoutiques(input.status);
    }),

  /**
   * Admin: Suspend boutique
   */
  suspendBoutique: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can suspend boutiques",
        });
      }

      await updateBoutique(input.id, { status: "suspended" });

      return { success: true };
    }),

  /**
   * Admin: Add credits to boutique
   */
  addCredits: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can add credits",
        });
      }

      await addBoutiqueCredit(input.boutiqueId, input.amount);

      return { success: true };
    }),
});
