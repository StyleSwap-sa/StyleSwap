import { appRegistrations } from "../drizzle/schema";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";
import { generateAdminNotificationHtml } from "./app-registration-notifications";
import crypto from "crypto";

/**
 * Generate secure API key and secret
 */
export function generateApiCredentials() {
  const apiKey = `sk_${crypto.randomBytes(24).toString("hex")}`;
  const apiSecret = crypto.randomBytes(32).toString("hex");
  return { apiKey, apiSecret };
}

/**
 * Register a new app and generate API credentials
 */
export async function registerApp(data: {
  appName: string;
  companyName: string;
  email: string;
  website: string;
  platformType: string;
  description: string;
}) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Generate API credentials
    const { apiKey, apiSecret } = generateApiCredentials();

    // Create app registration in database
    const result = await db
      .insert(appRegistrations)
      .values({
        appName: data.appName,
        companyName: data.companyName,
        email: data.email,
        website: data.website,
        platformType: data.platformType,
        description: data.description,
        apiKey,
        apiSecret,
        status: "active",
        isLiveMode: false,
      })
      .returning();

    const registration = result[0];

    // Send admin notification with detailed HTML
    const adminHtml = generateAdminNotificationHtml({
      appName: data.appName,
      companyName: data.companyName,
      email: data.email,
      website: data.website,
      platformType: data.platformType,
      description: data.description,
      apiKey,
      registrationTime: new Date().toISOString(),
    });

    await notifyOwner({
      title: "🎉 New App Registration - " + data.appName,
      content: adminHtml,
    });

    return {
      success: true,
      registration: {
        id: registration.id,
        appName: registration.appName,
        email: registration.email,
        apiKey: registration.apiKey,
        apiSecret: registration.apiSecret,
        status: registration.status,
        createdAt: registration.createdAt,
      },
    };
  } catch (error) {
    console.error("[App Registration] Error:", error);
    throw new Error("Failed to register application");
  }
}

/**
 * Get app registration by API key
 */
export async function getAppByApiKey(apiKey: string) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(appRegistrations)
      .where((table) => table.apiKey === apiKey)
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[App Registration] Error fetching app:", error);
    return null;
  }
}

/**
 * Update app request count
 */
export async function updateAppRequestCount(appId: number) {
  try {
    const db = await getDb();
    if (!db) return;

    await db
      .update(appRegistrations)
      .set({
        requestsCount: (table) => table.requestsCount + 1,
        lastRequestAt: new Date().toISOString(),
      })
      .where((table) => table.id === appId);
  } catch (error) {
    console.error("[App Registration] Error updating request count:", error);
  }
}

/**
 * Suspend app registration
 */
export async function suspendApp(appId: number, reason: string) {
  try {
    const db = await getDb();
    if (!db) return;

    await db
      .update(appRegistrations)
      .set({ status: "suspended" })
      .where((table) => table.id === appId);

    // Notify admin
    await notifyOwner({
      title: "⚠️ App Suspended - ID " + appId,
      content: `<p>App ID <strong>${appId}</strong> has been suspended.</p><p><strong>Reason:</strong> ${reason}</p>`,
    });
  } catch (error) {
    console.error("[App Registration] Error suspending app:", error);
  }
}

/**
 * Revoke app registration
 */
export async function revokeApp(appId: number, reason: string) {
  try {
    const db = await getDb();
    if (!db) return;

    await db
      .update(appRegistrations)
      .set({ status: "revoked" })
      .where((table) => table.id === appId);

    // Notify admin
    await notifyOwner({
      title: "🚫 App Revoked - ID " + appId,
      content: `<p>App ID <strong>${appId}</strong> has been revoked.</p><p><strong>Reason:</strong> ${reason}</p>`,
    });
  } catch (error) {
    console.error("[App Registration] Error revoking app:", error);
  }
}
