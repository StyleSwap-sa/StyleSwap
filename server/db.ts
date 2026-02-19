import { drizzle } from "drizzle-orm/mysql2";
import { eq, desc, gte, sql } from "drizzle-orm";
import { InsertUser, users, garments, tryOnResults, InsertTryOnResult, boutiques, boutiqueCredits, boutiqueTransactions, shopOrders } from "../drizzle/schema";
import { ENV } from './_core/env';
import * as mysql from 'mysql2/promise';

let _db: ReturnType<typeof drizzle> | null = null;
let _initPromise: Promise<ReturnType<typeof drizzle> | null> | null = null;

// Initialize database connection with proper error handling
export async function getDb() {
  // Return cached instance if already initialized
  if (_db) {
    return _db;
  }

  // Return existing promise if initialization is in progress
  if (_initPromise) {
    return _initPromise;
  }

  // Start initialization
  _initPromise = (async () => {
    if (!process.env.DATABASE_URL) {
      console.error("[Database] DATABASE_URL environment variable is not set");
      return null;
    }

    try {
      console.log("[Database] Initializing connection pool...");
      const poolConnection = await mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(poolConnection);
      console.log("[Database] ✓ Connection pool initialized successfully");
      return _db;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[Database] ✗ Failed to initialize connection pool:", errorMsg);
      _db = null;
      _initPromise = null;
      return null;
    }
  })();

  return _initPromise;
}

export async function upsertUser(user: Partial<InsertUser> & { openId: string }): Promise<User | undefined> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  try {
    const values: any = {
      openId: user.openId,
      // Don't include clerkId for OAuth users - the column doesn't exist
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    // Ensure free trial fields have defaults for new users
    if (!values.freeTrialUsed) {
      values.freeTrialUsed = 0;
    }
    // Don't update freeTrialUsedAt and freeTrialExpiresAt on duplicate - only on first insert

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Check if email already exists with a different openId
    if (values.email) {
      const existingByEmail = await db.select().from(users).where(eq(users.email, values.email)).limit(1);
      if (existingByEmail.length > 0 && existingByEmail[0].openId !== user.openId) {
        // Email exists with different openId - update that user instead
        await db.update(users).set(updateSet).where(eq(users.id, existingByEmail[0].id));
        return existingByEmail[0];
      }
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Clerk-based user queries
export async function getUserByClerkId(clerkId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserWithClerk(data: {
  clerkId: string;
  email: string;
  name?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  try {
    const existing = await getUserByClerkId(data.clerkId);
    
    if (existing) {
      // Update existing user
      await db.update(users)
        .set({
          email: data.email,
          name: data.name || existing.name,
          lastSignedIn: new Date(),
        })
        .where(eq(users.clerkId, data.clerkId));
      
      return existing;
    }
    
    // Create new user
    const newUser = {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name || data.email,
      role: data.clerkId === ENV.ownerOpenId ? 'admin' : 'user',
      lastSignedIn: new Date(),
      freeTrialUsed: 0,
    } as InsertUser;
    
    await db.insert(users).values(newUser);
    return await getUserByClerkId(data.clerkId);
  } catch (error) {
    console.error('[Database] Error upserting user with Clerk:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Garment queries
export async function getActiveGarments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(garments).where(eq(garments.isActive, 1));
}

export async function getGarmentById(garmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(garments).where(eq(garments.id, garmentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Try-on results queries
export async function createTryOnResult(data: InsertTryOnResult) {
  const db = await getDb();
  if (!db) return undefined;
  return db.insert(tryOnResults).values(data);
}

export async function getUserTryOnResults(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tryOnResults).where(eq(tryOnResults.userId, userId)).orderBy(desc(tryOnResults.createdAt)).limit(limit);
}

export async function getTryOnResultByShareToken(shareToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tryOnResults).where(eq(tryOnResults.shareToken, shareToken)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementShareCount(tryOnResultId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(tryOnResults).set({ shareCount: sql`${tryOnResults.shareCount} + 1` }).where(eq(tryOnResults.id, tryOnResultId));
}

// Admin Analytics Queries
export async function getPlatformMetrics() {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get total boutiques
    const totalBoutiquesResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(boutiques);
    const totalBoutiques = totalBoutiquesResult[0]?.count || 0;

    // Get active boutiques
    const activeBoutiquesResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(boutiques)
      .where(eq(boutiques.status, 'active'));
    const activeBoutiques = activeBoutiquesResult[0]?.count || 0;

    // Get total credits
    const totalCreditsResult = await db
      .select({ total: sql<number>`SUM(${boutiqueCredits.totalCredits})` })
      .from(boutiqueCredits);
    const totalCredits = totalCreditsResult[0]?.total || 0;

    // Get used credits
    const usedCreditsResult = await db
      .select({ total: sql<number>`SUM(${boutiqueCredits.usedCredits})` })
      .from(boutiqueCredits);
    const usedCredits = usedCreditsResult[0]?.total || 0;

    // Get remaining credits
    const remainingCreditsResult = await db
      .select({ total: sql<number>`SUM(${boutiqueCredits.remainingCredits})` })
      .from(boutiqueCredits);
    const remainingCredits = remainingCreditsResult[0]?.total || 0;

    // Get total revenue (sum of all purchases)
    const revenueResult = await db
      .select({ total: sql<number>`SUM(CAST(${boutiqueTransactions.price} AS DECIMAL(10,2)))` })
      .from(boutiqueTransactions)
      .where(eq(boutiqueTransactions.type, 'purchase'));
    const totalRevenue = revenueResult[0]?.total || 0;

    return {
      totalBoutiques,
      activeBoutiques,
      inactiveBoutiques: totalBoutiques - activeBoutiques,
      totalCredits,
      usedCredits,
      remainingCredits,
      creditUsagePercentage: totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0,
      totalRevenue: parseFloat(totalRevenue.toString()),
    };
  } catch (error) {
    console.error('[Database] Failed to get platform metrics:', error);
    return null;
  }
}

export async function getBoutiquesList(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  try {
    const boutiquesData = await db
      .select({
        id: boutiques.id,
        name: boutiques.name,
        slug: boutiques.slug,
        status: boutiques.status,
        createdAt: boutiques.createdAt,
        totalCredits: boutiqueCredits.totalCredits,
        usedCredits: boutiqueCredits.usedCredits,
        remainingCredits: boutiqueCredits.remainingCredits,
      })
      .from(boutiques)
      .leftJoin(boutiqueCredits, eq(boutiques.id, boutiqueCredits.boutiqueId))
      .orderBy(desc(boutiques.createdAt))
      .limit(limit)
      .offset(offset);

    return boutiquesData;
  } catch (error) {
    console.error('[Database] Failed to get boutiques list:', error);
    return [];
  }
}

export async function getBoutiqueDetails(boutiqueId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const boutique = await db
      .select({
        id: boutiques.id,
        name: boutiques.name,
        slug: boutiques.slug,
        status: boutiques.status,
        createdAt: boutiques.createdAt,
        totalCredits: boutiqueCredits.totalCredits,
        usedCredits: boutiqueCredits.usedCredits,
        remainingCredits: boutiqueCredits.remainingCredits,
      })
      .from(boutiques)
      .leftJoin(boutiqueCredits, eq(boutiques.id, boutiqueCredits.boutiqueId))
      .where(eq(boutiques.id, boutiqueId))
      .limit(1);

    return boutique.length > 0 ? boutique[0] : null;
  } catch (error) {
    console.error('[Database] Failed to get boutique details:', error);
    return null;
  }
}

export async function getMonthlyCreditsUsage() {
  const db = await getDb();
  if (!db) return [];

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Use Drizzle query builder with proper GROUP BY handling
    const usage = await db
      .select({
        date: sql<string>`DATE(${boutiqueTransactions.createdAt})`,
        creditsUsed: sql<number>`SUM(CASE WHEN ${boutiqueTransactions.type} = 'usage' THEN ${boutiqueTransactions.amount} ELSE 0 END)`,
        creditsPurchased: sql<number>`SUM(CASE WHEN ${boutiqueTransactions.type} = 'purchase' THEN ${boutiqueTransactions.amount} ELSE 0 END)`,
      })
      .from(boutiqueTransactions)
      .where(gte(boutiqueTransactions.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${boutiqueTransactions.createdAt})`)
      .orderBy(sql`DATE(${boutiqueTransactions.createdAt}) DESC`);

    return usage;
  } catch (error) {
    console.error('[Database] Failed to get monthly credits usage:', error);
    return [];
  }
}

export async function getTopBoutiques(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  try {
    const topBoutiques = await db
      .select({
        id: boutiques.id,
        name: boutiques.name,
        slug: boutiques.slug,
        usedCredits: boutiqueCredits.usedCredits,
        totalCredits: boutiqueCredits.totalCredits,
      })
      .from(boutiques)
      .leftJoin(boutiqueCredits, eq(boutiques.id, boutiqueCredits.boutiqueId))
      .orderBy(desc(boutiqueCredits.usedCredits))
      .limit(limit);

    return topBoutiques;
  } catch (error) {
    console.error('[Database] Failed to get top boutiques:', error);
    return [];
  }
}

// TODO: add feature queries here as your schema grows.


// Phase 1: Order Management Functions
export async function createOrder(order: {
  orderNumber: string;
  customerId: number;
  boutiqueId: number;
  productId?: number;
  quantity: number;
  size?: string;
  color?: string;
  amount: number;
  deliveryAddress?: string;
  customerPhone?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot create order: database not available");
  }

  try {
    const result = await db.insert(shopOrders).values(order);
    return result;
  } catch (error) {
    console.error('[Database] Failed to create order:', error);
    throw error;
  }
}

export async function getOrdersByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    const orders = await db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.customerId, customerId))
      .orderBy(desc(shopOrders.createdAt));
    return orders;
  } catch (error) {
    console.error('[Database] Failed to get customer orders:', error);
    return [];
  }
}

export async function getOrdersByBoutique(boutiqueId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    const orders = await db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.boutiqueId, boutiqueId))
      .orderBy(desc(shopOrders.createdAt));
    return orders;
  } catch (error) {
    console.error('[Database] Failed to get boutique orders:', error);
    return [];
  }
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    const order = await db
      .select()
      .from(shopOrders)
      .where(eq(shopOrders.id, orderId))
      .limit(1);
    return order[0] || null;
  } catch (error) {
    console.error('[Database] Failed to get order:', error);
    return null;
  }
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Cannot update order: database not available");
  }

  try {
    const result = await db
      .update(shopOrders)
      .set({ status: status as any })
      .where(eq(shopOrders.id, orderId));
    return result;
  } catch (error) {
    console.error('[Database] Failed to update order status:', error);
    throw error;
  }
}
