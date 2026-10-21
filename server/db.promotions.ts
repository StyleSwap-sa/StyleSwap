import { and, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import {
  promotions,
  promotionAwards,
  userCredits,
  transactions,
} from "../drizzle/schema";
// Type-only import: avoids a runtime cycle with ./db (which calls this module).
import type { getDb } from "./db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export type DbTx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Stable identifier. Never change it: award history hangs off this row. */
export const LAUNCH_PROMOTION_KEY = "global_launch_first_250";
export const LAUNCH_PROMOTION_LEDGER_REASON = "promo:global_launch_first_250";

/**
 * Claim a launch-promotion slot for a brand-new user and grant the credits.
 *
 * MUST be called inside a transaction (ideally a savepoint, so a failure here
 * rolls back the slot claim without failing the signup itself).
 *
 * Atomicity comes from ONE conditional UPDATE on the promotions row:
 *   - Postgres row-locks it, so concurrent signups queue up and each gets a
 *     distinct slot number (awardedCount after increment).
 *   - The WHERE clause re-evaluates after the lock is released, so the cap can
 *     never be exceeded.
 * The award insert then relies on UNIQUE("promotionId","userId") and
 * UNIQUE("promotionId","slotNumber"). If it throws, the whole savepoint
 * (counter increment included) rolls back.
 *
 * Returns the award, or null if the user did not qualify (disabled, not yet
 * activated, account older than activation, cap reached).
 */
export async function claimLaunchPromotionAward(
  tx: DbTx,
  user: { id: number; createdAt: string }
): Promise<{ slot: number; credits: number } | null> {
  const claimed = await tx
    .update(promotions)
    .set({
      awardedCount: sql`${promotions.awardedCount} + 1`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(
      and(
        eq(promotions.promotionKey, LAUNCH_PROMOTION_KEY),
        eq(promotions.enabled, true),
        isNotNull(promotions.activatedAt),
        gt(promotions.creditsPerUser, 0),
        sql`${promotions.awardedCount} < ${promotions.recipientLimit}`,
        // Account must have been created at/after the recorded activation.
        sql`${promotions.activatedAt} <= ${user.createdAt}::timestamp`
      )
    )
    .returning({
      id: promotions.id,
      slot: promotions.awardedCount,
      credits: promotions.creditsPerUser,
    });

  if (claimed.length === 0) return null;
  const { id: promotionId, slot, credits } = claimed[0];

  // No ON CONFLICT here on purpose: a duplicate must throw so the counter
  // increment above is rolled back with it.
  await tx.insert(promotionAwards).values({
    promotionId,
    userId: user.id,
    slotNumber: slot,
    creditsAwarded: credits,
  });

  // Same pattern as grantApprovalBonus(): lock latest usercredits row, else insert.
  const existing = await tx
    .select({ id: userCredits.id })
    .from(userCredits)
    .where(eq(userCredits.userId, user.id))
    .orderBy(desc(userCredits.id))
    .limit(1)
    .for("update");

  if (existing.length === 0) {
    await tx.insert(userCredits).values({
      userId: user.id,
      totalCredits: credits,
      usedCredits: 0,
      remainingCredits: credits,
    });
  } else {
    await tx
      .update(userCredits)
      .set({
        totalCredits: sql`${userCredits.totalCredits} + ${credits}`,
        remainingCredits: sql`${userCredits.remainingCredits} + ${credits}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(userCredits.id, existing[0].id));
  }

  // Ledger entry in the existing transactions table.
  await tx.insert(transactions).values({
    userId: user.id,
    amount: credits,
    status: "completed",
    reason: LAUNCH_PROMOTION_LEDGER_REASON,
  });

  return { slot, credits };
}
