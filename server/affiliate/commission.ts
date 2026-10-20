import { getDb } from "../db";
import { and, eq } from "drizzle-orm";
import { affiliateCommissions } from "../../drizzle/schema";
import { getAffiliateSettings } from "./settings";
import { resolveTierForAffiliate, AffiliateTier } from "./tier";
import {
  verifyPackage,
  PackageCategory,
  ClassifiedPackage,
} from "./package-classification";

export interface CommissionInput {
  userId: number;                       // referred customer
  affiliateLinkId: number;
  attributionId: number;
  packageId: string;                    // canonical PAYMENT_PACKAGES[].id
  purchaseCategory: PackageCategory;    // caller-asserted; verified below
  amountCents: number;                  // from Yoco payload.amount
  currency: string;
  sourceType: string;                   // 'yoco_credit_purchase'
  sourceId: string;                     // Yoco checkout id
  eventTimestamp: Date;
}

export interface CommissionResult {
  commissionId: number;
  appliedRate: number;
  commissionAmountCents: number;
  tier: AffiliateTier | null;
  alreadyExisted: boolean;
}

/**
 * Central commission calculation & recording.
 *
 * Rules enforced structurally (not by convention):
 *   - exactly ONE commission per purchase (UNIQUE source_type, source_id)
 *   - business → flat rate, tier=null, excluded from tier calc
 *   - individual → tiered rate, tier frozen on the row
 *   - rate never stacks: single if/else, not two independent lookups
 */
export async function calculateAndRecordCommission(
  input: CommissionInput
): Promise<CommissionResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Verify package against canonical list. Throws on any mismatch.
  const pkg: ClassifiedPackage = verifyPackage(
    input.packageId,
    input.purchaseCategory,
    input.amountCents
  );

  // 2. Determine rate. Single if/else — cannot stack.
  const settings = await getAffiliateSettings();
  let appliedRate: number;
  let tier: AffiliateTier | null;

  if (pkg.category === "business") {
    appliedRate = settings.retailerPackageRate;
    tier = null;
  } else {
    tier = await resolveTierForAffiliate(input.affiliateLinkId, input.eventTimestamp);
    appliedRate =
      tier === "creator" ? settings.creatorRate :
      tier === "growth"  ? settings.growthRate  :
                            settings.starterRate;
  }

  // 3. Amount in integer cents. Half-up.
  const commissionAmountCents = Math.round((input.amountCents * appliedRate) / 100);

  // 4. Freeze calculation details.
  const calculationDetails = {
    rulesVersion: 1,
    packageId: pkg.id,
    packageName: pkg.name,
    purchaseCategory: pkg.category,
    amountCents: input.amountCents,
    currency: input.currency,
    appliedRate,
    tier,
    settingsSnapshot: settings,
    calculatedAt: new Date().toISOString(),
  };

  // 5. Insert idempotently. UNIQUE (source_type, source_id) is the backstop.
  const insertResult = await db
    .insert(affiliateCommissions)
    .values({
      affiliateLinkId: input.affiliateLinkId,
      customerUserId: input.userId,
      attributionId: input.attributionId,
      packageId: pkg.id,
      packageCredits: pkg.credits,
      purchaseCategory: pkg.category,
      qualifyingAmountCents: input.amountCents,
      currency: input.currency,
      appliedRate: appliedRate.toFixed(2),
      commissionAmountCents,
      tier,
      status: "pending",
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      calculationDetails,
    })
    .onConflictDoNothing({
      target: [affiliateCommissions.sourceType, affiliateCommissions.sourceId],
    })
    .returning({ id: affiliateCommissions.id });

  if (insertResult.length === 0) {
    // Duplicate delivery — return the existing record without modifying it.
    const existing = await db
      .select({ id: affiliateCommissions.id })
      .from(affiliateCommissions)
      .where(
        and(
          eq(affiliateCommissions.sourceType, input.sourceType),
          eq(affiliateCommissions.sourceId, input.sourceId)
        )
      )
      .limit(1);
    return {
      commissionId: existing[0]?.id ?? 0,
      appliedRate,
      commissionAmountCents,
      tier,
      alreadyExisted: true,
    };
  }

  const id = insertResult[0].id;

  // 6. pending → approved in the same transaction as the caller. The caller
  //    (webhook hook) wraps everything in db.transaction; we flip here so
  //    approvedAt is set atomically with insert.
  await db
    .update(affiliateCommissions)
    .set({ status: "approved", approvedAt: new Date().toISOString() })
    .where(
      (await import("drizzle-orm")).and(
        (await import("drizzle-orm")).eq(affiliateCommissions.id, id),
        (await import("drizzle-orm")).eq(affiliateCommissions.status, "pending")
      )
    );

  return {
    commissionId: id,
    appliedRate,
    commissionAmountCents,
    tier,
    alreadyExisted: false,
  };
}