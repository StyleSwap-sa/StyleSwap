import { getDb } from "../db";
import { affiliateCommissions } from "../../drizzle/schema";
import { eq, and, sql, inArray, gte, lt } from "drizzle-orm";
import { getAffiliateSettings } from "./settings";

export type AffiliateTier = "starter" | "growth" | "creator";

/**
 * Resolve the tier applicable to a purchase made at `atTimestamp`.
 *
 * §3 of the client file:
 *   - Only individual-package sales count toward thresholds.
 *   - Only successful (approved/paid) commissions count. Pending and
 *     reversed are excluded.
 *   - The purchase that crosses a threshold earns the PREVIOUS tier's rate.
 *     So this function must be called BEFORE inserting the current purchase.
 *   - Business timezone determines "current calendar month".
 */
export async function resolveTierForAffiliate(
  affiliateLinkId: number,
  atTimestamp: Date
): Promise<AffiliateTier> {
  const settings = await getAffiliateSettings();
  const db = await getDb();
  if (!db) return "starter";

  const { monthStart, monthEnd } = monthBounds(atTimestamp, settings.businessTimezone);

  const rows = await db
    .select({
      qualifyingAmountCents: affiliateCommissions.qualifyingAmountCents,
    })
    .from(affiliateCommissions)
    .where(
      and(
        eq(affiliateCommissions.affiliateLinkId, affiliateLinkId),
        eq(affiliateCommissions.purchaseCategory, "individual"),
        inArray(affiliateCommissions.status, ["approved", "paid"]),
        gte(affiliateCommissions.createdAt, monthStart.toISOString()),
        lt(affiliateCommissions.createdAt, monthEnd.toISOString())
      )
    );

  // Sum in cents to avoid float drift
  const totalCents = rows.reduce((s, r) => s + r.qualifyingAmountCents, 0);
  const totalRands = totalCents / 100;

  if (totalRands >= settings.creatorMonthlyThreshold) return "creator";
  if (totalRands >= settings.growthMonthlyThreshold) return "growth";
  return "starter";
}

/**
 * Compute the [monthStart, monthEnd) window in the given IANA timezone for
 * the calendar month containing `at`. Uses Intl to derive the offset.
 */
function monthBounds(
  at: Date,
  tz: string
): { monthStart: Date; monthEnd: Date } {
  // Derive the calendar year/month in the target tz
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(at);

  const year = parseInt(parts.find((p) => p.type === "year")!.value, 10);
  const month = parseInt(parts.find((p) => p.type === "month")!.value, 10);

  const startUtc = zonedMidnightToUtc(year, month, 1, tz);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endUtc = zonedMidnightToUtc(nextYear, nextMonth, 1, tz);

  return { monthStart: startUtc, monthEnd: endUtc };
}

/**
 * Given a calendar date in tz, return the UTC instant at which that date
 * begins in tz. Handles DST by construction via Intl.
 */
function zonedMidnightToUtc(
  year: number,
  month: number,
  day: number,
  tz: string
): Date {
  // Start with a guess at UTC midnight
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  // Ask Intl what that instant is in tz
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(guess);
  const hh = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  const mm = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
  const ss = parseInt(parts.find((p) => p.type === "second")!.value, 10);
  // Offset in ms
  const offsetMs = ((hh * 60 + mm) * 60 + ss) * 1000;
  // Subtract to get real UTC midnight in tz
  return new Date(guess.getTime() - offsetMs);
}

export { monthBounds };