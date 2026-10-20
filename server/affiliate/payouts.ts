import { getDb } from "../db";
import {
  affiliateCommissions,
  affiliatePayoutBatches,
  affiliateLinks,
} from "../../drizzle/schema";
import { eq, and, inArray, gte, lte, sql } from "drizzle-orm";

/**
 * Generate a payout batch for one affiliate for a [start, end] period.
 * All `approved` commissions for that affiliate created within the period
 * are included. Returns the batch id, or null if no commissions.
 *
 * Idempotent via UNIQUE (affiliate_link_id, period_start, period_end).
 */
export async function generatePayoutBatch(
  affiliateLinkId: number,
  periodStart: string,   // YYYY-MM-DD
  periodEnd: string      // YYYY-MM-DD
): Promise<{ batchId: number } | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const start = new Date(periodStart + "T00:00:00Z").toISOString();
  const end = new Date(periodEnd + "T23:59:59.999Z").toISOString();

  const rows = await db
    .select({
      id: affiliateCommissions.id,
      amount: affiliateCommissions.commissionAmountCents,
    })
    .from(affiliateCommissions)
    .where(
      and(
        eq(affiliateCommissions.affiliateLinkId, affiliateLinkId),
        eq(affiliateCommissions.status, "approved"),
        gte(affiliateCommissions.createdAt, start),
        lte(affiliateCommissions.createdAt, end)
      )
    );

  if (rows.length === 0) return null;

  const total = rows.reduce((s, r) => s + r.amount, 0);

  const existing = await db
    .select({ id: affiliatePayoutBatches.id })
    .from(affiliatePayoutBatches)
    .where(
      and(
        eq(affiliatePayoutBatches.affiliateLinkId, affiliateLinkId),
        eq(affiliatePayoutBatches.periodStart, periodStart),
        eq(affiliatePayoutBatches.periodEnd, periodEnd)
      )
    )
    .limit(1);
  if (existing.length > 0) return { batchId: existing[0].id };

  const inserted = await db
    .insert(affiliatePayoutBatches)
    .values({
      affiliateLinkId,
      periodStart,
      periodEnd,
      totalAmountCents: total,
      commissionCount: rows.length,
      status: "pending",
    })
    .returning({ id: affiliatePayoutBatches.id });

  return { batchId: inserted[0].id };
}

/**
 * Mark a batch paid. Flips all included commissions from approved → paid
 * and sets paidAt + payout_batch_id. Atomic.
 */
export async function markPayoutBatchPaid(
  batchId: number,
  actorId: number
): Promise<{ paidCount: number; totalAmountCents: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const batch = await db
    .select()
    .from(affiliatePayoutBatches)
    .where(eq(affiliatePayoutBatches.id, batchId))
    .limit(1);
  if (batch.length === 0) throw new Error(`Payout batch ${batchId} not found`);
  if (batch[0].status === "paid") {
    return { paidCount: 0, totalAmountCents: batch[0].totalAmountCents };
  }

  const affected = await db
    .update(affiliateCommissions)
    .set({
      status: "paid",
      paidAt: new Date().toISOString(),
      payoutBatchId: batchId,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(affiliateCommissions.payoutBatchId, batchId),
        eq(affiliateCommissions.status, "approved")
      )
    )
    .returning({ id: affiliateCommissions.id });

  await db
    .update(affiliatePayoutBatches)
    .set({
      status: "paid",
      markedPaidAt: new Date().toISOString(),
      markedPaidBy: actorId,
    })
    .where(eq(affiliatePayoutBatches.id, batchId));

  return { paidCount: affected.length, totalAmountCents: batch[0].totalAmountCents };
}