import { getDb } from '../db';
import { boutiqueVerifications } from '../../drizzle/schema';
import { lt, eq } from 'drizzle-orm';
import { notifyOwner } from '../_core/notification';
import { sendEmail } from './verificationEmailService';

/**
 * Verification Reminder Service
 * Automatically sends re-verification reminders at 60, 30, and 7 days before expiry
 */

interface ReminderConfig {
  daysBeforeExpiry: number;
  emailType: 'verification_expiring_60' | 'verification_expiring_30' | 'verification_expiring_7';
  reminderType: 'first' | 'second' | 'final';
}

const REMINDER_CONFIGS: ReminderConfig[] = [
  {
    daysBeforeExpiry: 60,
    emailType: 'verification_expiring_60',
    reminderType: 'first',
  },
  {
    daysBeforeExpiry: 30,
    emailType: 'verification_expiring_30',
    reminderType: 'second',
  },
  {
    daysBeforeExpiry: 7,
    emailType: 'verification_expiring_7',
    reminderType: 'final',
  },
];

/**
 * Check for boutiques needing re-verification reminders
 * Should be called daily via cron job
 */
export async function checkAndSendVerificationReminders() {
  try {
    const db = getDb();

    for (const config of REMINDER_CONFIGS) {
      // Calculate the date range for this reminder
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + config.daysBeforeExpiry);

      const startDate = new Date(reminderDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(reminderDate);
      endDate.setHours(23, 59, 59, 999);

      // Find boutiques expiring in this window
      const boutiquesToRemind = await db.query.boutiqueVerifications.findMany({
        where: (fields) => ({
          status: eq(fields.status, 'approved'),
          expiresAt: lt(fields.expiresAt, endDate.toISOString()),
          // Check that it hasn't already been reminded
          reminderSentAt: null,
        }),
        with: {
          boutique: true,
        },
      });

      console.log(
        `[Verification Reminders] Found ${boutiquesToRemind.length} boutiques for ${config.reminderType} reminder`
      );

      // Send reminders
      for (const verification of boutiquesToRemind) {
        await sendVerificationReminder(verification, config);
      }
    }
  } catch (error) {
    console.error('[Verification Reminders] Error checking for reminders:', error);
    await notifyOwner({
      title: 'Verification Reminder Service Error',
      content: `Failed to send verification reminders: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

/**
 * Send individual verification reminder
 */
async function sendVerificationReminder(
  verification: any,
  config: ReminderConfig
) {
  try {
    const db = getDb();
    const boutique = verification.boutique;

    // Calculate days until expiry
    const expiryDate = new Date(verification.expiresAt);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Send email to boutique
    const emailContent = generateReminderEmail(
      boutique.name,
      daysUntilExpiry,
      config.reminderType,
      verification.id
    );

    await sendEmail({
      to: boutique.email,
      subject: `Your StyleSwap Verification Expires in ${daysUntilExpiry} Days`,
      type: config.emailType,
      data: {
        boutiqueName: boutique.name,
        daysUntilExpiry,
        expiryDate: expiryDate.toLocaleDateString(),
        renewalLink: `https://styleswap.com/dashboard/verification/${verification.id}/renew`,
      },
    });

    // Update reminder sent timestamp
    await db
      .update(boutiqueVerifications)
      .set({
        reminderSentAt: new Date().toISOString(),
      })
      .where(eq(boutiqueVerifications.id, verification.id));

    console.log(
      `[Verification Reminders] Sent ${config.reminderType} reminder to ${boutique.name}`
    );

    // Notify platform owner
    await notifyOwner({
      title: `Verification Reminder Sent: ${boutique.name}`,
      content: `${config.reminderType} reminder sent. Verification expires in ${daysUntilExpiry} days.`,
    });
  } catch (error) {
    console.error('[Verification Reminders] Error sending reminder:', error);
    throw error;
  }
}

/**
 * Generate reminder email content
 */
function generateReminderEmail(
  boutiqueName: string,
  daysUntilExpiry: number,
  reminderType: string,
  verificationId: number
): string {
  const urgency = {
    first: 'You have plenty of time to prepare',
    second: 'Please start the renewal process soon',
    final: 'This is your final reminder before expiry',
  };

  return `
Dear ${boutiqueName},

Your StyleSwap boutique verification will expire in ${daysUntilExpiry} days.

${urgency[reminderType as keyof typeof urgency]}

To renew your verification and continue selling on StyleSwap:
1. Log in to your boutique dashboard
2. Go to Settings → Verification
3. Click "Renew Verification"
4. Follow the verification steps

Renewal Link: https://styleswap.com/dashboard/verification/${verificationId}/renew

If you have any questions, contact our support team at support@styleswap.com

Best regards,
The StyleSwap Team
`;
}

/**
 * Handle expired verifications
 * Should be called daily via cron job
 */
export async function handleExpiredVerifications() {
  try {
    const db = getDb();

    // Find expired verifications
    const expiredVerifications = await db.query.boutiqueVerifications.findMany({
      where: (fields) => ({
        status: eq(fields.status, 'approved'),
        expiresAt: lt(fields.expiresAt, new Date().toISOString()),
      }),
      with: {
        boutique: true,
      },
    });

    console.log(
      `[Verification Reminders] Found ${expiredVerifications.length} expired verifications`
    );

    // Suspend expired verifications
    for (const verification of expiredVerifications) {
      await suspendExpiredVerification(verification);
    }
  } catch (error) {
    console.error('[Verification Reminders] Error handling expired verifications:', error);
    await notifyOwner({
      title: 'Expired Verification Handler Error',
      content: `Failed to handle expired verifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

/**
 * Suspend an expired verification
 */
async function suspendExpiredVerification(verification: any) {
  try {
    const db = getDb();
    const boutique = verification.boutique;

    // Update verification status to expired
    await db
      .update(boutiqueVerifications)
      .set({
        status: 'expired',
        suspendedAt: new Date().toISOString(),
      })
      .where(eq(boutiqueVerifications.id, verification.id));

    // Send expiry notification to boutique
    await sendEmail({
      to: boutique.email,
      subject: 'Your StyleSwap Verification Has Expired',
      type: 'verification_expired',
      data: {
        boutiqueName: boutique.name,
        renewalLink: `https://styleswap.com/dashboard/verification/${verification.id}/renew`,
      },
    });

    // Notify platform owner
    await notifyOwner({
      title: `Verification Expired: ${boutique.name}`,
      content: `${boutique.name}'s verification has expired and been suspended. They need to renew to continue selling.`,
    });

    console.log(`[Verification Reminders] Suspended verification for ${boutique.name}`);
  } catch (error) {
    console.error('[Verification Reminders] Error suspending verification:', error);
    throw error;
  }
}

/**
 * Reactivate suspended verification after renewal
 */
export async function reactivateVerification(verificationId: number, newTrustScore: number) {
  try {
    const db = getDb();

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Update verification
    await db
      .update(boutiqueVerifications)
      .set({
        status: 'approved',
        approvedAt: new Date().toISOString(),
        expiresAt: expiryDate.toISOString(),
        trustScore: newTrustScore,
        suspendedAt: null,
        reminderSentAt: null,
      })
      .where(eq(boutiqueVerifications.id, verificationId));

    console.log(`[Verification Reminders] Reactivated verification ${verificationId}`);
  } catch (error) {
    console.error('[Verification Reminders] Error reactivating verification:', error);
    throw error;
  }
}

/**
 * Get verification status for boutique
 */
export async function getVerificationStatus(boutiqueId: number) {
  try {
    const db = getDb();

    const verification = await db.query.boutiqueVerifications.findFirst({
      where: (fields) => eq(fields.boutiqueId, boutiqueId),
    });

    if (!verification) {
      return {
        status: 'not_started',
        daysUntilExpiry: null,
        needsRenewal: false,
      };
    }

    const expiryDate = new Date(verification.expiresAt || '');
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      status: verification.status,
      daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
      needsRenewal: daysUntilExpiry <= 0,
      expiryDate: expiryDate.toISOString(),
      trustScore: verification.trustScore,
    };
  } catch (error) {
    console.error('[Verification Reminders] Error getting verification status:', error);
    throw error;
  }
}

/**
 * Schedule verification reminder checks
 * Add this to your cron job scheduler
 */
export function scheduleVerificationReminders() {
  // Run daily at 2 AM
  console.log('[Verification Reminders] Scheduled daily checks at 2 AM');

  // For development/testing, you can also run manually:
  // await checkAndSendVerificationReminders();
  // await handleExpiredVerifications();
}
