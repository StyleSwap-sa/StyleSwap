import axios from 'axios';
import { getDb } from './db';
import { boutiques, boutiqueTransactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { updateBoutiqueCredits, addBoutiqueCredit } from './db.boutiques';

const YOCO_API_URL = process.env.YOCO_API_URL || 'https://api.yoco.com/v1';
const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
const YOCO_PUBLIC_KEY = process.env.YOCO_PUBLIC_KEY;

if (!YOCO_SECRET_KEY) {
  console.warn('[Yoco] Secret key not configured');
}

/**
 * Create a Yoco charge for credit purchase
 */
export async function createYocoCharge(options: {
  amount: number; // Amount in cents (e.g., 38500 for R385.00)
  currency: string; // e.g., 'ZAR'
  description: string;
  metadata?: Record<string, string>;
  token: string; // Yoco token from frontend
}): Promise<{ success: boolean; chargeId?: string; error?: string }> {
  try {
    if (!YOCO_SECRET_KEY) {
      return { success: false, error: 'Yoco API key not configured' };
    }

    const response = await axios.post(
      `${YOCO_API_URL}/charges`,
      {
        amount: options.amount,
        currency: options.currency,
        description: options.description,
        metadata: options.metadata,
        token: options.token,
      },
      {
        auth: {
          username: YOCO_SECRET_KEY,
          password: '',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.id) {
      return { success: true, chargeId: response.data.id };
    } else {
      return { success: false, error: 'Failed to create charge' };
    }
  } catch (error: any) {
    console.error('[Yoco] Error creating charge:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

/**
 * Process credit purchase after successful payment
 */
export async function processCreditPurchase(options: {
  boutiqueId: number;
  chargeId: string;
  amount: number; // Amount in cents
  credits: number;
  paymentMethod: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Verify boutique exists
    const boutique = await db.select().from(boutiques).where(eq(boutiques.id, options.boutiqueId)).limit(1);
    if (boutique.length === 0) {
      return { success: false, message: 'Boutique not found' };
    }

    // Add credits to boutique
    await addBoutiqueCredit(options.boutiqueId, options.credits);

    // Record transaction
    await db.insert(boutiqueTransactions).values({
      boutiqueId: options.boutiqueId,
      transaction_type: 'purchase',
      amount: (options.amount / 100).toString(), // Convert cents to rand for storage
      status: 'completed',
    });

    return { success: true, message: 'Credits purchased successfully' };
  } catch (error: any) {
    console.error('[Yoco] Error processing credit purchase:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Get Yoco public key for frontend
 */
export function getYocoPublicKey(): string {
  return YOCO_PUBLIC_KEY || '';
}

/**
 * Verify Yoco webhook signature
 */
export function verifyYocoWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return hash === signature;
}

/**
 * Handle Yoco webhook event
 */
export async function handleYocoWebhookEvent(event: any): Promise<void> {
  try {
    if (event.type === 'charge.succeeded') {
      const { id, metadata } = event.data;
      
      if (metadata?.boutiqueId && metadata?.credits) {
        await processCreditPurchase({
          boutiqueId: parseInt(metadata.boutiqueId),
          chargeId: id,
          amount: event.data.amount,
          credits: parseInt(metadata.credits),
          paymentMethod: event.data.payment_method || 'card',
        });
      }
    } else if (event.type === 'charge.failed') {
      console.log('[Yoco] Charge failed:', event.data.id);
      // Handle failed charge - could send notification to boutique owner
    }
  } catch (error) {
    console.error('[Yoco] Error handling webhook event:', error);
  }
}
