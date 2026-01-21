import { ENV } from "./_core/env";
import { getDb } from "./db";
import { users, userCredits, transactions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface PaymentPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  currency: string;
  description: string;
}

export const PAYMENT_PACKAGES: PaymentPackage[] = [
  // Individual Plans
  {
    id: "pkg_10_credits",
    name: "10 Try-Ons",
    credits: 10,
    price: 4500, // R45
    currency: "ZAR",
    description: "10 virtual try-on credits valid for 30 days",
  },
  {
    id: "pkg_20_credits",
    name: "20 Try-Ons",
    credits: 20,
    price: 8000, // R80
    currency: "ZAR",
    description: "20 virtual try-on credits valid for 30 days",
  },
  {
    id: "pkg_50_credits",
    name: "50 Try-Ons",
    credits: 50,
    price: 15000, // R150
    currency: "ZAR",
    description: "50 virtual try-on credits valid for 30 days",
  },
  // Business Plans
  {
    id: "pkg_100_credits",
    name: "100 Try-Ons",
    credits: 100,
    price: 38500, // R385
    currency: "ZAR",
    description: "100 virtual try-on credits valid for 30 days",
  },
  {
    id: "pkg_200_credits",
    name: "200 Try-Ons",
    credits: 200,
    price: 75000, // R750
    currency: "ZAR",
    description: "200 virtual try-on credits valid for 30 days",
  },
  {
    id: "pkg_500_credits",
    name: "500 Try-Ons",
    credits: 500,
    price: 135000, // R1350
    currency: "ZAR",
    description: "500 virtual try-on credits valid for 30 days",
  },
  {
    id: "pkg_1000_credits",
    name: "1000 Try-Ons",
    credits: 1000,
    price: 220000, // R2200
    currency: "ZAR",
    description: "1000 virtual try-on credits valid for 30 days",
  },
  {
    id: "pkg_5000_credits",
    name: "5000 Try-Ons",
    credits: 5000,
    price: 625000, // R6250
    currency: "ZAR",
    description: "5000 virtual try-on credits valid for 30 days",
  },
  {
    id: "pkg_20000_credits",
    name: "20000 Try-Ons",
    credits: 20000,
    price: 1860000, // R18600
    currency: "ZAR",
    description: "20000 virtual try-on credits valid for 30 days",
  },
];

export interface CreatePaymentIntentRequest {
  userId: number;
  packageId: string;
  userEmail: string;
  userName: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentIntentResponse {
  id: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: string;
  checkoutUrl?: string;
  metadata: {
    userId: string;
    packageId: string;
    credits: number;
  };
}

/**
 * Create a payment intent with Yoko
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> {
  const pkg = PAYMENT_PACKAGES.find((p) => p.id === request.packageId);
  if (!pkg) {
    throw new Error(`Package not found: ${request.packageId}`);
  }

  if (!ENV.yocoSecretKey || !ENV.yocoApiBaseUrl) {
    throw new Error("Yoco credentials not configured");
  }

  try {
    const response = await fetch(`${ENV.yocoApiBaseUrl}/api/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ENV.yocoSecretKey}`,
      },
      body: JSON.stringify({
        amount: pkg.price,
        currency: pkg.currency,
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        metadata: {
          userId: request.userId.toString(),
          packageId: request.packageId,
          credits: pkg.credits,
          userName: request.userName,
          userEmail: request.userEmail,
        },
        clientReferenceId: `${request.userId}-${request.packageId}-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Yoko API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      clientSecret: "", // Yoco doesn't use client secrets
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      checkoutUrl: data.redirectUrl, // Yoco returns redirectUrl
      metadata: data.metadata,
    };
  } catch (error) {
    console.error("[Yoko Payment] Error creating payment intent:", error);
    throw error;
  }
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PaymentIntentResponse> {
  if (!ENV.yocoSecretKey || !ENV.yocoApiBaseUrl) {
    throw new Error("Yoco credentials not configured");
  }

  try {
    const response = await fetch(
      `${ENV.yocoApiBaseUrl}/payment_intents/${paymentIntentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.yocoSecretKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to retrieve payment intent: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      id: data.id,
      clientSecret: data.client_secret,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error("[Yoko Payment] Error retrieving payment intent:", error);
    throw error;
  }
}

/**
 * Handle successful payment
 */
export async function handlePaymentSuccess(
  paymentIntentId: string,
  metadata: { userId: string; packageId: string; credits: number }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const userId = parseInt(metadata.userId, 10);
  const credits = metadata.credits;

  try {
    // Get existing user credits
    const existingCredits = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Credits valid for 30 days

    if (existingCredits.length === 0) {
      // Create new credit record
      await db.insert(userCredits).values({
        userId,
        totalCredits: credits,
        usedCredits: 0,
        remainingCredits: credits,
        expiresAt,
      });
    } else {
      // Update existing credit record
      const current = existingCredits[0];
      const newTotal = current.totalCredits + credits;
      const newRemaining = current.remainingCredits + credits;

      await db
        .update(userCredits)
        .set({
          totalCredits: newTotal,
          remainingCredits: newRemaining,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));
    }

    // Record transaction
    await db.insert(transactions).values({
      userId,
      type: "purchase",
      amount: credits,
      description: `Purchased ${credits} try-on credits`,
      fitRoomOrderId: paymentIntentId,
      status: "completed",
      currency: "ZAR",
    });

    console.log(
      `[Yoko Payment] Payment successful. User ${userId} received ${credits} credits`
    );
  } catch (error) {
    console.error("[Yoko Payment] Error handling payment success:", error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!ENV.yocoSecretKey) {
    console.error("[Yoko Payment] Yoko secret key not configured");
    return false;
  }

  // Yoko uses HMAC-SHA256 for webhook signatures
  // The signature header format is typically: t=timestamp,v1=signature
  try {
    // For now, we'll do basic validation
    // In production, implement proper HMAC-SHA256 verification
    return !!(signature && signature.length > 0);
  } catch (error) {
    console.error("[Yoko Payment] Error verifying webhook signature:", error);
    return false;
  }
}

/**
 * Get payment package by ID
 */
export function getPaymentPackage(packageId: string): PaymentPackage | undefined {
  return PAYMENT_PACKAGES.find((p) => p.id === packageId);
}

/**
 * Get all available payment packages
 */
export function getAllPaymentPackages(): PaymentPackage[] {
  return PAYMENT_PACKAGES;
}
