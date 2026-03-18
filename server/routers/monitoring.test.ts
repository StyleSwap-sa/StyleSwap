import { describe, it, expect, vi, beforeEach } from "vitest";
import { monitoringRouter } from "./monitoring";

// Mock the rate limiting module
vi.mock("../rate-limiting", () => ({
  checkRateLimit: vi.fn((apiKey, status) => ({
    allowed: status === "active",
    remaining: 50,
    resetAt: new Date(Date.now() + 60000),
    reason: status !== "active" ? `App is ${status}` : undefined,
  })),
  recordRequest: vi.fn(),
  getUsageStats: vi.fn((apiKey) => ({
    totalRequests: 100,
    requestsInLastHour: 10,
    requestsInLastDay: 50,
    topEndpoints: [
      { endpoint: "/api/tryon", count: 50 },
      { endpoint: "/api/credits", count: 30 },
    ],
  })),
  getAllUsageStats: vi.fn(() => [
    {
      apiKey: "sk_test_1",
      totalRequests: 100,
      requestsInLastHour: 10,
      requestsInLastDay: 50,
    },
    {
      apiKey: "sk_test_2",
      totalRequests: 200,
      requestsInLastHour: 20,
      requestsInLastDay: 100,
    },
  ]),
}));

describe("Monitoring Router", () => {
  describe("checkRateLimit", () => {
    it("should return rate limit status for active app", async () => {
      const caller = monitoringRouter.createCaller({} as any);
      const result = await caller.checkRateLimit({
        apiKey: "sk_test_123",
        status: "active",
      });

      expect(result.success).toBe(true);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it("should deny suspended apps", async () => {
      const caller = monitoringRouter.createCaller({} as any);
      const result = await caller.checkRateLimit({
        apiKey: "sk_test_123",
        status: "suspended",
      });

      expect(result.success).toBe(true);
      expect(result.allowed).toBe(false);
    });
  });

  describe("recordRequest", () => {
    it("should record a request successfully", async () => {
      const caller = monitoringRouter.createCaller({} as any);
      const result = await caller.recordRequest({
        apiKey: "sk_test_123",
        endpoint: "/api/tryon",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Request recorded");
    });
  });

  describe("getUsageStats", () => {
    it("should return usage statistics", async () => {
      const caller = monitoringRouter.createCaller({} as any);
      const result = await caller.getUsageStats({
        apiKey: "sk_test_123",
      });

      expect(result.success).toBe(true);
      expect(result.stats.totalRequests).toBe(100);
      expect(result.stats.requestsInLastHour).toBe(10);
      expect(result.stats.requestsInLastDay).toBe(50);
    });

    it("should include top endpoints", async () => {
      const caller = monitoringRouter.createCaller({} as any);
      const result = await caller.getUsageStats({
        apiKey: "sk_test_123",
      });

      expect(result.stats.topEndpoints.length).toBeGreaterThan(0);
      expect(result.stats.topEndpoints[0].endpoint).toBe("/api/tryon");
    });
  });

  describe("getAllUsageStats", () => {
    it("should return all apps usage statistics", async () => {
      const caller = monitoringRouter.createCaller({} as any);
      const result = await caller.getAllUsageStats();

      expect(result.success).toBe(true);
      expect(result.stats.length).toBeGreaterThan(0);
    });

    it("should include multiple apps", async () => {
      const caller = monitoringRouter.createCaller({} as any);
      const result = await caller.getAllUsageStats();

      expect(result.stats.length).toBe(2);
      expect(result.stats[0].apiKey).toBe("sk_test_1");
      expect(result.stats[1].apiKey).toBe("sk_test_2");
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", async () => {
      const caller = monitoringRouter.createCaller({} as any);

      // Test with invalid input
      try {
        await caller.checkRateLimit({
          apiKey: "",
          status: "",
        });
      } catch (error) {
        // Error is expected for invalid input
        expect(error).toBeDefined();
      }
    });
  });
});
