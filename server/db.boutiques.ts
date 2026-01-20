import { getDb } from "./db";
import { boutiques, boutiqueUsers, boutiqueSettings, boutiqueCredits, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Boutique Database Helpers
 * All queries return raw Drizzle rows - no processing
 */

export async function createBoutique(data: {
  name: string;
  slug: string;
  ownerId: number;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  facebookUrl?: string;
  whatsappNumber?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(boutiques).values(data);
  return result;
}

export async function getBoutiqueById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(boutiques).where(eq(boutiques.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBoutiqueBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(boutiques).where(eq(boutiques.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBoutiquesByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(boutiques).where(eq(boutiques.ownerId, ownerId));
}

export async function getAllBoutiques(status?: string) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return await db.select().from(boutiques).where(eq(boutiques.status, status as any));
  }
  return await db.select().from(boutiques);
}

export async function updateBoutique(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    logoUrl: string;
    websiteUrl: string;
    status: "active" | "suspended" | "inactive";
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(boutiques).set(data as any).where(eq(boutiques.id, id));
}

export async function deleteBoutique(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(boutiques).where(eq(boutiques.id, id));
}

/**
 * Boutique Users (Staff) Helpers
 */

export async function addBoutiqueUser(data: {
  boutiqueId: number;
  userId: number;
  role: "owner" | "manager" | "staff";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(boutiqueUsers).values(data);
}

export async function getBoutiqueUsers(boutiqueId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(boutiqueUsers).where(eq(boutiqueUsers.boutiqueId, boutiqueId));
}

export async function getUserBoutiques(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get boutique IDs for the user
  const userBoutiqueIds = await db.select({ boutiqueId: boutiqueUsers.boutiqueId }).from(boutiqueUsers).where(eq(boutiqueUsers.userId, userId));
  if (userBoutiqueIds.length === 0) return [];
  // Get the actual boutique data
  const boutiqueIds = userBoutiqueIds.map(u => u.boutiqueId);
  const { inArray } = require('drizzle-orm');
  return await db.select().from(boutiques).where(inArray(boutiques.id, boutiqueIds));
}

export async function getBoutiqueUserRole(boutiqueId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(boutiqueUsers).where(
    and(
      eq(boutiqueUsers.boutiqueId, boutiqueId),
      eq(boutiqueUsers.userId, userId)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBoutiqueUserRole(
  boutiqueId: number,
  userId: number,
  role: "owner" | "manager" | "staff"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(boutiqueUsers)
    .set({ role })
    .where(
      and(
        eq(boutiqueUsers.boutiqueId, boutiqueId),
        eq(boutiqueUsers.userId, userId)
      )
    );
}

export async function removeBoutiqueUser(boutiqueId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .delete(boutiqueUsers)
    .where(
      and(
        eq(boutiqueUsers.boutiqueId, boutiqueId),
        eq(boutiqueUsers.userId, userId)
      )
    );
}

/**
 * Boutique Settings Helpers
 */

export async function getBoutiqueSettings(boutiqueId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(boutiqueSettings).where(eq(boutiqueSettings.boutiqueId, boutiqueId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBoutiqueSettings(data: {
  boutiqueId: number;
  brandingColor?: string;
  customDomain?: string;
  enableSharing?: number;
  enableAnalytics?: number;
  webhookUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(boutiqueSettings).values({
    boutiqueId: data.boutiqueId,
    brandingColor: data.brandingColor || "#FF6B35",
    customDomain: data.customDomain || "",
    enableSharing: data.enableSharing !== undefined ? data.enableSharing : 1,
    enableAnalytics: data.enableAnalytics !== undefined ? data.enableAnalytics : 1,
    webhookUrl: data.webhookUrl || "",
  });
}

export async function updateBoutiqueSettings(
  boutiqueId: number,
  data: Partial<{
    brandingColor: string;
    customDomain: string;
    enableSharing: number;
    enableAnalytics: number;
    webhookUrl: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(boutiqueSettings)
    .set(data)
    .where(eq(boutiqueSettings.boutiqueId, boutiqueId));
}

/**
 * Boutique Credits Helpers
 */

export async function getBoutiqueCredits(boutiqueId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(boutiqueCredits).where(eq(boutiqueCredits.boutiqueId, boutiqueId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBoutiqueCredits(data: {
  boutiqueId: number;
  totalCredits: number;
  usedCredits?: number;
  remainingCredits?: number;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(boutiqueCredits).values(data);
}

export async function updateBoutiqueCredits(
  boutiqueId: number,
  data: Partial<{
    totalCredits: number;
    usedCredits: number;
    remainingCredits: number;
    expiresAt: Date;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(boutiqueCredits)
    .set(data)
    .where(eq(boutiqueCredits.boutiqueId, boutiqueId));
}

export async function deductBoutiqueCredit(boutiqueId: number, amount: number = 1) {
  const credits = await getBoutiqueCredits(boutiqueId);
  if (!credits) {
    throw new Error("Boutique credits not found");
  }

  if (credits.remainingCredits < amount) {
    throw new Error("Insufficient credits");
  }

  return await updateBoutiqueCredits(boutiqueId, {
    usedCredits: (credits.usedCredits || 0) + amount,
    remainingCredits: credits.remainingCredits - amount,
  });
}

export async function addBoutiqueCredit(boutiqueId: number, amount: number) {
  const credits = await getBoutiqueCredits(boutiqueId);
  if (!credits) {
    throw new Error("Boutique credits not found");
  }

  return await updateBoutiqueCredits(boutiqueId, {
    totalCredits: (credits.totalCredits || 0) + amount,
    remainingCredits: (credits.remainingCredits || 0) + amount,
  });
}
