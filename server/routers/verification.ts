import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import {
  boutiqueVerifications,
  boutiqueDocuments,
  socialMediaAccounts,
  sellerSalesEvidence,
  fraudFlags,
  verificationHistory,
  verificationChecks,
  chargebackRecords,
  customerComplaints,
} from "../../drizzle/schema.verification";
import { boutiques, users } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Boutique Verification Router
 * Handles verification workflows for both formal businesses and social media sellers
 */

export const verificationRouter = router({
  // ============ VERIFICATION SUBMISSION ============
  
  /**
   * Submit boutique for verification
   * Supports both formal business and social media verification
   */
  submitForVerification: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        verificationType: z.enum(["formal_business", "social_media"]),
        verificationMethod: z.enum(["documents", "social_media", "hybrid"]),
        businessName: z.string().optional(),
        businessRegistrationNumber: z.string().optional(),
        taxId: z.string().optional(),
        businessAddress: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Verify user owns the boutique
      const boutique = await db
        .select()
        .from(boutiques)
        .where(eq(boutiques.id, input.boutiqueId))
        .limit(1);

      if (!boutique.length || boutique[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized: You do not own this boutique");
      }

      // Check if already verified
      const existing = await db
        .select()
        .from(boutiqueVerifications)
        .where(eq(boutiqueVerifications.boutiqueId, input.boutiqueId))
        .limit(1);

      if (existing.length && existing[0].verificationStatus === "approved") {
        throw new Error("This boutique is already verified");
      }

      // Create verification record
      const result = await db.insert(boutiqueVerifications).values({
        boutiqueId: input.boutiqueId,
        verificationStatus: "pending",
        verificationType: input.verificationType,
        verificationMethod: input.verificationMethod,
        businessName: input.businessName,
        businessRegistrationNumber: input.businessRegistrationNumber,
        taxId: input.taxId,
        businessAddress: input.businessAddress,
        trustScore: 0,
        riskScore: 50,
      });

      // Create verification checks based on type
      const checksToCreate = getVerificationChecks(input.verificationType);
      for (const check of checksToCreate) {
        await db.insert(verificationChecks).values({
          verificationId: result[0],
          checkType: check.type,
          status: "pending",
          description: check.description,
          requirements: JSON.stringify(check.requirements),
        });
      }

      // Log to history
      await db.insert(verificationHistory).values({
        boutiqueId: input.boutiqueId,
        verificationId: result[0],
        action: "submitted",
        newStatus: "pending",
        changedBy: ctx.user.id,
        newTrustScore: 0,
        newRiskScore: 50,
      });

      return {
        verificationId: result[0],
        status: "pending",
        message: "Verification submitted successfully",
      };
    }),

  // ============ DOCUMENT MANAGEMENT ============

  /**
   * Upload verification document
   */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        verificationId: z.number(),
        documentType: z.enum([
          "government_id",
          "passport",
          "drivers_license",
          "business_license",
          "tax_registration",
          "utility_bill",
          "lease_agreement",
          "bank_statement",
          "social_media_screenshot",
          "customer_testimonial",
        ]),
        documentUrl: z.string().url(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Verify ownership
      const boutique = await db
        .select()
        .from(boutiques)
        .where(eq(boutiques.id, input.boutiqueId))
        .limit(1);

      if (!boutique.length || boutique[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Store document
      const result = await db.insert(boutiqueDocuments).values({
        boutiqueId: input.boutiqueId,
        verificationId: input.verificationId,
        documentType: input.documentType,
        documentUrl: input.documentUrl,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        verificationStatus: "pending",
      });

      return {
        documentId: result[0],
        status: "pending",
        message: "Document uploaded successfully",
      };
    }),

  // ============ SOCIAL MEDIA VERIFICATION ============

  /**
   * Link social media account for verification
   */
  linkSocialMediaAccount: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        platform: z.enum(["instagram", "tiktok", "facebook", "whatsapp", "twitter", "youtube"]),
        username: z.string(),
        accountUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Verify ownership
      const boutique = await db
        .select()
        .from(boutiques)
        .where(eq(boutiques.id, input.boutiqueId))
        .limit(1);

      if (!boutique.length || boutique[0].ownerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Check for duplicates
      const existing = await db
        .select()
        .from(socialMediaAccounts)
        .where(
          and(
            eq(socialMediaAccounts.boutiqueId, input.boutiqueId),
            eq(socialMediaAccounts.platform, input.platform)
          )
        )
        .limit(1);

      if (existing.length) {
        // Update existing
        await db
          .update(socialMediaAccounts)
          .set({
            username: input.username,
            accountUrl: input.accountUrl,
            verified: false,
          })
          .where(eq(socialMediaAccounts.id, existing[0].id));

        return { accountId: existing[0].id, status: "updated" };
      }

      // Create new
      const result = await db.insert(socialMediaAccounts).values({
        boutiqueId: input.boutiqueId,
        platform: input.platform,
        username: input.username,
        accountUrl: input.accountUrl,
        verified: false,
      });

      return { accountId: result[0], status: "created" };
    }),

  // ============ TRUST SCORE CALCULATION ============

  /**
   * Calculate trust score for a boutique
   * Weighted formula: Documents(40%) + Account Age(15%) + Transaction History(20%) + Reviews(15%) + Behavior(10%)
   */
  calculateTrustScore: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const verification = await db
        .select()
        .from(boutiqueVerifications)
        .where(eq(boutiqueVerifications.boutiqueId, input.boutiqueId))
        .limit(1);

      if (!verification.length) {
        throw new Error("Verification not found");
      }

      let trustScore = 0;

      // 1. Document Verification (40%)
      const documents = await db
        .select()
        .from(boutiqueDocuments)
        .where(eq(boutiqueDocuments.verificationId, verification[0].id));

      const verifiedDocs = documents.filter((d) => d.verificationStatus === "verified").length;
      const docScore = (verifiedDocs / Math.max(documents.length, 1)) * 40;
      trustScore += docScore;

      // 2. Account Age (15%)
      const boutique = await db
        .select()
        .from(boutiques)
        .where(eq(boutiques.id, input.boutiqueId))
        .limit(1);

      if (boutique.length) {
        const ageInDays = Math.floor(
          (Date.now() - new Date(boutique[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        const ageScore = Math.min((ageInDays / 365) * 15, 15); // Cap at 15
        trustScore += ageScore;
      }

      // 3. Social Media Presence (20%)
      const socialAccounts = await db
        .select()
        .from(socialMediaAccounts)
        .where(eq(socialMediaAccounts.boutiqueId, input.boutiqueId));

      let socialScore = 0;
      for (const account of socialAccounts) {
        // Follower score (0-10)
        const followerScore = Math.min((account.followerCount / 1000) * 5, 5);
        // Engagement score (0-5)
        const engagementScore = Math.min((account.engagementRate / 10) * 5, 5);
        // Authenticity score (0-10)
        const authScore = account.authenticityScore || 0;
        socialScore += Math.min(followerScore + engagementScore + (authScore / 10) * 10, 20);
      }
      socialScore = Math.min(socialScore / Math.max(socialAccounts.length, 1), 20);
      trustScore += socialScore;

      // 4. Customer Reviews (15%)
      // TODO: Integrate with customer reviews table when available
      // For now, assume 0
      trustScore += 0;

      // 5. Behavioral Patterns (10%)
      const fraudFlagsCount = await db
        .select()
        .from(fraudFlags)
        .where(
          and(
            eq(fraudFlags.boutiqueId, input.boutiqueId),
            eq(fraudFlags.resolved, false)
          )
        );

      const behaviorScore = Math.max(10 - fraudFlagsCount.length * 2, 0);
      trustScore += behaviorScore;

      // Update verification record
      await db
        .update(boutiqueVerifications)
        .set({ trustScore: Math.round(trustScore) })
        .where(eq(boutiqueVerifications.id, verification[0].id));

      return { trustScore: Math.round(trustScore) };
    }),

  // ============ FRAUD DETECTION ============

  /**
   * Check for fraud indicators and create flags
   */
  checkFraudIndicators: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const flags: Array<{ type: string; severity: string }> = [];

      // 1. Velocity Check - Multiple accounts from same IP/email
      // TODO: Implement IP tracking when available

      // 2. Chargeback Rate Check
      const chargebacks = await db
        .select()
        .from(chargebackRecords)
        .where(eq(chargebackRecords.boutiqueId, input.boutiqueId));

      if (chargebacks.length > 5) {
        flags.push({ type: "chargeback", severity: "high" });
        await db.insert(fraudFlags).values({
          boutiqueId: input.boutiqueId,
          flagType: "chargeback",
          severity: "high",
          description: `High chargeback rate: ${chargebacks.length} chargebacks`,
          evidenceData: JSON.stringify({ chargebackCount: chargebacks.length }),
          actionTaken: "review",
        });
      }

      // 3. Customer Complaint Check
      const complaints = await db
        .select()
        .from(customerComplaints)
        .where(eq(customerComplaints.boutiqueId, input.boutiqueId));

      const criticalComplaints = complaints.filter((c) => c.severity === "critical");
      if (criticalComplaints.length > 2) {
        flags.push({ type: "customer_complaint", severity: "high" });
        await db.insert(fraudFlags).values({
          boutiqueId: input.boutiqueId,
          flagType: "customer_complaint",
          severity: "high",
          description: `Multiple critical complaints: ${criticalComplaints.length}`,
          evidenceData: JSON.stringify({ complaintCount: criticalComplaints.length }),
          actionTaken: "review",
        });
      }

      // 4. Document Verification Check
      const verification = await db
        .select()
        .from(boutiqueVerifications)
        .where(eq(boutiqueVerifications.boutiqueId, input.boutiqueId))
        .limit(1);

      if (verification.length) {
        const documents = await db
          .select()
          .from(boutiqueDocuments)
          .where(eq(boutiqueDocuments.verificationId, verification[0].id));

        const rejectedDocs = documents.filter((d) => d.verificationStatus === "rejected");
        if (rejectedDocs.length > 0) {
          flags.push({ type: "fake_documents", severity: "critical" });
          await db.insert(fraudFlags).values({
            boutiqueId: input.boutiqueId,
            flagType: "fake_documents",
            severity: "critical",
            description: `${rejectedDocs.length} documents rejected as fraudulent`,
            evidenceData: JSON.stringify({ rejectedDocCount: rejectedDocs.length }),
            actionTaken: "suspension",
          });
        }
      }

      return { flags, count: flags.length };
    }),

  // ============ VERIFICATION STATUS ============

  /**
   * Get verification status for a boutique
   */
  getVerificationStatus: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();

      const verification = await db
        .select()
        .from(boutiqueVerifications)
        .where(eq(boutiqueVerifications.boutiqueId, input.boutiqueId))
        .limit(1);

      if (!verification.length) {
        return null;
      }

      const checks = await db
        .select()
        .from(verificationChecks)
        .where(eq(verificationChecks.verificationId, verification[0].id));

      const documents = await db
        .select()
        .from(boutiqueDocuments)
        .where(eq(boutiqueDocuments.verificationId, verification[0].id));

      const socialAccounts = await db
        .select()
        .from(socialMediaAccounts)
        .where(eq(socialMediaAccounts.boutiqueId, input.boutiqueId));

      return {
        id: verification[0].id,
        status: verification[0].verificationStatus,
        type: verification[0].verificationType,
        trustScore: verification[0].trustScore,
        riskScore: verification[0].riskScore,
        submittedAt: verification[0].submittedAt,
        approvedAt: verification[0].approvedAt,
        expiresAt: verification[0].expiresAt,
        checks: checks.map((c) => ({
          type: c.checkType,
          status: c.status,
          description: c.description,
        })),
        documents: documents.map((d) => ({
          id: d.id,
          type: d.documentType,
          status: d.verificationStatus,
          fileName: d.fileName,
        })),
        socialAccounts: socialAccounts.map((a) => ({
          platform: a.platform,
          username: a.username,
          verified: a.verified,
          followerCount: a.followerCount,
        })),
      };
    }),

  // ============ ADMIN FUNCTIONS ============

  /**
   * Get pending verifications for admin review
   */
  getPendingVerifications: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    // Check if user is admin
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized: Admin only");
    }

    const pending = await db
      .select({
        id: boutiqueVerifications.id,
        boutiqueId: boutiqueVerifications.boutiqueId,
        boutiqueName: boutiques.name,
        status: boutiqueVerifications.verificationStatus,
        type: boutiqueVerifications.verificationType,
        trustScore: boutiqueVerifications.trustScore,
        riskScore: boutiqueVerifications.riskScore,
        submittedAt: boutiqueVerifications.submittedAt,
      })
      .from(boutiqueVerifications)
      .innerJoin(boutiques, eq(boutiqueVerifications.boutiqueId, boutiques.id))
      .where(eq(boutiqueVerifications.verificationStatus, "pending"))
      .orderBy(desc(boutiqueVerifications.submittedAt));

    return pending;
  }),

  /**
   * Approve boutique verification
   */
  approveVerification: protectedProcedure
    .input(z.object({ verificationId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin only");
      }

      const verification = await db
        .select()
        .from(boutiqueVerifications)
        .where(eq(boutiqueVerifications.id, input.verificationId))
        .limit(1);

      if (!verification.length) {
        throw new Error("Verification not found");
      }

      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

      await db
        .update(boutiqueVerifications)
        .set({
          verificationStatus: "approved",
          approvedAt: now,
          expiresAt,
          reviewedBy: ctx.user.id,
        })
        .where(eq(boutiqueVerifications.id, input.verificationId));

      // Update boutique status
      await db
        .update(boutiques)
        .set({ isVerified: 1 })
        .where(eq(boutiques.id, verification[0].boutiqueId));

      // Log to history
      await db.insert(verificationHistory).values({
        boutiqueId: verification[0].boutiqueId,
        verificationId: input.verificationId,
        action: "approved",
        previousStatus: verification[0].verificationStatus,
        newStatus: "approved",
        changedBy: ctx.user.id,
        notes: input.notes,
      });

      return { status: "approved" };
    }),

  /**
   * Reject boutique verification
   */
  rejectVerification: protectedProcedure
    .input(
      z.object({
        verificationId: z.number(),
        reason: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin only");
      }

      const verification = await db
        .select()
        .from(boutiqueVerifications)
        .where(eq(boutiqueVerifications.id, input.verificationId))
        .limit(1);

      if (!verification.length) {
        throw new Error("Verification not found");
      }

      await db
        .update(boutiqueVerifications)
        .set({
          verificationStatus: "rejected",
          rejectedAt: new Date().toISOString(),
          rejectionReason: input.reason,
          adminNotes: input.notes,
          reviewedBy: ctx.user.id,
        })
        .where(eq(boutiqueVerifications.id, input.verificationId));

      // Log to history
      await db.insert(verificationHistory).values({
        boutiqueId: verification[0].boutiqueId,
        verificationId: input.verificationId,
        action: "rejected",
        previousStatus: verification[0].verificationStatus,
        newStatus: "rejected",
        changedBy: ctx.user.id,
        notes: input.notes,
      });

      return { status: "rejected" };
    }),
});

/**
 * Helper function to get verification checks based on verification type
 */
function getVerificationChecks(
  verificationType: "formal_business" | "social_media"
): Array<{
  type: string;
  description: string;
  requirements: Record<string, unknown>;
}> {
  if (verificationType === "formal_business") {
    return [
      {
        type: "identity_verification",
        description: "Verify business owner identity",
        requirements: {
          documents: ["government_id", "passport", "drivers_license"],
          minAge: 18,
        },
      },
      {
        type: "business_registration",
        description: "Verify business is registered and active",
        requirements: {
          documents: ["business_license", "tax_registration"],
        },
      },
      {
        type: "address_verification",
        description: "Verify business address",
        requirements: {
          documents: ["utility_bill", "lease_agreement"],
        },
      },
      {
        type: "bank_account_verification",
        description: "Verify bank account for payouts",
        requirements: {
          documents: ["bank_statement"],
        },
      },
    ];
  } else {
    return [
      {
        type: "identity_verification",
        description: "Verify seller identity",
        requirements: {
          documents: ["government_id", "passport", "drivers_license"],
        },
      },
      {
        type: "social_media_authenticity",
        description: "Verify social media accounts are authentic",
        requirements: {
          minFollowers: 100,
          minAccountAge: 90, // days
        },
      },
      {
        type: "sales_history",
        description: "Verify sales history and customer transactions",
        requirements: {
          documents: ["customer_dm", "order_screenshot", "payment_proof"],
        },
      },
      {
        type: "customer_feedback",
        description: "Verify positive customer feedback",
        requirements: {
          minReviews: 5,
          minRating: 4.0,
        },
      },
    ];
  }
}
