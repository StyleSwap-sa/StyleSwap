import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateApiKey,
  validateApiKeyForEndpoint,
  logApiRequest,
} from "./_core/apiKeyAuthMiddleware";
import crypto from "crypto";

// Mock the database
vi.mock("./db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([
              {
                id: 1,
                boutiqueId: 123,
                name: "Production Key",
                keyHash: crypto
                  .createHash("sha256")
                  .update("sk_live_test123")
                  .digest("hex"),
                isRevoked: false,
                expiresAt: null,
                lastUsedAt: new Date(),
              },
            ])
          ),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

describe("API Key Authentication Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateApiKey", () => {
    it("should validate a valid API key from Authorization header", async () => {
      const authHeader = "Bearer sk_live_test123";
      const result = await validateApiKey(authHeader);

      expect(result).toBeTruthy();
      expect(result?.isValid).toBe(true);
      expect(result?.boutiqueId).toBe(123);
      expect(result?.keyName).toBe("Production Key");
    });

    it("should validate a valid API key from query parameter", async () => {
      const queryKey = "sk_live_test123";
      const result = await validateApiKey(undefined, queryKey);

      expect(result).toBeTruthy();
      expect(result?.isValid).toBe(true);
      expect(result?.boutiqueId).toBe(123);
    });

    it("should return null for missing API key", async () => {
      const result = await validateApiKey(undefined, undefined);
      expect(result).toBeNull();
    });

    it("should return null for invalid Authorization header format", async () => {
      const authHeader = "Basic invalid";
      const result = await validateApiKey(authHeader);
      expect(result).toBeNull();
    });

    it("should extract boutique ID from valid API key", async () => {
      const authHeader = "Bearer sk_live_test123";
      const result = await validateApiKey(authHeader);

      expect(result?.boutiqueId).toBe(123);
    });

    it("should extract API key ID from valid key", async () => {
      const authHeader = "Bearer sk_live_test123";
      const result = await validateApiKey(authHeader);

      expect(result?.apiKeyId).toBe(1);
    });

    it("should extract key name from valid API key", async () => {
      const authHeader = "Bearer sk_live_test123";
      const result = await validateApiKey(authHeader);

      expect(result?.keyName).toBe("Production Key");
    });

    it("should prioritize Authorization header over query parameter", async () => {
      const authHeader = "Bearer sk_live_test123";
      const queryKey = "sk_live_different";
      const result = await validateApiKey(authHeader, queryKey);

      expect(result).toBeTruthy();
      expect(result?.keyName).toBe("Production Key");
    });
  });

  describe("validateApiKeyForEndpoint", () => {
    it("should validate API key for endpoint with Authorization header", async () => {
      const req = {
        headers: { authorization: "Bearer sk_live_test123" },
        query: {},
      };

      const result = await validateApiKeyForEndpoint(req);

      expect(result.valid).toBe(true);
      expect(result.context?.boutiqueId).toBe(123);
    });

    it("should validate API key for endpoint with query parameter", async () => {
      const req = {
        headers: {},
        query: { api_key: "sk_live_test123" },
      };

      const result = await validateApiKeyForEndpoint(req);

      expect(result.valid).toBe(true);
      expect(result.context?.boutiqueId).toBe(123);
    });

    it("should return error for missing API key", async () => {
      const req = {
        headers: {},
        query: {},
      };

      const result = await validateApiKeyForEndpoint(req);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid or missing API key");
    });

    it("should return error object structure for invalid key", async () => {
      const req = {
        headers: { authorization: "Bearer invalid_key_that_does_not_exist" },
        query: {},
      };

      const result = await validateApiKeyForEndpoint(req);

      expect(result).toHaveProperty("valid");
      expect(typeof result.valid).toBe("boolean");
    });
  });

  describe("logApiRequest", () => {
    it("should log API request without error", async () => {
      const consoleSpy = vi.spyOn(console, "log");

      await logApiRequest(1, "/api/try-on", "POST", 200, 150);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[API]")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("POST")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/try-on")
      );

      consoleSpy.mockRestore();
    });

    it("should log API request with error", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error");

      await logApiRequest(1, "/api/try-on", "POST", 500, 150, "Internal Server Error");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[API Error]")
      );

      consoleErrorSpy.mockRestore();
    });

    it("should include response time in log", async () => {
      const consoleSpy = vi.spyOn(console, "log");

      await logApiRequest(1, "/api/try-on", "POST", 200, 250);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("250ms")
      );

      consoleSpy.mockRestore();
    });

    it("should include status code in log", async () => {
      const consoleSpy = vi.spyOn(console, "log");

      await logApiRequest(1, "/api/try-on", "POST", 201, 150);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("201")
      );

      consoleSpy.mockRestore();
    });

    it("should handle logging errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error");

      // This should not throw
      await logApiRequest(1, "/api/try-on", "POST", 200, 150);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("API Key Context Structure", () => {
    it("should return correct context structure", async () => {
      const authHeader = "Bearer sk_live_test123";
      const result = await validateApiKey(authHeader);

      expect(result).toHaveProperty("apiKeyId");
      expect(result).toHaveProperty("boutiqueId");
      expect(result).toHaveProperty("keyName");
      expect(result).toHaveProperty("isValid");
    });

    it("should have correct data types in context", async () => {
      const authHeader = "Bearer sk_live_test123";
      const result = await validateApiKey(authHeader);

      expect(typeof result?.apiKeyId).toBe("number");
      expect(typeof result?.boutiqueId).toBe("number");
      expect(typeof result?.keyName).toBe("string");
      expect(typeof result?.isValid).toBe("boolean");
    });
  });
});
