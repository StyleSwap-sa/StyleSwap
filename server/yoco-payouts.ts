import { ENV } from "./_core/env";

/**
 * Yoco Payouts API Service
 * Handles transferring funds to boutique bank accounts using Yoco's Payouts API
 * 
 * Payout States:
 * - sent: Money request sent to bank (moves to paid within hours/days)
 * - paid: Payout successful (can change to unpaid up to 5 business days later if returned)
 * - unpaid: Payout failed after being successful, credit adjustment provided
 * - failed: Payout rejected immediately (usually due to incorrect bank details)
 */

export interface YocoPayoutRequest {
  amount: number; // Amount in cents (e.g., 9250 for R92.50)
  currency: string; // e.g., "ZAR"
  beneficiary: {
    name: string;
    accountNumber: string;
    bankBranchCode: string;
    bankAccountType: "cheque" | "savings" | "transmission"; // South African account types
  };
  reference?: string; // Optional reference for the payout
  metadata?: Record<string, string>;
}

export interface YocoPayoutResponse {
  id: string;
  amount: number;
  currency: string;
  status: "sent" | "paid" | "unpaid" | "failed";
  beneficiary: {
    name: string;
    accountNumber: string;
    bankBranchCode: string;
    bankAccountType: string;
  };
  reference?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
}

/**
 * Create a payout to transfer funds to a boutique's bank account
 */
export async function createPayout(
  request: YocoPayoutRequest
): Promise<YocoPayoutResponse> {
  if (!ENV.yocoSecretKey || !ENV.yocoApiBaseUrl) {
    throw new Error("Yoco credentials not configured");
  }

  try {
    console.log(`[Yoco Payouts] Creating payout for ${request.beneficiary.name}: R${(request.amount / 100).toFixed(2)}`);

    const response = await fetch(`${ENV.yocoApiBaseUrl}/payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.yocoSecretKey}`,
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        beneficiary: request.beneficiary,
        reference: request.reference,
        metadata: request.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Yoco Payouts] API error:", error);
      throw new Error(`Yoco Payouts API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`[Yoco Payouts] Payout created successfully: ${data.id}`);
    
    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      beneficiary: data.beneficiary,
      reference: data.reference,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      failureReason: data.failureReason,
    };
  } catch (error) {
    console.error("[Yoco Payouts] Error creating payout:", error);
    throw error;
  }
}

/**
 * Retrieve the status of a payout
 */
export async function getPayout(payoutId: string): Promise<YocoPayoutResponse> {
  if (!ENV.yocoSecretKey || !ENV.yocoApiBaseUrl) {
    throw new Error("Yoco credentials not configured");
  }

  try {
    console.log(`[Yoco Payouts] Retrieving payout status: ${payoutId}`);

    const response = await fetch(`${ENV.yocoApiBaseUrl}/payouts/${payoutId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.yocoSecretKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to retrieve payout: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      beneficiary: data.beneficiary,
      reference: data.reference,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      failureReason: data.failureReason,
    };
  } catch (error) {
    console.error("[Yoco Payouts] Error retrieving payout:", error);
    throw error;
  }
}

/**
 * List payouts for a merchant (requires merchant context)
 * Note: This would typically be called from a merchant dashboard context
 */
export async function listPayouts(options?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<{
  payouts: YocoPayoutResponse[];
  total: number;
}> {
  if (!ENV.yocoSecretKey || !ENV.yocoApiBaseUrl) {
    throw new Error("Yoco credentials not configured");
  }

  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.offset) params.append("offset", options.offset.toString());
    if (options?.status) params.append("status", options.status);

    const url = `${ENV.yocoApiBaseUrl}/payouts${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.yocoSecretKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to list payouts: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      payouts: data.data.map((payout: any) => ({
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        beneficiary: payout.beneficiary,
        reference: payout.reference,
        metadata: payout.metadata,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
        failureReason: payout.failureReason,
      })),
      total: data.total,
    };
  } catch (error) {
    console.error("[Yoco Payouts] Error listing payouts:", error);
    throw error;
  }
}

/**
 * Check if bank account details are valid for payouts
 * Returns true if account details are valid, false otherwise
 */
export function validateBankAccountDetails(
  accountNumber: string,
  bankBranchCode: string
): boolean {
  // South African bank account validation
  // Account number: typically 10-11 digits
  // Branch code: typically 6 digits
  
  const accountNumberValid = /^\d{10,11}$/.test(accountNumber);
  const branchCodeValid = /^\d{6}$/.test(bankBranchCode);
  
  return accountNumberValid && branchCodeValid;
}

/**
 * Format bank account type for Yoco API
 */
export function formatBankAccountType(
  accountType: string
): "cheque" | "savings" | "transmission" {
  const normalized = accountType.toLowerCase().trim();
  
  if (normalized === "cheque" || normalized === "checking") {
    return "cheque";
  } else if (normalized === "savings" || normalized === "savings account") {
    return "savings";
  } else if (normalized === "transmission" || normalized === "transmission account") {
    return "transmission";
  }
  
  // Default to savings if unknown
  return "savings";
}
