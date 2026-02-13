import { TRPCError } from "@trpc/server";
import { checkMonthlyQuota, incrementMonthlyUsage, decrementMonthlyUsage } from "../db.quota";

/**
 * Check if user has quota available for try-on generation
 * Throws RESOURCE_EXHAUSTED error if quota is exceeded
 */
export async function enforceQuotaCheck(
  userId: number,
  boutiqueId?: number
): Promise<void> {
  if (!boutiqueId) {
    return;
  }
  
  const quota = await checkMonthlyQuota(userId, boutiqueId);
  
  if (!quota.allowed) {
    throw new TRPCError({
      code: "RESOURCE_EXHAUSTED",
      message: `Monthly try-on limit (${quota.limit}) reached. Resets on ${quota.resetDate}`,
    });
  }
}

/**
 * Record successful try-on usage
 */
export async function recordTryOnUsage(
  userId: number,
  boutiqueId?: number
): Promise<void> {
  if (!boutiqueId) {
    return;
  }
  
  await incrementMonthlyUsage(userId, boutiqueId);
}

/**
 * Refund try-on usage (for failed generations)
 */
export async function refundTryOnUsage(
  userId: number,
  boutiqueId?: number
): Promise<void> {
  if (!boutiqueId) {
    return;
  }
  
  await decrementMonthlyUsage(userId, boutiqueId);
}

/**
 * Get quota status for user
 */
export async function getQuotaStatus(
  userId: number,
  boutiqueId?: number
) {
  if (!boutiqueId) {
    return null;
  }
  
  return await checkMonthlyQuota(userId, boutiqueId);
}
