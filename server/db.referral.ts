import { getDb } from "./db";
import { boutiqueTransactions, boutiqueCredits } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Generate a unique referral code for a boutique
 * Format: STYLESWAP-BOUTIQUE-{RANDOM_6_CHARS}
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `STYLESWAP-BOUTIQUE-${code}`;
}

/**
 * Award referral credits to referrer boutique
 * Referrer gets 10 credits when someone signs up with their code
 */
export async function awardReferrerCredits(
  referrerBoutiqueId: number,
  amount: number = 10
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Add credits to boutique credits
    const boutiqueCreditRecord = await db
      .select()
      .from(boutiqueCredits)
      .where(eq(boutiqueCredits.boutiqueId, referrerBoutiqueId))
      .limit(1);

    if (boutiqueCreditRecord.length > 0) {
      const current = boutiqueCreditRecord[0];
      await db
        .update(boutiqueCredits)
        .set({
          totalCredits: current.totalCredits + amount,
          remainingCredits: current.remainingCredits + amount,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(boutiqueCredits.boutiqueId, referrerBoutiqueId));
    }

    // Log transaction
    await db.insert(boutiqueTransactions).values({
      boutiqueId: referrerBoutiqueId,
      type: "adjustment",
      amount: amount,
      description: `Referral reward: ${amount} credits earned`,
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error awarding referrer credits:", error);
    throw error;
  }
}

/**
 * Award referral credits to referee (new boutique)
 * Referee gets 0 credits when they sign up with a referral code
 */
export async function awardRefereeCredits(
  refereeBoutiqueId: number,
  amount: number = 0
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Add credits to boutique credits
    const boutiqueCreditRecord = await db
      .select()
      .from(boutiqueCredits)
      .where(eq(boutiqueCredits.boutiqueId, refereeBoutiqueId))
      .limit(1);

    if (boutiqueCreditRecord.length > 0) {
      const current = boutiqueCreditRecord[0];
      await db
        .update(boutiqueCredits)
        .set({
          totalCredits: current.totalCredits + amount,
          remainingCredits: current.remainingCredits + amount,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(boutiqueCredits.boutiqueId, refereeBoutiqueId));
    }

    // Log transaction
    await db.insert(boutiqueTransactions).values({
      boutiqueId: refereeBoutiqueId,
      type: "adjustment",
      amount: amount,
      description: `Referral signup bonus: ${amount} credits`,
      status: "completed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error awarding referee credits:", error);
    throw error;
  }
}

/**
 * Get referral statistics for a boutique
 */
export async function getReferralStats(boutiqueId: number): Promise<{
  totalReferrals: number;
  totalCreditsEarned: number;
  referralCode: string;
}> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get all referral transactions for this boutique
    const transactions = await db
      .select()
      .from(boutiqueTransactions)
      .where(
        and(
          eq(boutiqueTransactions.boutiqueId, boutiqueId),
          eq(boutiqueTransactions.type, "adjustment"),
          eq(boutiqueTransactions.status, "completed")
        )
      );

    const referralTransactions = transactions.filter((t) =>
      t.description?.includes("Referral")
    );

    const totalCreditsEarned = referralTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    // Generate consistent referral code based on boutique ID
    const referralCode = `STYLESWAP-BOUTIQUE-${String(boutiqueId).padStart(6, "0")}`;

    return {
      totalReferrals: referralTransactions.length,
      totalCreditsEarned,
      referralCode,
    };
  } catch (error) {
    console.error("Error getting referral stats:", error);
    throw error;
  }
}
