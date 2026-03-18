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
 * Note: Fitroom may not have a dedicated credits endpoint
 * This function attempts to fetch credits but gracefully handles failures
 */
export async function getFitroomCredits(apiKey: string): Promise<FitroomCreditsResponse | null> {
  try {
    if (!apiKey) {
      console.warn("[Fitroom] API key not provided");
      return null;
    }

    // Try the Fitroom platform API endpoint for credits
    // Note: This endpoint may not exist - we'll handle gracefully
    const response = await fetch("https://platform.fitroom.app/api/account/credits", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    console.log("[Fitroom] Credits endpoint response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("[Fitroom] Credits response data:", data);
      
      const remaining = data.remaining || data.credits || data.balance || 0;
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
      const errorText = await response.text();
      console.warn(`[Fitroom] Credits endpoint returned ${response.status}: ${errorText}`);
      // Return a default response so the app doesn't break
      return {
        remaining: 0,
        total: 0,
        used: 0,
        percentage: 0,
      };
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
