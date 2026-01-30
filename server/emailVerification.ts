import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a verification token (UUID-style)
 */
export function generateVerificationToken(): string {
  return nanoid(32);
}

/**
 * Calculate verification token expiry (24 hours from now)
 */
export function getVerificationTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

/**
 * Send verification email to boutique owner
 * Uses Manus notification API to notify the platform owner,
 * who can then manually verify the boutique
 */
export async function sendVerificationEmail(params: {
  boutiqueName: string;
  ownerEmail: string;
  ownerName: string;
  verificationCode: string;
}): Promise<boolean> {
  const { boutiqueName, ownerEmail, ownerName, verificationCode } = params;

  try {
    // Notify platform owner about new boutique signup
    const notificationSent = await notifyOwner({
      title: `New Boutique Signup: ${boutiqueName}`,
      content: `
**New Boutique Registration**

**Boutique Name:** ${boutiqueName}
**Owner Name:** ${ownerName}
**Owner Email:** ${ownerEmail}
**Verification Code:** ${verificationCode}

A new boutique has signed up and requires email verification.

**Next Steps:**
1. Verify the boutique's legitimacy
2. Contact the owner at ${ownerEmail} to provide the verification code
3. Or manually approve the boutique in the admin dashboard

**Verification Code:** ${verificationCode}
(Valid for 24 hours)
      `.trim(),
    });

    if (!notificationSent) {
      console.error("[Email Verification] Failed to send notification to owner");
      return false;
    }

    console.log(`[Email Verification] Notification sent for boutique: ${boutiqueName}`);
    return true;
  } catch (error) {
    console.error("[Email Verification] Error sending verification email:", error);
    return false;
  }
}

/**
 * Check if verification token is expired
 */
export function isTokenExpired(expiryDate: string | Date | null): boolean {
  if (!expiryDate) return true;
  
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  return expiry < new Date();
}
