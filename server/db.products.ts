import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Product Database Helpers
 * All queries return raw Drizzle rows - no processing
 */

export async function createProduct(data: {
  boutiqueId: number;
  name: string;
  sku?: string;
  description?: string;
  category: string;
  imageUrl: string;
  price?: number | null;
  currency?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data as any);
  return result;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductsByBoutique(boutiqueId: number, activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  
  if (activeOnly) {
    return await db.select().from(products).where(
      and(
        eq(products.boutiqueId, boutiqueId),
        eq(products.isActive, 1)
      )
    );
  }
  
  return await db.select().from(products).where(eq(products.boutiqueId, boutiqueId));
}

export async function getProductsByCategory(boutiqueId: number, category: string, activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  
  if (activeOnly) {
    return await db.select().from(products).where(
      and(
        eq(products.boutiqueId, boutiqueId),
        eq(products.category, category),
        eq(products.isActive, 1)
      )
    );
  }
  
  return await db.select().from(products).where(
    and(
      eq(products.boutiqueId, boutiqueId),
      eq(products.category, category)
    )
  );
}

export async function getProductBySku(boutiqueId: number, sku: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(
    and(
      eq(products.boutiqueId, boutiqueId),
      eq(products.sku, sku)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProduct(
  id: number,
  data: Partial<{
    name: string;
    sku: string;
    description: string;
    category: string;
    imageUrl: string;
    price: number;
    currency: string;
    isActive: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(products).set(data as any).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(products).where(eq(products.id, id));
}

export async function deactivateProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(products).set({ isActive: 0 }).where(eq(products.id, id));
}

export async function activateProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(products).set({ isActive: 1 }).where(eq(products.id, id));
}

export async function getProductCategories(boutiqueId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({ category: products.category })
    .from(products)
    .where(
      and(
        eq(products.boutiqueId, boutiqueId),
        eq(products.isActive, 1)
      )
    )
    .groupBy(products.category);
  
  return result.map(r => r.category);
}
