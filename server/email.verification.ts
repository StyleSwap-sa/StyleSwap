import { randomBytes } from 'crypto';
import { getDb } from './db';
import { boutiques, type Boutique } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';

/**
 * Generate a verification token for email verification
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Send verification email to boutique owner
 */
export async function sendVerificationEmail(
  boutiqueName: string,
  ownerEmail: string,
  verificationToken: string,
  boutiqueName_slug: string
): Promise<boolean> {
  try {
    const verificationUrl = `${process.env.VITE_FRONTEND_URL || 'https://fitroom-ai-research.manus.space'}/verify-boutique/${verificationToken}`;
    
    // Send verification email using notifyOwner
    const result = await notifyOwner({
      title: `Verify Your Boutique - ${boutiqueName}`,
      content: `
Hello,

Thank you for registering your boutique "${boutiqueName}" on StyleSwap!

To complete your registration and start using the virtual try-on feature, please verify your email by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
StyleSwap Team
      `,
    });

    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

/**
 * Create verification token for a boutique
 */
export async function createVerificationToken(boutiqueId: number): Promise<string> {
  const token = generateVerificationToken();
  const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db
    .update(boutiques)
    .set({
      verificationToken: token,
      verificationTokenExpiry: expiryTime,
    })
    .where(eq(boutiques.id, boutiqueId));

  return token;
}

/**
 * Verify boutique email using token
 */
export async function verifyBoutiqueEmail(token: string): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Find boutique with this token
    const result = await db.select().from(boutiques).where(eq(boutiques.verificationToken, token)).limit(1);
    const boutique = result.length > 0 ? result[0] : undefined;

    if (!boutique) {
      return { success: false, message: 'Invalid verification token' };
    }

    // Check if token has expired
    if (boutique.verificationTokenExpiry && new Date() > boutique.verificationTokenExpiry) {
      return { success: false, message: 'Verification token has expired' };
    }

    // Mark boutique as verified
    await db
      .update(boutiques)
      .set({
        isVerified: 1,
        verificationToken: null,
        verificationTokenExpiry: null,
      })
      .where(eq(boutiques.id, boutique.id));

    return { success: true, message: 'Boutique email verified successfully' };
  } catch (error) {
    console.error('Error verifying boutique email:', error);
    return { success: false, message: 'Error verifying email' };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(boutiqueId: number): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const result = await db.select().from(boutiques).where(eq(boutiques.id, boutiqueId)).limit(1);
    const boutique = result.length > 0 ? result[0] : undefined;

    if (!boutique) {
      return { success: false, message: 'Boutique not found' };
    }

    if (boutique.isVerified) {
      return { success: false, message: 'Boutique is already verified' };
    }

    // Generate new token
    const token = await createVerificationToken(boutiqueId);

    // For now, send to the owner's email (we'll need to fetch the user separately)
    // TODO: Fetch user email from users table using ownerId
    const emailSent = await sendVerificationEmail(
      boutique.name,
      '', // Email will be fetched from users table
      token,
      boutique.slug
    );

    if (emailSent) {
      return { success: true, message: 'Verification email sent successfully' };
    } else {
      return { success: false, message: 'Failed to send verification email' };
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { success: false, message: 'Error resending verification email' };
  }
}
