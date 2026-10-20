import { getDb } from "../db";
import {
  affiliateCommissions,
  affiliatePayoutBatches,
  affiliateLinks,
} from "../../drizzle/schema";
import { eq, and, isNull, inArray, gte, lte, sql } from "drizzle-orm";

/**
 * Generate a payout batch for one affiliate for a [start, end] period.
 * Includes all `approved` commissions for that affiliate created within
 * the period. Links each included commission to the new batch via
 * `payout_batch_id` so `markPayoutBatchPaid` can flip them atomically.
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

  const start = new Date(periodStart + "T00:00:00Z");
  const end = new Date(periodEnd + "T23:59:59.999Z");

  return await db.transaction(async (tx) => {
    // 1. Find approved commissions in the period that are NOT already in a batch
    const rows = await tx
      .select({
        id: affiliateCommissions.id,
        amount: affiliateCommissions.commissionAmountCents,
      })
      .from(affiliateCommissions)
      .where(
        and(
          eq(affiliateCommissions.affiliateLinkId, affiliateLinkId),
          eq(affiliateCommissions.status, "approved"),
          isNull(affiliateCommissions.payoutBatchId),     // ← NEW: not already batched
          gte(affiliateCommissions.createdAt, start.toISOString()),
          lte(affiliateCommissions.createdAt, end.toISOString())
        )
      );

    if (rows.length === 0) return null;

    const total = rows.reduce((s, r) => s + r.amount, 0);

    // 2. Check for an existing batch for this affiliate+period
    const existing = await tx
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

    // 3. Create the batch
    const inserted = await tx
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

    const batchId = inserted[0].id;

    // 4. LINK each commission to the batch (this is the step that was missing)
    const ids = rows.map((r) => r.id);
    await tx
      .update(affiliateCommissions)
      .set({ payoutBatchId: batchId })
      .where(inArray(affiliateCommissions.id, ids));

    return { batchId };
  });
}

/**
 * Mark a batch paid. Flips all linked commissions from approved → paid
 * and sets paidAt. Atomic.
 */
export async function markPayoutBatchPaid(
  batchId: number,
  actorId: number
): Promise<{ paidCount: number; totalAmountCents: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.transaction(async (tx) => {
    const batch = await tx
      .select()
      .from(affiliatePayoutBatches)
      .where(eq(affiliatePayoutBatches.id, batchId))
      .limit(1);
    if (batch.length === 0) throw new Error(`Payout batch ${batchId} not found`);
    if (batch[0].status === "paid") {
      return { paidCount: 0, totalAmountCents: batch[0].totalAmountCents };
    }

    // Now this matches the linked commissions (they were linked at generate time)
    const affected = await tx
      .update(affiliateCommissions)
      .set({
        status: "paid",
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(affiliateCommissions.payoutBatchId, batchId),
          eq(affiliateCommissions.status, "approved")
        )
      )
      .returning({ id: affiliateCommissions.id });

    await tx
      .update(affiliatePayoutBatches)
      .set({
        status: "paid",
        markedPaidAt: new Date().toISOString(),
        markedPaidBy: actorId,
      })
      .where(eq(affiliatePayoutBatches.id, batchId));

    return { paidCount: affected.length, totalAmountCents: batch[0].totalAmountCents };
  });
}