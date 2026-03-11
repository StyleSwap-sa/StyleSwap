import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { affiliateLinks, affiliateTracking, affiliateCommissions, boutiques } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Generate unique affiliate code
function generateAffiliateCode(): string {
  return `aff_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Generate unique tracking token
function generateTrackingToken(): string {
  return `track_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Legal disclaimer for affiliate commissions
const AFFILIATE_LEGAL_NOTICE = "StyleSwap will receive 5% commission for purchases originating from the StyleSwap platform.";

export const affiliateRouter = router({
  // Create new affiliate link (admin only)
  createAffiliateLink: protectedProcedure
    .input(
      z.object({
        affiliateName: z.string().min(1, "Affiliate name is required"),
        description: z.string().optional(),
        commissionRate: z.number().min(0).max(100).default(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user is admin (you can add this check based on your auth system)
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const affiliateCode = generateAffiliateCode();

        const result = await db
          .insert(affiliateLinks)
          .values({
            affiliateName: input.affiliateName,
            affiliateCode,
            description: input.description,
            commissionRate: input.commissionRate.toString(),
            isActive: true,
          })
          .returning();

        return {
          success: true,
          affiliate: result[0],
          affiliateCode,
        };
      } catch (error) {
        console.error("[Affiliate] Error creating affiliate link:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create affiliate link",
        });
      }
    }),

  // Generate tracking link for a boutique
  generateTrackingLink: publicProcedure
    .input(
      z.object({
        affiliateCode: z.string().min(1, "Affiliate code is required"),
        boutiqueId: z.number().min(1, "Boutique ID is required"),
        source: z.string().optional().default("direct_link"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Find affiliate link by code
        const affiliate = await db.query.affiliateLinks.findFirst({
          where: eq(affiliateLinks.affiliateCode, input.affiliateCode),
        });

        if (!affiliate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Affiliate code not found",
          });
        }

        // Check if boutique exists and has premium tier
        const boutique = await db.query.boutiques.findFirst({
          where: eq(boutiques.id, input.boutiqueId),
        });

        if (!boutique) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Boutique not found",
          });
        }

        // Generate tracking token
        const trackingToken = generateTrackingToken();

        // Create tracking record
        const result = await db
          .insert(affiliateTracking)
          .values({
            affiliateLinkId: affiliate.id,
            boutiqueId: input.boutiqueId,
            trackingToken,
            source: input.source,
            isConverted: false,
          })
          .returning();

        // Generate tracking URL with token
        const trackingUrl = `${process.env.VITE_FRONTEND_URL || "https://styleswap.co.za"}?aff=${trackingToken}`;

        return {
          success: true,
          trackingToken,
          trackingUrl,
          affiliateName: affiliate.affiliateName,
          legalNotice: AFFILIATE_LEGAL_NOTICE,
        };
      } catch (error) {
        console.error("[Affiliate] Error generating tracking link:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate tracking link",
        });
      }
    }),

  // Record clothing purchase and calculate commission
  recordClothingPurchase: publicProcedure
    .input(
      z.object({
        trackingToken: z.string().min(1, "Tracking token is required"),
        clothingPurchaseAmount: z.number().min(0.01, "Purchase amount must be greater than 0"),
        externalTransactionId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Find tracking record
        const tracking = await db.query.affiliateTracking.findFirst({
          where: eq(affiliateTracking.trackingToken, input.trackingToken),
        });

        if (!tracking) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tracking token not found",
          });
        }

        // Get affiliate link to check commission rate
        const affiliate = await db.query.affiliateLinks.findFirst({
          where: eq(affiliateLinks.id, tracking.affiliateLinkId),
        });

        if (!affiliate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Affiliate not found",
          });
        }

        // Calculate 5% commission
        const commissionRate = 5; // Always 5% for clothing purchases
        const commissionAmount = (input.clothingPurchaseAmount * commissionRate) / 100;

        // Create commission record
        const result = await db
          .insert(affiliateCommissions)
          .values({
            affiliateTrackingId: tracking.id,
            affiliateLinkId: tracking.affiliateLinkId,
            boutiqueId: tracking.boutiqueId,
            clothingPurchaseAmount: input.clothingPurchaseAmount.toString(),
            commissionAmount: commissionAmount.toString(),
            commissionRate: commissionRate.toString(),
            externalTransactionId: input.externalTransactionId,
            status: "pending",
          })
          .returning();

        // Mark tracking as converted
        await db
          .update(affiliateTracking)
          .set({
            isConverted: true,
            convertedAt: new Date(),
          })
          .where(eq(affiliateTracking.id, tracking.id));

        return {
          success: true,
          commission: result[0],
          commissionAmount,
        };
      } catch (error) {
        console.error("[Affiliate] Error recording purchase:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record purchase",
        });
      }
    }),

  // Get affiliate performance (admin dashboard)
  getAffiliateStats: protectedProcedure
    .input(
      z.object({
        affiliateId: z.number().optional(),
        status: z.enum(["pending", "approved", "paid"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Build query conditions
        const conditions = [];
        if (input.affiliateId) {
          conditions.push(eq(affiliateCommissions.affiliateLinkId, input.affiliateId));
        }
        if (input.status) {
          conditions.push(eq(affiliateCommissions.status, input.status));
        }

        // Get commissions
        const commissions = await db.query.affiliateCommissions.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
        });

        // Calculate totals
        const totalCommissions = commissions.reduce((sum, c) => {
          return sum + parseFloat(c.commissionAmount);
        }, 0);

        const pendingCommissions = commissions
          .filter((c) => c.status === "pending")
          .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

        const paidCommissions = commissions
          .filter((c) => c.status === "paid")
          .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

        return {
          success: true,
          totalCommissions,
          pendingCommissions,
          paidCommissions,
          commissionCount: commissions.length,
          commissions,
        };
      } catch (error) {
        console.error("[Affiliate] Error getting stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get affiliate stats",
        });
      }
    }),

  // Update commission status (admin only)
  updateCommissionStatus: protectedProcedure
    .input(
      z.object({
        commissionId: z.number().min(1, "Commission ID is required"),
        status: z.enum(["pending", "approved", "paid"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const result = await db
          .update(affiliateCommissions)
          .set({
            status: input.status,
            notes: input.notes,
            paidAt: input.status === "paid" ? new Date() : undefined,
          })
          .where(eq(affiliateCommissions.id, input.commissionId))
          .returning();

        return {
          success: true,
          commission: result[0],
        };
      } catch (error) {
        console.error("[Affiliate] Error updating commission:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update commission",
        });
      }
    }),
});
