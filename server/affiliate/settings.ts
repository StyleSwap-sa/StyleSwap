import { getDb } from "../db";
import {
  affiliateSettings,
  affiliateSettingsAudit,
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface AffiliateSettings {
  starterRate: number;
  growthRate: number;
  creatorRate: number;
  growthMonthlyThreshold: number;
  creatorMonthlyThreshold: number;
  retailerPackageRate: number;
  businessTimezone: string;
}

const DEFAULT_SETTINGS: AffiliateSettings = {
  starterRate: 10.0,
  growthRate: 12.5,
  creatorRate: 15.0,
  growthMonthlyThreshold: 2500.0,
  creatorMonthlyThreshold: 7500.0,
  retailerPackageRate: 5.0,
  businessTimezone: "Africa/Johannesburg",
};

/**
 * Load settings. Always returns a fully-populated object; falls back to
 * compiled defaults if the row is missing (should never happen after the
 * seed migration, but the caller should not crash if it does).
 */
export async function getAffiliateSettings(): Promise<AffiliateSettings> {
  const db = await getDb();
  if (!db) return DEFAULT_SETTINGS;

  const rows = await db
    .select()
    .from(affiliateSettings)
    .where(eq(affiliateSettings.settingKey, "default"))
    .limit(1);

  if (rows.length === 0) return DEFAULT_SETTINGS;

  const r = rows[0];
  return {
    starterRate: parseFloat(r.starterRate),
    growthRate: parseFloat(r.growthRate),
    creatorRate: parseFloat(r.creatorRate),
    growthMonthlyThreshold: parseFloat(r.growthMonthlyThreshold),
    creatorMonthlyThreshold: parseFloat(r.creatorMonthlyThreshold),
    retailerPackageRate: parseFloat(r.retailerPackageRate),
    businessTimezone: r.businessTimezone,
  };
}

const SETTING_KEYS = [
  "starterRate",
  "growthRate",
  "creatorRate",
  "growthMonthlyThreshold",
  "creatorMonthlyThreshold",
  "retailerPackageRate",
  "businessTimezone",
] as const;
type SettingKey = (typeof SETTING_KEYS)[number];

/**
 * Update settings and audit every changed field. Used only from the
 * affiliate-admin router, which is `adminProcedure`-gated. Server-side
 * validation lives in the router; this function assumes the caller has
 * already validated.
 */
export async function updateAffiliateSettings(
  patch: Partial<AffiliateSettings>,
  actorId: number
): Promise<AffiliateSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const current = await getAffiliateSettings();
  const dbPatch: Record<string, unknown> = { updatedAt: new Date(), updatedBy: actorId };
  const auditRows: Array<{ settingKey: string; previousValue: string; newValue: string; actorId: number }> = [];

  for (const key of SETTING_KEYS) {
    if (!(key in patch)) continue;
    const newVal = patch[key];
    if (newVal === undefined) continue;

    const prev = current[key];
    if (typeof newVal === "number" && typeof prev === "number" && newVal === prev) continue;
    if (typeof newVal === "string" && typeof prev === "string" && newVal === prev) continue;

    const columnMap: Record<SettingKey, keyof typeof affiliateSettings> = {
      starterRate: "starterRate",
      growthRate: "growthRate",
      creatorRate: "creatorRate",
      growthMonthlyThreshold: "growthMonthlyThreshold",
      creatorMonthlyThreshold: "creatorMonthlyThreshold",
      retailerPackageRate: "retailerPackageRate",
      businessTimezone: "businessTimezone",
    };
    dbPatch[columnMap[key] as string] = typeof newVal === "number" ? newVal.toFixed(2) : newVal;
    auditRows.push({
      settingKey: key,
      previousValue: String(prev),
      newValue: String(newVal),
      actorId,
    });
  }

  if (auditRows.length === 0) return current;

  await db.update(affiliateSettings).set(dbPatch).where(eq(affiliateSettings.settingKey, "default"));
  await db.insert(affiliateSettingsAudit).values(auditRows);
  return await getAffiliateSettings();
}

export { SETTING_KEYS, DEFAULT_SETTINGS };