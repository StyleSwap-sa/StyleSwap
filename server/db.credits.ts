import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { userCredits, transactions, InsertTransaction } from "../drizzle/schema";

/**
 * Get or create user credits record
 */
export async function getUserCredits(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (result.length > 0) {
    return result[0];
  }

  // Create new credits record if doesn't exist
  await db.insert(userCredits).values({
    userId,
    totalCredits: 0,
    usedCredits: 0,
    remainingCredits: 0,
  });

  // Fetch and return the newly created record
  const newRecord = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (newRecord.length > 0) {
    return newRecord[0];
  }

  throw new Error("Failed to create user credits record");
}

/**
 * Add credits to user account
 */
export async function addCredits(
  userId: number,
  amount: number,
  price: string,
  fitRoomOrderId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const credits = await getUserCredits(userId);
  const newTotal = credits.totalCredits + amount;
  const newRemaining = credits.remainingCredits + amount;

  // Update credits
  await db
    .update(userCredits)
    .set({
      totalCredits: newTotal,
      remainingCredits: newRemaining,
      updatedAt: new Date(),
    })
    .where(eq(userCredits.userId, userId));

  // Log transaction
  await db.insert(transactions).values({
    userId,
    type: "purchase",
    amount,
    price,
    currency: "ZAR",
    fitRoomOrderId,
    description: `Purchased ${amount} try-on credits`,
    status: "completed",
  });

  return { totalCredits: newTotal, remainingCredits: newRemaining };
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(userId: number, amount: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const credits = await getUserCredits(userId);

  if (credits.remainingCredits < amount) {
    throw new Error("Insufficient credits");
  }

  const newRemaining = credits.remainingCredits - amount;
  const newUsed = credits.usedCredits + amount;

  // Update credits
  await db
    .update(userCredits)
    .set({
      usedCredits: newUsed,
      remainingCredits: newRemaining,
      updatedAt: new Date(),
    })
    .where(eq(userCredits.userId, userId));

  // Log transaction
  await db.insert(transactions).values({
    userId,
    type: "usage",
    amount,
    currency: "ZAR",
    description: `Used ${amount} try-on credit(s)`,
    status: "completed",
  });

  return { remainingCredits: newRemaining, usedCredits: newUsed };
}

/**
 * Get user transaction history
 */
export async function getUserTransactions(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy((t) => t.createdAt)
    .limit(limit);
}
