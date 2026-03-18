import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  recordRequest,
  getUsageStats,
  getRateLimitConfig,
  updateRateLimitConfig,
  resetRequestHistory,
  getAllUsageStats,
} from "./rate-limiting";

describe("Rate Limiting Service", () => {
  const testApiKey = "sk_test_rate_limit_123";

  beforeEach(() => {
    // Reset request history before each test
    resetRequestHistory(testApiKey);
  });

  describe("checkRateLimit", () => {
    it("should allow requests for active apps", () => {
      const result = checkRateLimit(testApiKey, "active");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it("should deny all requests for suspended apps", () => {
      const result = checkRateLimit(testApiKey, "suspended");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain("suspended");
    });

    it("should deny all requests for revoked apps", () => {
      const result = checkRateLimit(testApiKey, "revoked");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain("revoked");
    });

    it("should enforce per-minute rate limits", () => {
      // Record 60 requests (max per minute)
      for (let i = 0; i < 60; i++) {
        recordRequest(testApiKey, "/api/tryon");
      }

      // Next request should be denied
      const result = checkRateLimit(testApiKey, "active");
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Rate limit exceeded");
    });

    it("should provide reset time", () => {
      const result = checkRateLimit(testApiKey, "active");
      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("recordRequest", () => {
    it("should record a single request", () => {
      recordRequest(testApiKey, "/api/tryon");
      const stats = getUsageStats(testApiKey);
      expect(stats.totalRequests).toBe(1);
    });

    it("should record multiple requests", () => {
      recordRequest(testApiKey, "/api/tryon");
      recordRequest(testApiKey, "/api/tryon");
      recordRequest(testApiKey, "/api/credits");

      const stats = getUsageStats(testApiKey);
      expect(stats.totalRequests).toBe(3);
    });

    it("should track endpoint usage", () => {
      recordRequest(testApiKey, "/api/tryon");
      recordRequest(testApiKey, "/api/tryon");
      recordRequest(testApiKey, "/api/credits");

      const stats = getUsageStats(testApiKey);
      expect(stats.topEndpoints.length).toBeGreaterThan(0);
      expect(stats.topEndpoints[0].endpoint).toBe("/api/tryon");
      expect(stats.topEndpoints[0].count).toBe(2);
    });
  });

  describe("getUsageStats", () => {
    it("should return zero stats for new API key", () => {
      const stats = getUsageStats("sk_test_new_key");
      expect(stats.totalRequests).toBe(0);
      expect(stats.requestsInLastHour).toBe(0);
      expect(stats.requestsInLastDay).toBe(0);
    });

    it("should count requests in last hour", () => {
      recordRequest(testApiKey, "/api/tryon");
      recordRequest(testApiKey, "/api/tryon");

      const stats = getUsageStats(testApiKey);
      expect(stats.requestsInLastHour).toBe(2);
      expect(stats.totalRequests).toBe(2);
    });

    it("should identify top endpoints", () => {
      for (let i = 0; i < 5; i++) {
        recordRequest(testApiKey, "/api/tryon");
      }
      for (let i = 0; i < 3; i++) {
        recordRequest(testApiKey, "/api/credits");
      }
      for (let i = 0; i < 2; i++) {
        recordRequest(testApiKey, "/api/status");
      }

      const stats = getUsageStats(testApiKey);
      expect(stats.topEndpoints[0].endpoint).toBe("/api/tryon");
      expect(stats.topEndpoints[0].count).toBe(5);
      expect(stats.topEndpoints[1].endpoint).toBe("/api/credits");
      expect(stats.topEndpoints[1].count).toBe(3);
    });

    it("should limit top endpoints to 5", () => {
      for (let i = 0; i < 10; i++) {
        recordRequest(testApiKey, `/api/endpoint${i}`);
      }

      const stats = getUsageStats(testApiKey);
      expect(stats.topEndpoints.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getRateLimitConfig", () => {
    it("should return config for active status", () => {
      const config = getRateLimitConfig("active");
      expect(config.requestsPerMinute).toBe(60);
      expect(config.requestsPerHour).toBe(3000);
      expect(config.requestsPerDay).toBe(50000);
    });

    it("should return config for suspended status", () => {
      const config = getRateLimitConfig("suspended");
      expect(config.requestsPerMinute).toBe(0);
      expect(config.requestsPerHour).toBe(0);
      expect(config.requestsPerDay).toBe(0);
    });

    it("should return default config for unknown status", () => {
      const config = getRateLimitConfig("unknown");
      expect(config.requestsPerMinute).toBe(60);
    });
  });

  describe("updateRateLimitConfig", () => {
    it("should update rate limit config", () => {
      updateRateLimitConfig("active", {
        requestsPerMinute: 120,
      });

      const config = getRateLimitConfig("active");
      expect(config.requestsPerMinute).toBe(120);
      expect(config.requestsPerHour).toBe(3000); // Should remain unchanged
    });

    it("should update multiple config values", () => {
      updateRateLimitConfig("active", {
        requestsPerMinute: 100,
        requestsPerHour: 5000,
        requestsPerDay: 100000,
      });

      const config = getRateLimitConfig("active");
      expect(config.requestsPerMinute).toBe(100);
      expect(config.requestsPerHour).toBe(5000);
      expect(config.requestsPerDay).toBe(100000);
    });
  });

  describe("resetRequestHistory", () => {
    it("should clear request history", () => {
      recordRequest(testApiKey, "/api/tryon");
      recordRequest(testApiKey, "/api/tryon");

      let stats = getUsageStats(testApiKey);
      expect(stats.totalRequests).toBe(2);

      resetRequestHistory(testApiKey);

      stats = getUsageStats(testApiKey);
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe("getAllUsageStats", () => {
    it("should return stats for all API keys", () => {
      recordRequest("sk_test_key_1", "/api/tryon");
      recordRequest("sk_test_key_1", "/api/tryon");
      recordRequest("sk_test_key_2", "/api/credits");

      const allStats = getAllUsageStats();
      expect(allStats.length).toBeGreaterThanOrEqual(2);

      const key1Stats = allStats.find((s) => s.apiKey === "sk_test_key_1");
      expect(key1Stats?.totalRequests).toBe(2);

      const key2Stats = allStats.find((s) => s.apiKey === "sk_test_key_2");
      expect(key2Stats?.totalRequests).toBe(1);
    });

    it("should sort by total requests descending", () => {
      recordRequest("sk_test_key_1", "/api/tryon");
      recordRequest("sk_test_key_2", "/api/credits");
      recordRequest("sk_test_key_2", "/api/credits");
      recordRequest("sk_test_key_2", "/api/credits");

      const allStats = getAllUsageStats();
      expect(allStats[0].apiKey).toBe("sk_test_key_2");
      expect(allStats[0].totalRequests).toBe(3);
    });
  });

  describe("Rate Limit Enforcement", () => {
    it("should enforce daily limits", () => {
      const config = getRateLimitConfig("active");
      const dailyLimit = config.requestsPerDay;

      // Record requests up to the limit
      for (let i = 0; i < dailyLimit; i++) {
        recordRequest(testApiKey, "/api/tryon");
      }

      // Next request should be denied
      const result = checkRateLimit(testApiKey, "active");
      expect(result.allowed).toBe(false);
    });

    it("should track requests by endpoint", () => {
      recordRequest(testApiKey, "/api/tryon");
      recordRequest(testApiKey, "/api/tryon");
      recordRequest(testApiKey, "/api/credits");

      const stats = getUsageStats(testApiKey);
      const tryonEndpoint = stats.topEndpoints.find((e) => e.endpoint === "/api/tryon");
      expect(tryonEndpoint?.count).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty API key", () => {
      const result = checkRateLimit("", "active");
      expect(result.allowed).toBe(true);
    });

    it("should handle very large request counts", () => {
      for (let i = 0; i < 100000; i++) {
        recordRequest(testApiKey, "/api/tryon");
      }

      const stats = getUsageStats(testApiKey);
      expect(stats.totalRequests).toBe(100000);
    });

    it("should handle multiple status types", () => {
      const statuses = ["active", "suspended", "revoked"];
      statuses.forEach((status) => {
        const result = checkRateLimit(testApiKey, status);
        expect(result).toHaveProperty("allowed");
        expect(result).toHaveProperty("remaining");
        expect(result).toHaveProperty("resetAt");
      });
    });
  });
});
