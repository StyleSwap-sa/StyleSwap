import { getDb } from "./db";
import { boutiqueCredits, emailNotifications } from "../drizzle/schema";
import { sendCreditAlertEmail } from "./email";

interface AlertConfig {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  sendTime: string; // HH:mm format, e.g., "09:00"
  thresholds: {
    critical: number; // 80%
    warning: number; // 50%
    notice: number; // 20%
    info: number; // 10%
  };
}

const DEFAULT_CONFIG: AlertConfig = {
  enabled: true,
  frequency: "daily",
  sendTime: "09:00",
  thresholds: {
    critical: 80,
    warning: 50,
    notice: 20,
    info: 10,
  },
};

interface BoutiqueAlertStatus {
  boutiqueId: number;
  boutiqueName: string;
  email: string;
  usagePercentage: number;
  remainingCredits: number;
  totalCredits: number;
  alertLevel: "critical" | "warning" | "notice" | "info" | null;
  lastAlertSent: Date | null;
  optedOut: boolean;
}

/**
 * Get all boutiques that need alerts
 */
export async function getBoutiquesNeedingAlerts(
  config: AlertConfig = DEFAULT_CONFIG
): Promise<BoutiqueAlertStatus[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    // Get all boutique credits
    const allBoutiqueCredits = await db
      .select()
      .from(boutiqueCredits);

    return allBoutiqueCredits
      .map((bc: any) => {
        const usagePercentage = Math.round(
          ((bc.totalCredits - bc.remainingCredits) / bc.totalCredits) * 100
        );

        let alertLevel: "critical" | "warning" | "notice" | "info" | null = null;

        if (usagePercentage >= config.thresholds.critical) {
          alertLevel = "critical";
        } else if (usagePercentage >= config.thresholds.warning) {
          alertLevel = "warning";
        } else if (usagePercentage >= config.thresholds.notice) {
          alertLevel = "notice";
        } else if (usagePercentage >= config.thresholds.info) {
          alertLevel = "info";
        }

        return {
          boutiqueId: bc.id,
          boutiqueName: bc.name || "Unknown",
          email: bc.ownerEmail || "unknown@example.com",
          usagePercentage,
          remainingCredits: bc.remainingCredits,
          totalCredits: bc.totalCredits,
          alertLevel,
          lastAlertSent: null,
          optedOut: false,
        };
      })
      .filter((status: any) => status.alertLevel !== null);
  } catch (error) {
    console.error("[Alert Scheduler] Error getting boutiques needing alerts:", error);
    return [];
  }
}

/**
 * Send alerts to boutiques at risk
 */
export async function sendAlertsToAtRiskBoutiques(
  config: AlertConfig = DEFAULT_CONFIG
): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  const stats = { sent: 0, failed: 0, skipped: 0 };

  try {
    const db = await getDb();
    const boutiquesNeedingAlerts = await getBoutiquesNeedingAlerts(config);

    for (const boutique of boutiquesNeedingAlerts) {
      try {
        // Check if boutique has opted out
        if (boutique.optedOut) {
          stats.skipped++;
          continue;
        }

        // Send alert email
        const emailSent = await sendCreditAlertEmail(
          boutique.boutiqueId,
          boutique.boutiqueName,
          boutique.email,
          boutique.boutiqueName,
          boutique.usagePercentage,
          boutique.remainingCredits,
          boutique.totalCredits,
          boutique.alertLevel as any
        );

        if (emailSent) {
          stats.sent++;

          // Log the notification
          if (db) {
            await db.insert(emailNotifications).values({
              type: "promotional",
              userId: boutique.boutiqueId,
              recipientEmail: boutique.email,
              subject: `Credit Alert: ${boutique.alertLevel?.toUpperCase()} - ${boutique.usagePercentage}% Usage`,
              status: "sent",
              sentAt: new Date(),
            });
          }
        } else {
          stats.failed++;
        }
      } catch (error) {
        console.error(
          `[Alert Scheduler] Error sending alert to boutique ${boutique.boutiqueId}:`,
          error
        );
        stats.failed++;
      }
    }

    console.log("[Alert Scheduler] Alert sending completed:", stats);
    return stats;
  } catch (error) {
    console.error("[Alert Scheduler] Error in sendAlertsToAtRiskBoutiques:", error);
    return stats;
  }
}

/**
 * Check if it's time to send alerts based on schedule
 */
export function shouldSendAlertsNow(config: AlertConfig = DEFAULT_CONFIG): boolean {
  if (!config.enabled) {
    return false;
  }

  const now = new Date();
  const [hour, minute] = config.sendTime.split(":").map(Number);
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);

  // Allow 5-minute window for sending
  const fiveMinutesInMs = 5 * 60 * 1000;
  const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());

  return timeDiff < fiveMinutesInMs;
}

/**
 * Get scheduler configuration
 */
export function getSchedulerConfig(): AlertConfig {
  return DEFAULT_CONFIG;
}

/**
 * Update scheduler configuration
 */
export function updateSchedulerConfig(config: Partial<AlertConfig>): AlertConfig {
  return { ...DEFAULT_CONFIG, ...config };
}

/**
 * Get alert statistics
 */
export async function getAlertStatistics() {
  try {
    const boutiquesNeedingAlerts = await getBoutiquesNeedingAlerts();

    const stats = {
      totalBoutiques: boutiquesNeedingAlerts.length,
      critical: boutiquesNeedingAlerts.filter((b: any) => b.alertLevel === "critical").length,
      warning: boutiquesNeedingAlerts.filter((b: any) => b.alertLevel === "warning").length,
      notice: boutiquesNeedingAlerts.filter((b: any) => b.alertLevel === "notice").length,
      info: boutiquesNeedingAlerts.filter((b: any) => b.alertLevel === "info").length,
    };

    return stats;
  } catch (error) {
    console.error("[Alert Scheduler] Error getting alert statistics:", error);
    return {
      totalBoutiques: 0,
      critical: 0,
      warning: 0,
      notice: 0,
      info: 0,
    };
  }
}

/**
 * Initialize alert scheduler (to be called on server startup)
 */
export function initializeAlertScheduler() {
  console.log("[Alert Scheduler] Initializing alert scheduler...");

  // Set up daily check (runs at 9:00 AM)
  const config = getSchedulerConfig();

  // In production, this would use a proper job queue like Bull or Agenda
  // For now, we'll just log that it's initialized
  console.log(`[Alert Scheduler] Configured for ${config.frequency} alerts at ${config.sendTime}`);

  return {
    config,
    status: "initialized",
  };
}
