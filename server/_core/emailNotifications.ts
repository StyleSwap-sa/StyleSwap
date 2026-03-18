import { notifyOwner } from "./notification";

/**
 * Email Notification Service
 * Handles sending email notifications for API alerts
 */

export interface AlertNotification {
  type: "error_rate" | "rate_limit" | "response_time";
  threshold: number;
  currentValue: number;
  apiKeyName: string;
  timestamp: Date;
  recipientEmail: string;
}

/**
 * Send alert notification email
 */
export async function sendAlertNotification(
  alert: AlertNotification
): Promise<boolean> {
  try {
    const alertTypeLabels: Record<string, string> = {
      error_rate: "Error Rate Alert",
      rate_limit: "Rate Limit Alert",
      response_time: "Response Time Alert",
    };

    const alertTypeMessages: Record<string, string> = {
      error_rate: `Your API error rate has exceeded ${alert.threshold}% (current: ${alert.currentValue.toFixed(1)}%)`,
      rate_limit: `Your API is approaching the rate limit (${alert.currentValue}% of limit used)`,
      response_time: `Your API response time has exceeded ${alert.threshold}ms (current: ${alert.currentValue}ms)`,
    };

    const title = `${alertTypeLabels[alert.type]} - ${alert.apiKeyName}`;
    const content = `
${alertTypeMessages[alert.type]}

API Key: ${alert.apiKeyName}
Time: ${alert.timestamp.toISOString()}
Recipient: ${alert.recipientEmail}

Please review your API usage in the Developer Portal and take appropriate action.
    `.trim();

    // Use the built-in notification system to notify the owner
    const success = await notifyOwner({ title, content });

    if (success) {
      console.log(`[Email Notifications] Alert sent for ${alert.apiKeyName}`);
    } else {
      console.warn(
        `[Email Notifications] Failed to send alert for ${alert.apiKeyName}`
      );
    }

    return success;
  } catch (error) {
    console.error("[Email Notifications] Error sending alert:", error);
    return false;
  }
}

/**
 * Send batch alert notifications
 */
export async function sendBatchAlertNotifications(
  alerts: AlertNotification[]
): Promise<number> {
  let successCount = 0;

  for (const alert of alerts) {
    const success = await sendAlertNotification(alert);
    if (success) {
      successCount++;
    }
  }

  return successCount;
}

/**
 * Send daily usage summary email
 */
export async function sendDailyUsageSummary(
  apiKeyName: string,
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitedRequests: number;
    averageResponseTime: number;
    successRate: number;
  }
): Promise<boolean> {
  try {
    const title = `Daily API Usage Summary - ${apiKeyName}`;
    const content = `
API Usage Summary for ${apiKeyName}

Total Requests: ${stats.totalRequests}
Successful Requests: ${stats.successfulRequests}
Failed Requests: ${stats.failedRequests}
Rate Limited Requests: ${stats.rateLimitedRequests}
Success Rate: ${stats.successRate}%
Average Response Time: ${stats.averageResponseTime}ms

Date: ${new Date().toISOString().slice(0, 10)}

Review detailed analytics in your Developer Portal.
    `.trim();

    return await notifyOwner({ title, content });
  } catch (error) {
    console.error("[Email Notifications] Error sending summary:", error);
    return false;
  }
}

/**
 * Send quota warning email
 */
export async function sendQuotaWarning(
  apiKeyName: string,
  quotaUsage: number,
  quotaLimit: number,
  period: "daily" | "monthly"
): Promise<boolean> {
  try {
    const percentageUsed = Math.round((quotaUsage / quotaLimit) * 100);
    const title = `Quota Warning - ${apiKeyName}`;
    const content = `
Your ${period} API quota is running low.

API Key: ${apiKeyName}
Usage: ${quotaUsage} / ${quotaLimit} requests (${percentageUsed}%)
Period: ${period}

Once you reach your quota limit, additional requests will be rejected with a 429 status code.

Upgrade your plan or contact support to increase your quota.
    `.trim();

    return await notifyOwner({ title, content });
  } catch (error) {
    console.error("[Email Notifications] Error sending quota warning:", error);
    return false;
  }
}
