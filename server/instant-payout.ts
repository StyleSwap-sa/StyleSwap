import { getDb } from "./db";
import { payouts, boutiqueBankAccounts, payoutAuditLog } from "../drizzle/schema";
import { createPayout, YocoPayoutResponse } from "./yoco-payouts";
import Decimal from "decimal.js";
import { TRPCError } from "@trpc/server";

/**
 * Instant Payout Configuration
 * Yoco charges 1% fee for instant payouts (up to R10,000)
 * Delivery: Within minutes (typically 5-30 minutes)
 */
const INSTANT_PAYOUT_CONFIG = {
  maxAmount: 10000, // R10,000
  fee: 0.01, // 1%
  minAmount: 100, // R100 minimum
};

interface InstantPayoutRequest {
  boutiqueId: string;
  amount: number; // Amount to request (before fees)
  requestedBy: string; // User ID requesting the payout
}

interface InstantPayoutResult {
  success: boolean;
  payoutId?: string;
  amount?: string;
  fee?: string;
  netAmount?: string;
  error?: string;
}

/**
 * Validate instant payout request
 */
function validateInstantPayoutRequest(amount: number): { valid: boolean; error?: string } {
  if (amount < INSTANT_PAYOUT_CONFIG.minAmount) {
    return {
      valid: false,
      error: `Minimum instant payout amount is R${INSTANT_PAYOUT_CONFIG.minAmount}`,
    };
  }

  if (amount > INSTANT_PAYOUT_CONFIG.maxAmount) {
    return {
      valid: false,
      error: `Maximum instant payout amount is R${INSTANT_PAYOUT_CONFIG.maxAmount}`,
    };
  }

  return { valid: true };
}

/**
 * Calculate instant payout amounts
 */
function calculateInstantPayoutAmounts(amount: number) {
  const requestAmount = new Decimal(amount);
  const fee = requestAmount.times(INSTANT_PAYOUT_CONFIG.fee);
  const netAmount = requestAmount.minus(fee);

  return {
    requestAmount: requestAmount.toString(),
    fee: fee.toFixed(2),
    netAmount: netAmount.toFixed(2),
  };
}

/**
 * Request instant payout for boutique
 */
export async function requestInstantPayout(request: InstantPayoutRequest): Promise<InstantPayoutResult> {
  try {
    const { boutiqueId, amount, requestedBy } = request;

    // Validate request
    const validation = validateInstantPayoutRequest(amount);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    // Get boutique bank account
    const bankAccounts = await db
      .select()
      .from(boutiqueBankAccounts)
      .where(eq(boutiqueBankAccounts.boutiqueId, boutiqueId))
      .limit(1);

    if (bankAccounts.length === 0) {
      return { success: false, error: "No bank account registered for this boutique" };
    }

    const bankAccount = bankAccounts[0];

    // Verify bank account is verified
    if (!bankAccount.isVerified) {
      return { success: false, error: "Bank account must be verified before requesting instant payout" };
    }

    // Calculate amounts
    const { requestAmount, fee, netAmount } = calculateInstantPayoutAmounts(amount);

    // Create payout record
    const payoutId = crypto.randomUUID();
    const now = new Date();

    await db.insert(payouts).values({
      id: payoutId,
      boutiqueId,
      amount: netAmount, // Net amount after fees
      status: "pending",
      payoutType: "instant", // Mark as instant payout
      createdAt: now,
      updatedAt: now,
      notes: `Instant payout requested by user ${requestedBy}. Gross amount: R${requestAmount}, Fee: R${fee}`,
    });

    // Log the request
    await db.insert(payoutAuditLog).values({
      payout_id: payoutId,
      action: "instant_payout_requested",
      details: JSON.stringify({
        requestedAmount: requestAmount,
        fee,
        netAmount,
        bankAccountId: bankAccount.id,
        actorId: requestedBy,
        actorType: "boutique_owner",
      }),
    });

    // Create Yoco payout
    const yocoResult = await createPayout({
      amount: parseFloat(netAmount) * 100, // Convert to cents
      currency: "ZAR",
      beneficiary: {
        name: bankAccount.accountHolder,
        accountNumber: bankAccount.accountNumber,
        bankBranchCode: bankAccount.branchCode,
        bankAccountType: bankAccount.accountType as "cheque" | "savings" | "transmission",
      },
      reference: `InstantPayout-${payoutId.slice(0, 8)}`,
      metadata: {
        payoutId,
        boutiqueId,
        isInstant: "true",
      },
    });

    if (!yocoResult || !yocoResult.id) {
      // Update payout status to failed
      await db
        .update(payouts)
        .set({
          status: "failed",
          notes: `Instant payout creation failed: ${yocoResult.error}`,
        })
        .where(eq(payouts.id, payoutId));

      return {
        success: false,
        error: "Failed to create payout with Yoco",
      };
    }

    // Update payout with Yoco ID
    await db
      .update(payouts)
      .set({
        yocoPayoutId: yocoResult.id,
        status: "processing",
      })
      .where(eq(payouts.id, payoutId));

    console.log(`[Instant Payout] Created instant payout ${payoutId} for boutique ${boutiqueId}`);
    console.log(`[Instant Payout] Amount: R${netAmount}, Fee: R${fee}, Gross: R${requestAmount}`);

    return {
      success: true,
      payoutId,
      amount: requestAmount.toString(),
      fee,
      netAmount,
    };
  } catch (error) {
    console.error("[Instant Payout] Error requesting instant payout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to request instant payout",
    };
  }
}

/**
 * Get instant payout eligibility for boutique
 */
export async function getInstantPayoutEligibility(boutiqueId: string) {
  try {
    const db = await getDb();
    if (!db) {
      return { eligible: false, reason: "Database not available" };
    }

    // Check if boutique has verified bank account
    const bankAccounts = await db
      .select()
      .from(boutiqueBankAccounts)
      .where(eq(boutiqueBankAccounts.boutiqueId, boutiqueId))
      .limit(1);

    if (bankAccounts.length === 0) {
      return {
        eligible: false,
        reason: "No bank account registered",
        maxAmount: INSTANT_PAYOUT_CONFIG.maxAmount,
        fee: `${INSTANT_PAYOUT_CONFIG.fee * 100}%`,
      };
    }

    const bankAccount = bankAccounts[0];

    if (!bankAccount.isVerified) {
      return {
        eligible: false,
        reason: "Bank account not verified",
        maxAmount: INSTANT_PAYOUT_CONFIG.maxAmount,
        fee: `${INSTANT_PAYOUT_CONFIG.fee * 100}%`,
      };
    }

    return {
      eligible: true,
      maxAmount: INSTANT_PAYOUT_CONFIG.maxAmount,
      minAmount: INSTANT_PAYOUT_CONFIG.minAmount,
      fee: `${INSTANT_PAYOUT_CONFIG.fee * 100}%`,
      estimatedDelivery: "5-30 minutes",
      bankAccountLastFour: bankAccount.accountNumber.slice(-4),
    };
  } catch (error) {
    console.error("[Instant Payout] Error checking eligibility:", error);
    return { eligible: false, reason: "Error checking eligibility" };
  }
}

import { eq } from "drizzle-orm";
import crypto from "crypto";
