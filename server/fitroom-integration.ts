/**
 * Fitroom API Integration
 * Handles communication with Fitroom API to fetch credits and account info
 */

export interface FitroomCreditsResponse {
  remaining: number;
  total: number;
  used: number;
  percentage: number;
}

/**
 * Fetch remaining credits from Fitroom API
 */
export async function getFitroomCredits(apiKey: string): Promise<FitroomCreditsResponse | null> {
  try {
    if (!apiKey) {
      console.warn("[Fitroom] API key not provided");
      return null;
    }

    // Try the credits endpoint
    const response = await fetch("https://api.fitroom.ai/v1/credits/balance", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const remaining = data.remaining || data.credits || 0;
      const total = data.total || data.totalCredits || remaining;
      const used = data.used || total - remaining;

      return {
        remaining,
        total,
        used,
        percentage: total > 0 ? (remaining / total) * 100 : 0,
      };
    } else if (response.status === 401) {
      console.error("[Fitroom] Invalid API key - authentication failed");
      return null;
    } else {
      console.warn(`[Fitroom] Credits endpoint returned ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error("[Fitroom] Error fetching credits:", error);
    return null;
  }
}

/**
 * Check if credits are running low
 */
export function isCreditsLow(credits: FitroomCreditsResponse): boolean {
  return credits.percentage < 10; // Less than 10% remaining
}

/**
 * Check if credits are critically low
 */
export function isCreditsCritical(credits: FitroomCreditsResponse): boolean {
  return credits.percentage < 5; // Less than 5% remaining
}
