import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc, gte, sql, onConflict } from "drizzle-orm";
import { InsertUser, users, garments, tryOnResults, InsertTryOnResult, boutiques, boutiqueCredits, boutiqueTransactions, shopOrders } from "../drizzle/schema";
import { ENV } from './_core/env';
import postgres from 'postgres';

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
      console.log("[Database] Initializing PostgreSQL connection...");
      const client = postgres(process.env.DATABASE_URL, {
        ssl: 'require',
      });
      _db = drizzle(client);
      console.log("[Database] ✓ PostgreSQL connection initialized successfully");
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

export async function upsertUser(user: Partial<InsertUser> & { openId: string }): Promise<any | undefined> {
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

    // Use PostgreSQL onConflict syntax instead of MySQL onDuplicateKeyUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
    
    // Return the upserted user
    return await getUserByOpenId(user.openId);
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getGarments() {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  return await db.select().from(garments);
}

export async function getTryOnResults(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  return await db.select().from(tryOnResults).where(eq(tryOnResults.userId, userId));
}

export async function createTryOnResult(data: InsertTryOnResult) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.insert(tryOnResults).values(data).returning();
  return result[0];
}

export async function createOrder(data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.insert(shopOrders).values(data).returning();
  return result[0];
}

export async function getOrdersByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  return await db.select().from(shopOrders).where(eq(shopOrders.customerId, customerId));
}

export async function getOrdersByBoutique(boutiqueId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  return await db.select().from(shopOrders).where(eq(shopOrders.boutiqueId, boutiqueId));
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.select().from(shopOrders).where(eq(shopOrders.id, orderId)).limit(1);
  return result[0];
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.update(shopOrders).set({ status }).where(eq(shopOrders.id, orderId)).returning();
  return result[0];
}

export async function getMonthlyCreditsUsage(boutiqueId: number, month: number, year: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return await db.select().from(boutiqueTransactions)
    .where(
      sql`${boutiqueTransactions.boutiqueId} = ${boutiqueId} 
        AND ${boutiqueTransactions.createdAt} >= ${startDate}
        AND ${boutiqueTransactions.createdAt} <= ${endDate}`
    );
}

export async function getTopBoutiques(limit: number = 10) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  return await db.select().from(boutiques).limit(limit);
}


export async function getActiveGarments() {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  return await db.select().from(garments).where(sql`status = 'active'`);
}

export async function getGarmentById(garmentId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.select().from(garments).where(eq(garments.id, garmentId)).limit(1);
  return result[0];
}

export async function getUserTryOnResults(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  return await db.select().from(tryOnResults).where(eq(tryOnResults.userId, userId));
}

export async function getTryOnResultByShareToken(shareToken: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.select().from(tryOnResults).where(eq(tryOnResults.shareToken, shareToken)).limit(1);
  return result[0];
}

export async function incrementShareCount(resultId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.update(tryOnResults)
    .set({ shareCount: sql`${tryOnResults.shareCount} + 1` })
    .where(eq(tryOnResults.id, resultId))
    .returning();
  
  return result[0];
}

export async function getPlatformMetrics() {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  // Return basic platform metrics
  const totalUsers = await db.select({ count: sql`count(*)` }).from(users);
  const totalBoutiques = await db.select({ count: sql`count(*)` }).from(boutiques);
  const totalTryOns = await db.select({ count: sql`count(*)` }).from(tryOnResults);

  return {
    totalUsers: totalUsers[0]?.count || 0,
    totalBoutiques: totalBoutiques[0]?.count || 0,
    totalTryOns: totalTryOns[0]?.count || 0,
  };
}

export async function getBoutiquesList(limit: number = 10) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  return await db.select().from(boutiques).limit(limit);
}

export async function getMonthlyCreditUsage(boutiqueId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return await db.select().from(boutiqueTransactions)
    .where(
      sql`${boutiqueTransactions.boutiqueId} = ${boutiqueId} 
        AND ${boutiqueTransactions.createdAt} >= ${startOfMonth}
        AND ${boutiqueTransactions.createdAt} <= ${endOfMonth}`
    );
}

export async function getBoutiqueById(boutiqueId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.select().from(boutiques).where(eq(boutiques.id, boutiqueId)).limit(1);
  return result[0];
}

export async function updateBoutiqueCredits(boutiqueId: number, amount: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.update(boutiqueCredits)
    .set({ balance: sql`${boutiqueCredits.balance} + ${amount}` })
    .where(eq(boutiqueCredits.boutiqueId, boutiqueId))
    .returning();
  
  return result[0];
}

export async function createBoutiqueTransaction(data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("[Database] Database connection not available");
  }

  const result = await db.insert(boutiqueTransactions).values(data).returning();
  return result[0];
}
