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
import { createVerificationToken, sendVerificationEmail } from "../email.verification";
import { createYocoCharge, processCreditPurchase, getYocoPublicKey } from "../yoco.payment";
import { awardReferrerCredits } from "../db.referral";

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
   * Check if slug is available and suggest alternatives
   */
  checkSlugAvailability: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const existing = await getBoutiqueBySlug(input.slug);
      if (!existing) {
        return { available: true, slug: input.slug };
      }

      let counter = 1;
      let suggestedSlug = input.slug;
      while (counter <= 10) {
        suggestedSlug = input.slug + "-" + counter;
        const existingAlt = await getBoutiqueBySlug(suggestedSlug);
        if (!existingAlt) {
          return { available: false, slug: input.slug, suggestion: suggestedSlug };
        }
        counter++;
      }

      return { available: false, slug: input.slug, suggestion: null };
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
        websiteUrl: z.string().optional(),
        instagramHandle: z.string().optional(),
        tiktokHandle: z.string().optional(),
        facebookUrl: z.string().optional(),
        whatsappNumber: z.string().optional(),
        referralCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Add https:// protocol if missing from website URL
      let websiteUrl = input.websiteUrl;
      if (websiteUrl && !websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        websiteUrl = 'https://' + websiteUrl;
      }
      // Check if slug already exists and auto-generate alternative if needed
      let finalSlug = input.slug;
      let existing = await getBoutiqueBySlug(finalSlug);
      
      if (existing) {
        let counter = 1;
        while (counter <= 100) {
          finalSlug = input.slug + "-" + counter;
          existing = await getBoutiqueBySlug(finalSlug);
          if (!existing) break;
          counter++;
        }
        
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Could not generate unique slug",
          });
        }
      }

      // Create boutique
      const result = await createBoutique({
        name: input.name,
        slug: finalSlug,
        ownerId: ctx.user.id,
        description: input.description,
        logoUrl: input.logoUrl,
        websiteUrl: websiteUrl,
        instagramHandle: input.instagramHandle,
        tiktokHandle: input.tiktokHandle,
        facebookUrl: input.facebookUrl,
        whatsappNumber: input.whatsappNumber,
      });

      const boutiqueId = (result as any).insertId;

      // Create default settings (database defaults will be applied)
      await createBoutiqueSettings(boutiqueId);

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

      // Process referral code if provided
      if (input.referralCode) {
        try {
          // Call the applyReferralCode mutation to award credits
          const referralParts = input.referralCode.split("-");
          if (referralParts.length === 3 && referralParts[0] === "STYLESWAP" && referralParts[1] === "BOUTIQUE") {
            const referrerBoutiqueId = parseInt(referralParts[2], 10);
            if (!isNaN(referrerBoutiqueId)) {
              // Award 10 credits to referrer
              await awardReferrerCredits(referrerBoutiqueId, 10);
              console.log(`[Referral] Awarded 10 credits to boutique ${referrerBoutiqueId} for referring boutique ${boutiqueId}`);
            }
          }
        } catch (error) {
          console.error('[Referral] Error processing referral code:', error);
          // Don't fail boutique creation if referral processing fails
        }
      }

      // Generate and send verification email
      try {
        const verificationToken = await createVerificationToken(boutiqueId);
        await sendVerificationEmail(
          input.name,
          ctx.user.email || '',
          verificationToken,
          finalSlug
        );
      } catch (error) {
        console.error('Error sending verification email:', error);
      }

      return { id: boutiqueId, name: input.name, slug: finalSlug, description: input.description, logoUrl: input.logoUrl, websiteUrl: input.websiteUrl, isVerified: false };
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

  /**
   * Get Yoco public key for payment form
   */
  getYocoPublicKey: publicProcedure.query(() => {
    return { publicKey: getYocoPublicKey() };
  }),

  /**
   * Create Yoco payment checkout session
   */
  createPaymentCheckout: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        credits: z.number().positive(),
        amount: z.number().positive(),
        currency: z.string(),
        description: z.string(),
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

      try {
        const { ENV } = await import("../_core/env");
        if (!ENV.yocoSecretKey || !ENV.yocoApiBaseUrl) {
          throw new Error("Yoco credentials not configured");
        }

        // Get the base URL from the request origin (should be HTTPS in production)
        const origin = ctx.req?.headers?.origin || process.env.VITE_APP_URL || "http://localhost:3000";
        // For local development with HTTP, use the HTTPS proxy URL if available
        let baseUrl = origin;
        if (origin.includes("localhost") && origin.startsWith("http://")) {
          // In development, we might need to use the actual deployed URL
          baseUrl = "https://3000-ibgtueni2ktvdrad3l0mt-73908040.us2.manus.computer";
        }

        // Create checkout directly with Yoco API
        console.log("[Yoco] Environment Check:", {
          yocoApiBaseUrl: ENV.yocoApiBaseUrl,
          yocoSecretKeyExists: !!ENV.yocoSecretKey,
          yocoSecretKeyLength: ENV.yocoSecretKey?.length,
        });
        const checkoutUrl = `${ENV.yocoApiBaseUrl}/checkouts`;
        console.log("[Yoco] Creating checkout:", {
          url: checkoutUrl,
          amount: input.amount,
          currency: input.currency,
          baseUrl,
          fullUrl: checkoutUrl,
        });
        console.log("[Yoco] Fetch URL:", checkoutUrl);
        console.log("[Yoco] Auth Header:", `Bearer ${ENV.yocoSecretKey?.substring(0, 10)}...`);
        const response = await fetch(checkoutUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.yocoSecretKey}`,
          },
          body: JSON.stringify({
            amount: input.amount,
            currency: input.currency,
            successUrl: `${baseUrl}/boutique-credits/${input.boutiqueId}?success=true`,
            cancelUrl: `${baseUrl}/boutique-credits/${input.boutiqueId}?cancelled=true`,
            metadata: {
              boutiqueId: input.boutiqueId.toString(),
              credits: input.credits.toString(),
              userId: ctx.user.id.toString(),
              type: "boutique_credit_purchase",
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Yoco] API Error Response:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          try {
            const error = JSON.parse(errorText);
            throw new Error(`Yoco API error: ${error.message || response.statusText}`);
          } catch (e) {
            throw new Error(`Yoco API error: ${response.statusText} - ${errorText}`);
          }
        }

        const data = await response.json();
        const redirectUrl = data.redirectUrl || `https://checkout.yoco.com/${data.id}`;

        return { success: true, checkoutUrl: redirectUrl };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to create checkout session",
        });
      }
    }),

  /**
   * Purchase credits with Yoco payment
   */
  purchaseCredits: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        credits: z.number().positive(),
        amount: z.number().positive(),
        token: z.string(),
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

      const chargeResult = await createYocoCharge({
        amount: input.amount,
        currency: 'ZAR',
        description: `${input.credits} credits for boutique`,
        metadata: {
          boutiqueId: input.boutiqueId.toString(),
          credits: input.credits.toString(),
          userId: ctx.user.id.toString(),
        },
        token: input.token,
      });

      if (!chargeResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: chargeResult.error || 'Payment failed',
        });
      }

      const purchaseResult = await processCreditPurchase({
        boutiqueId: input.boutiqueId,
        chargeId: chargeResult.chargeId!,
        amount: input.amount,
        credits: input.credits,
        paymentMethod: 'card',
      });

      if (!purchaseResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: purchaseResult.message,
        });
      }

      return { success: true, message: 'Credits purchased successfully' };
    }),
});
