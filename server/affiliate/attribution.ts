import { getDb } from "../db";
import {
  affiliateAttributions,
  affiliateLinks,
  affiliateTracking,
  users,
} from "../../drizzle/schema";
import { eq, and, gte, desc, sql, lt } from "drizzle-orm";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * If the customer does not yet have an attribution and the checkout carried
 * an affiliate slug, attempt to link them. A link is created ONLY if:
 *   - an approved affiliate with that slug exists
 *   - a tracking click exists for that affiliate
 *   - that click occurred within 90 days of the customer's registration
 * If any condition fails, no attribution is created. This is the "customer
 * must register within 90 days of clicking" rule from §4.
 */
export async function tryCreateAttribution(
  userId: number,
  affiliateSlug: string | undefined
): Promise<{ attributionId: number } | null> {
  if (!affiliateSlug) return null;

  const db = await getDb();
  if (!db) return null;

  // Existing attribution? Then nothing to do (already linked to someone).
  const existing = await db
    .select({ id: affiliateAttributions.id })
    .from(affiliateAttributions)
    .where(eq(affiliateAttributions.userId, userId))
    .limit(1);
  if (existing.length > 0) return { attributionId: existing[0].id };

  // Approved affiliate with this slug?
  const links = await db
    .select({ id: affiliateLinks.id })
    .from(affiliateLinks)
    .where(
      and(
        eq(affiliateLinks.referralSlug, affiliateSlug),
        eq(affiliateLinks.status, "approved")
      )
    )
    .limit(1);
  if (links.length === 0) return null;
  const affiliateLinkId = links[0].id;

  // The customer's registration timestamp
  const userRows = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (userRows.length === 0) return null;
  const registeredAt = new Date(userRows[0].createdAt);

  // Find the most recent click that occurred within 90 days BEFORE registration
  const windowStart = new Date(registeredAt.getTime() - NINETY_DAYS_MS);

  const clicks = await db
    .select({ clickAt: affiliateTracking.clickAt })
    .from(affiliateTracking)
    .where(
      and(
        eq(affiliateTracking.affiliateLinkId, affiliateLinkId),
        gte(affiliateTracking.clickAt, windowStart.toISOString()),
        lt(affiliateTracking.clickAt, registeredAt.toISOString()) 
      )
    )
    .orderBy(desc(affiliateTracking.clickAt))
    .limit(1);

  if (clicks.length === 0) return null;
  const clickAt = new Date(clicks[0].clickAt);

  const commissionWindowEndsAt = new Date(registeredAt.getTime() + NINETY_DAYS_MS);

  // Insert; UNIQUE(user_id) guards against a race.
  try {
    const inserted = await db
      .insert(affiliateAttributions)
      .values({
        userId,
        affiliateLinkId,
        clickAt: clickAt.toISOString(),
        registeredAt: registeredAt.toISOString(),
        commissionWindowEndsAt: commissionWindowEndsAt.toISOString(),
      })
      .returning({ id: affiliateAttributions.id });
    return { attributionId: inserted[0].id };
  } catch (err) {
    // Race: another request inserted first. Fetch and return it.
    const again = await db
      .select({ id: affiliateAttributions.id })
      .from(affiliateAttributions)
      .where(eq(affiliateAttributions.userId, userId))
      .limit(1);
    if (again.length > 0) return { attributionId: again[0].id };
    throw err;
  }
}

/**
 * Return the customer's attribution if it is still inside the 90-day
 * commission window as of `at`, or null if outside/absent.
 */
export async function getActiveAttribution(
  userId: number,
  at: Date
): Promise<
  | { id: number; affiliateLinkId: number; commissionWindowEndsAt: Date }
  | null
> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(affiliateAttributions)
    .where(eq(affiliateAttributions.userId, userId))
    .limit(1);

  if (rows.length === 0) return null;
  const r = rows[0];
  const endsAt = new Date(r.commissionWindowEndsAt);
  if (endsAt.getTime() <= at.getTime()) return null;
  return {
    id: r.id,
    affiliateLinkId: r.affiliateLinkId,
    commissionWindowEndsAt: endsAt,
  };
}

/**
 * Record a click. Called by the public click tracker.
 */
export async function recordClick(input: {
  affiliateLinkId: number;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ trackingToken: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const token = crypto.randomUUID().replace(/-/g, "");
  await db.insert(affiliateTracking).values({
    affiliateLinkId: input.affiliateLinkId,
    trackingToken: token,
    source: input.source,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
  return { trackingToken: token };
}