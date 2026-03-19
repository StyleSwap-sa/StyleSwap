import { eq, and, like, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { userCredits, transactions } from "../drizzle/schema";

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
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(userCredits.userId, userId));

  // Log transaction
  await db.insert(transactions).values({
    userId,
    amount: amount.toString(),
    status: "completed",
    reason: `Purchased ${amount} try-on credits at ${price} ZAR`,
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
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(userCredits.userId, userId));

  // Log transaction
  await db.insert(transactions).values({
    userId,
    amount: amount.toString(),
    status: "completed",
    reason: `Used ${amount} try-on credit(s)`,
  });

  return { remainingCredits: newRemaining, usedCredits: newUsed };
}

/**
 * Refund credits to user account (for failed/timeout try-ons)
 */
export async function refundCredits(userId: number, amount: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const credits = await getUserCredits(userId);

  const newRemaining = credits.remainingCredits + amount;
  const newUsed = Math.max(0, credits.usedCredits - amount);

  // Update credits
  await db
    .update(userCredits)
    .set({
      usedCredits: newUsed,
      remainingCredits: newRemaining,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(userCredits.userId, userId));

  // Log transaction
  await db.insert(transactions).values({
    userId,
    amount: amount.toString(),
    status: "completed",
    reason: `Refunded ${amount} try-on credit(s) due to generation failure`,
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

/**
 * Add credits to a user's account (admin operation for custom packages)
 * Used when a retail client requests a custom credit tier
 */
export async function addCreditsAdmin(
  userId: number,
  creditsToAdd: number,
  reason: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const credits = await getUserCredits(userId);
  const newTotal = credits.totalCredits + creditsToAdd;
  const newRemaining = credits.remainingCredits + creditsToAdd;

  // Update credits
  await db
    .update(userCredits)
    .set({
      totalCredits: newTotal,
      remainingCredits: newRemaining,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(userCredits.userId, userId));

  // Log transaction with admin note
  await db.insert(transactions).values({
    userId,
    amount: creditsToAdd.toString(),
    status: "completed",
    reason: `Admin adjustment: ${reason}`,
  });

  return { totalCredits: newTotal, remainingCredits: newRemaining };
}

/**
 * Search users by email or name (for admin panel)
 */
export async function searchUsersForAdmin(query: string, limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { users: usersTable } = await import("../drizzle/schema");
  const searchQuery = `%${query}%`;

  return await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      userType: usersTable.user_type,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(
      or(
        like(usersTable.email, searchQuery),
        like(usersTable.name, searchQuery)
      )
    )
    .limit(limit);
}

/**
 * Get all transactions for a user (for admin audit)
 */
export async function getUserTransactionHistoryAdmin(
  userId: number,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy((t) => t.createdAt)
    .limit(limit);
}

/**
 * Deduct credits manually (admin operation for corrections)
 */
export async function deductCreditsAdmin(
  userId: number,
  creditsToDeduct: number,
  reason: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const credits = await getUserCredits(userId);

  if (credits.remainingCredits < creditsToDeduct) {
    throw new Error("Insufficient credits to deduct");
  }

  const newRemaining = credits.remainingCredits - creditsToDeduct;
  const newUsed = credits.usedCredits + creditsToDeduct;

  // Update credits
  await db
    .update(userCredits)
    .set({
      usedCredits: newUsed,
      remainingCredits: newRemaining,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(userCredits.userId, userId));

  // Log transaction
  await db.insert(transactions).values({
    userId,
    amount: (-creditsToDeduct).toString(),
    status: "completed",
    reason: `Admin deduction: ${reason}`,
  });

  return { remainingCredits: newRemaining, usedCredits: newUsed };
}
