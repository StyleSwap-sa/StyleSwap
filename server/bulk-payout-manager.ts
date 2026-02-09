import { getDb } from "./db";
import { payouts, boutiques, payoutAuditLog, users } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { createPayout } from "./yoco-payouts";
import Decimal from "decimal.js";
import { handlePayoutStatusUpdate } from "./payout-notifications";

export interface BulkPayoutJob {
  jobId: string;
  createdAt: Date;
  createdBy: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalPayouts: number;
  successCount: number;
  failureCount: number;
  totalAmount: string;
  results: BulkPayoutResult[];
}

export interface BulkPayoutResult {
  payoutId: string;
  boutiqueId: string;
  boutiqueName: string;
  amount: string;
  status: "success" | "failed";
  yocoPayoutId?: string;
  error?: string;
  processedAt: Date;
}

/**
 * Get all failed payouts for recovery
 */
export async function getFailedPayouts(limit: number = 100) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Bulk Payout Manager] Database not available");
      return null;
    }

    const failedPayouts = await db
      .select({
        payout: payouts,
        boutique: boutiques,
        owner: users,
      })
      .from(payouts)
      .innerJoin(boutiques, eq(payouts.boutiqueId, boutiques.id))
      .innerJoin(users, eq(boutiques.ownerId, users.id))
      .where(eq(payouts.status, "failed"))
      .orderBy(desc(payouts.createdAt))
      .limit(limit);

    return failedPayouts.map((item) => ({
      payoutId: item.payout.id,
      boutiqueId: item.payout.boutiqueId,
      boutiqueName: item.boutique.name,
      ownerEmail: item.owner.email,
      amount: item.payout.amount,
      failureReason: item.payout.notes,
      createdAt: item.payout.createdAt,
      failedAt: item.payout.updatedAt,
    }));
  } catch (error) {
    console.error("[Bulk Payout Manager] Error fetching failed payouts:", error);
    return null;
  }
}

/**
 * Get pending payouts waiting to be processed
 */
export async function getPendingPayouts(limit: number = 100) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Bulk Payout Manager] Database not available");
      return null;
    }

    const pendingPayouts = await db
      .select({
        payout: payouts,
        boutique: boutiques,
        owner: users,
      })
      .from(payouts)
      .innerJoin(boutiques, eq(payouts.boutiqueId, boutiques.id))
      .innerJoin(users, eq(boutiques.ownerId, users.id))
      .where(eq(payouts.status, "pending"))
      .orderBy(desc(payouts.createdAt))
      .limit(limit);

    return pendingPayouts.map((item) => ({
      payoutId: item.payout.id,
      boutiqueId: item.payout.boutiqueId,
      boutiqueName: item.boutique.name,
      ownerEmail: item.owner.email,
      amount: item.payout.amount,
      createdAt: item.payout.createdAt,
    }));
  } catch (error) {
    console.error("[Bulk Payout Manager] Error fetching pending payouts:", error);
    return null;
  }
}

/**
 * Retry failed payouts
 */
export async function retryFailedPayouts(payoutIds: string[], adminId: string): Promise<BulkPayoutJob> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const results: BulkPayoutResult[] = [];
  let successCount = 0;
  let failureCount = 0;
  let totalAmount = new Decimal(0);

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    console.log(`[Bulk Payout Manager] Starting retry job ${jobId} for ${payoutIds.length} payouts`);

    for (const payoutId of payoutIds) {
      try {
        // Get payout details
        const payoutRecord = await db
          .select()
          .from(payouts)
          .where(eq(payouts.id, payoutId))
          .limit(1);

        if (payoutRecord.length === 0) {
          results.push({
            payoutId,
            boutiqueId: "",
            boutiqueName: "Unknown",
            amount: "0.00",
            status: "failed",
            error: "Payout not found",
            processedAt: new Date(),
          });
          failureCount++;
          continue;
        }

        const payout = payoutRecord[0];

        // Get boutique details
        const boutiqueRecord = await db
          .select()
          .from(boutiques)
          .where(eq(boutiques.id, payout.boutiqueId))
          .limit(1);

        if (boutiqueRecord.length === 0) {
          results.push({
            payoutId,
            boutiqueId: payout.boutiqueId,
            boutiqueName: "Unknown",
            amount: payout.amount,
            status: "failed",
            error: "Boutique not found",
            processedAt: new Date(),
          });
          failureCount++;
          continue;
        }

        const boutique = boutiqueRecord[0];

        // Attempt to create payout with Yoco
        const yocoResult = await createPayout({
          amount: parseFloat(payout.amount) * 100, // Convert to cents
          currency: "ZAR",
          beneficiary: {
            name: boutique.name,
            accountNumber: payout.bankAccountNumber || "",
            bankBranchCode: payout.bankBranchCode || "",
            bankAccountType: (payout.bankAccountType as "cheque" | "savings" | "transmission") || "cheque",
          },
          reference: `Retry-${payoutId.slice(0, 8)}`,
          metadata: {
            payoutId,
            boutiqueId: payout.boutiqueId,
            jobId,
            retryAttempt: "true",
          },
        });

        if (!yocoResult || !yocoResult.id) {
          results.push({
            payoutId,
            boutiqueId: payout.boutiqueId,
            boutiqueName: boutique.name,
            amount: payout.amount,
            status: "failed",
            error: "Failed to create payout with Yoco",
            processedAt: new Date(),
          });
          failureCount++;
          continue;
        }

        // Update payout with Yoco ID and status
        await db
          .update(payouts)
          .set({
            yocoPayoutId: yocoResult.id,
            status: "processing",
            updatedAt: new Date(),
          })
          .where(eq(payouts.id, payoutId));

        // Log the retry attempt
        await db.insert(payoutAuditLog).values({
          payoutId,
          action: "payout_retry_by_admin",
          oldStatus: "failed",
          newStatus: "processing",
          actorId: adminId,
          actorType: "admin",
          details: JSON.stringify({
            jobId,
            yocoPayoutId: yocoResult.id,
            retriedAt: new Date().toISOString(),
          }),
        });

        results.push({
          payoutId,
          boutiqueId: payout.boutiqueId,
          boutiqueName: boutique.name,
          amount: payout.amount,
          status: "success",
          yocoPayoutId: yocoResult.id,
          processedAt: new Date(),
        });

        successCount++;
        totalAmount = totalAmount.plus(payout.amount);

        console.log(`[Bulk Payout Manager] Successfully retried payout ${payoutId}`);
      } catch (error) {
        console.error(`[Bulk Payout Manager] Error retrying payout ${payoutId}:`, error);
        results.push({
          payoutId,
          boutiqueId: "",
          boutiqueName: "Unknown",
          amount: "0.00",
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          processedAt: new Date(),
        });
        failureCount++;
      }
    }

    console.log(
      `[Bulk Payout Manager] Completed job ${jobId}: ${successCount} success, ${failureCount} failed`
    );

    return {
      jobId,
      createdAt: new Date(),
      createdBy: adminId,
      status: failureCount === 0 ? "completed" : "completed",
      totalPayouts: payoutIds.length,
      successCount,
      failureCount,
      totalAmount: totalAmount.toFixed(2),
      results,
    };
  } catch (error) {
    console.error("[Bulk Payout Manager] Error in bulk retry job:", error);
    return {
      jobId,
      createdAt: new Date(),
      createdBy: adminId,
      status: "failed",
      totalPayouts: payoutIds.length,
      successCount,
      failureCount,
      totalAmount: totalAmount.toFixed(2),
      results,
    };
  }
}

/**
 * Process all pending payouts
 */
export async function processPendingPayouts(adminId: string): Promise<BulkPayoutJob> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Get all pending payouts
    const pendingPayouts = await db
      .select()
      .from(payouts)
      .where(eq(payouts.status, "pending"));

    const payoutIds = pendingPayouts.map((p) => p.id);

    if (payoutIds.length === 0) {
      return {
        jobId: `job_${Date.now()}`,
        createdAt: new Date(),
        createdBy: adminId,
        status: "completed",
        totalPayouts: 0,
        successCount: 0,
        failureCount: 0,
        totalAmount: "0.00",
        results: [],
      };
    }

    // Retry all pending payouts
    return await retryFailedPayouts(payoutIds, adminId);
  } catch (error) {
    console.error("[Bulk Payout Manager] Error processing pending payouts:", error);
    return {
      jobId: `job_${Date.now()}`,
      createdAt: new Date(),
      createdBy: adminId,
      status: "failed",
      totalPayouts: 0,
      successCount: 0,
      failureCount: 0,
      totalAmount: "0.00",
      results: [],
    };
  }
}

/**
 * Get payout statistics for admin dashboard
 */
export async function getPayoutStatistics() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Bulk Payout Manager] Database not available");
      return null;
    }

    const allPayouts = await db.select().from(payouts);

    const stats = {
      total: allPayouts.length,
      pending: allPayouts.filter((p) => p.status === "pending").length,
      processing: allPayouts.filter((p) => p.status === "processing").length,
      completed: allPayouts.filter((p) => p.status === "completed").length,
      failed: allPayouts.filter((p) => p.status === "failed").length,
      totalAmount: new Decimal(0),
      completedAmount: new Decimal(0),
      failedAmount: new Decimal(0),
    };

    allPayouts.forEach((payout) => {
      const amount = new Decimal(payout.amount);
      stats.totalAmount = stats.totalAmount.plus(amount);

      if (payout.status === "completed") {
        stats.completedAmount = stats.completedAmount.plus(amount);
      } else if (payout.status === "failed") {
        stats.failedAmount = stats.failedAmount.plus(amount);
      }
    });

    return {
      ...stats,
      totalAmount: stats.totalAmount.toFixed(2),
      completedAmount: stats.completedAmount.toFixed(2),
      failedAmount: stats.failedAmount.toFixed(2),
    };
  } catch (error) {
    console.error("[Bulk Payout Manager] Error fetching payout statistics:", error);
    return null;
  }
}
