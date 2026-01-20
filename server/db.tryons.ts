import { getDb } from "./db";
import { tryOnResults, boutiqueTransactions } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Try-On Database Helpers
 * All queries return raw Drizzle rows - no processing
 */

export async function createTryOnResult(data: {
  boutiqueId?: number;
  userId: number;
  productId?: number;
  garmentId?: number;
  userPhotoUrl: string;
  resultImageUrl?: string;
  fitRoomTaskId?: string;
  fitRoomRequestId?: string;
  flowType: "b2c" | "b2b";
  shareToken?: string;
  isPublic?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tryOnResults).values(data as any);
  return result;
}

export async function getTryOnResultById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tryOnResults).where(eq(tryOnResults.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserTryOnResults(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(tryOnResults)
    .where(eq(tryOnResults.userId, userId))
    .orderBy(desc(tryOnResults.createdAt))
    .limit(limit);
}

export async function getBoutiqueTryOnResults(boutiqueId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(tryOnResults)
    .where(
      and(
        eq(tryOnResults.boutiqueId, boutiqueId),
        eq(tryOnResults.flowType, "b2b")
      )
    )
    .orderBy(desc(tryOnResults.createdAt))
    .limit(limit);
}

export async function getProductTryOnResults(productId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(tryOnResults)
    .where(
      and(
        eq(tryOnResults.productId, productId),
        eq(tryOnResults.flowType, "b2b")
      )
    )
    .orderBy(desc(tryOnResults.createdAt))
    .limit(limit);
}

export async function getTryOnResultByShareToken(shareToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(tryOnResults)
    .where(eq(tryOnResults.shareToken, shareToken))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTryOnResult(
  id: number,
  data: Partial<{
    resultImageUrl: string;
    fitRoomTaskId: string;
    fitRoomRequestId: string;
    shareToken: string;
    shareCount: number;
    isPublic: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(tryOnResults).set(data as any).where(eq(tryOnResults.id, id));
}

export async function incrementShareCount(tryOnResultId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await getTryOnResultById(tryOnResultId);
  if (!result) throw new Error("Try-on result not found");
  
  return await updateTryOnResult(tryOnResultId, {
    shareCount: (result.shareCount || 0) + 1,
  });
}

/**
 * Boutique Transaction Helpers
 */

export async function createBoutiqueTransaction(data: {
  boutiqueId: number;
  type: "purchase" | "usage" | "refund" | "adjustment";
  amount: number;
  price?: number;
  currency?: string;
  productId?: number;
  fitRoomRequestId?: string;
  initiatedBy?: number;
  description?: string;
  status?: "pending" | "completed" | "failed";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(boutiqueTransactions).values(data as any);
  return result;
}

export async function getBoutiqueTransactions(
  boutiqueId: number,
  type?: string,
  limit = 50
) {
  const db = await getDb();
  if (!db) return [];
  
  if (type) {
    return await db
      .select()
      .from(boutiqueTransactions)
      .where(
        and(
          eq(boutiqueTransactions.boutiqueId, boutiqueId),
          eq(boutiqueTransactions.type, type as any)
        )
      )
      .orderBy(desc(boutiqueTransactions.createdAt))
      .limit(limit);
  }
  
  return await db
    .select()
    .from(boutiqueTransactions)
    .where(eq(boutiqueTransactions.boutiqueId, boutiqueId))
    .orderBy(desc(boutiqueTransactions.createdAt))
    .limit(limit);
}

export async function getBoutiqueUsageStats(boutiqueId: number) {
  const db = await getDb();
  if (!db) return { totalUsage: 0, thisMonth: 0, thisWeek: 0 };
  
  const allUsage = await db
    .select()
    .from(boutiqueTransactions)
    .where(
      and(
        eq(boutiqueTransactions.boutiqueId, boutiqueId),
        eq(boutiqueTransactions.type, "usage")
      )
    );
  
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const thisMonth = allUsage.filter(t => new Date(t.createdAt) >= monthAgo).length;
  const thisWeek = allUsage.filter(t => new Date(t.createdAt) >= weekAgo).length;
  
  return {
    totalUsage: allUsage.length,
    thisMonth,
    thisWeek,
  };
}
