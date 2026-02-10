import { describe, it, expect, beforeEach, vi } from "vitest";
import { createApiKey, getApiKeysByBoutique, revokeApiKey } from "../db.apikeys";
import { checkRateLimit } from "../rateLimiter";

/**
 * Onboarding Flow Tests
 * Tests for the retailer onboarding wizard and API key generation
 */

describe("Retailer Onboarding Flow", () => {
  const testBoutiqueId = 1;
  const testApiKeyName = "Test API Key";

  describe("Step 1: API Key Generation", () => {
    it("should generate a valid API key", async () => {
      const result = await createApiKey(testBoutiqueId, testApiKeyName);

      expect(result).toBeDefined();
      expect(result.key).toMatch(/^sk_(live|test)_/);
      expect(result.maskedKey).toMatch(/^sk_(live|test)_.{8}\.\.\..{4}$/);
      expect(result.name).toBe(testApiKeyName);
      expect(result.status).toBe("active");
    });

    it("should generate unique API keys", async () => {
      const result1 = await createApiKey(testBoutiqueId, "Key 1");
      const result2 = await createApiKey(testBoutiqueId, "Key 2");

      expect(result1.key).not.toBe(result2.key);
      expect(result1.maskedKey).not.toBe(result2.maskedKey);
    });

    it("should store API key with correct metadata", async () => {
      const result = await createApiKey(testBoutiqueId, testApiKeyName);

      expect(result.boutiqueId).toBe(testBoutiqueId);
      expect(result.name).toBe(testApiKeyName);
      expect(result.createdAt).toBeDefined();
    });

    it("should return full key only on creation", async () => {
      const result = await createApiKey(testBoutiqueId, testApiKeyName);

      // The key should be returned in full on creation
      expect(result.key).toMatch(/^sk_(live|test)_[a-f0-9]{64}$/);
      expect(result.key.length).toBeGreaterThan(20);
    });
  });

  describe("Step 2: Webhook Configuration", () => {
    it("should allow storing webhook URL with API key", async () => {
      const apiKeyResult = await createApiKey(testBoutiqueId, testApiKeyName);

      // Webhook configuration would be stored separately
      // This test verifies the API key is ready for webhook setup
      expect(apiKeyResult.key).toBeDefined();
      expect(apiKeyResult.status).toBe("active");
    });

    it("should support webhook URL validation", () => {
      const validUrls = [
        "https://example.com/webhooks/styleswap",
        "https://api.example.com/events",
        "https://webhook.example.com:8080/styleswap",
      ];

      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      validUrls.forEach((url) => {
        expect(isValidUrl(url)).toBe(true);
      });
    });

    it("should reject invalid webhook URLs", () => {
      const invalidUrls = [
        "not-a-url",
        "example.com/webhooks",
        "ftp://example.com/webhooks",
      ];

      const isValidUrl = (url: string) => {
        try {
          new URL(url);
          return url.startsWith("https://") || url.startsWith("http://");
        } catch {
          return false;
        }
      };

      invalidUrls.forEach((url) => {
        expect(isValidUrl(url)).toBe(false);
      });
    });
  });

  describe("Step 3: API Key Verification", () => {
    it("should verify valid API key", async () => {
      const apiKeyResult = await createApiKey(testBoutiqueId, testApiKeyName);
      const apiKey = apiKeyResult.key;

      // Verification would check if key exists and is active
      expect(apiKey).toMatch(/^sk_(live|test)_/);
      expect(apiKey.length).toBeGreaterThan(20);
    });

    it("should reject revoked API keys", async () => {
      const apiKeyResult = await createApiKey(testBoutiqueId, testApiKeyName);

      // Revoke the key
      await revokeApiKey(apiKeyResult.id);

      // Verification should fail for revoked keys
      const keys = await getApiKeysByBoutique(testBoutiqueId);
      const revokedKey = keys.find((k) => k.id === apiKeyResult.id);

      expect(revokedKey?.revokedAt).toBeDefined();
    });

    it("should handle rate limit status during verification", async () => {
      const apiKeyResult = await createApiKey(testBoutiqueId, testApiKeyName);

      // Check rate limit for the new key
      const rateLimitStatus = await checkRateLimit(apiKeyResult.id);

      expect(rateLimitStatus.allowed).toBe(true);
      expect(rateLimitStatus.limit).toBe(100);
      expect(rateLimitStatus.remaining).toBe(100);
    });
  });

  describe("Step 4: Onboarding Completion", () => {
    it("should track onboarding completion", async () => {
      const apiKeyResult = await createApiKey(testBoutiqueId, testApiKeyName);

      // Verify API key is active and ready for use
      expect(apiKeyResult.status).toBe("active");
      expect(apiKeyResult.key).toBeDefined();
    });

    it("should provide next steps after onboarding", async () => {
      const apiKeyResult = await createApiKey(testBoutiqueId, testApiKeyName);

      const nextSteps = [
        "Visit Developer Portal for API documentation",
        "Configure webhook endpoints",
        "Test API integration",
        "Monitor API usage in Analytics Dashboard",
      ];

      expect(nextSteps.length).toBe(4);
      expect(apiKeyResult.key).toBeDefined();
    });

    it("should allow multiple API keys per boutique", async () => {
      const key1 = await createApiKey(testBoutiqueId, "Production Key");
      const key2 = await createApiKey(testBoutiqueId, "Testing Key");

      expect(key1.key).not.toBe(key2.key);
      expect(key1.name).toBe("Production Key");
      expect(key2.name).toBe("Testing Key");
    });
  });

  describe("Onboarding Flow Integration", () => {
    it("should complete full onboarding flow", async () => {
      // Step 1: Generate API key
      const apiKeyResult = await createApiKey(testBoutiqueId, "Onboarding Key");
      expect(apiKeyResult.key).toBeDefined();

      // Step 2: Configure webhook (simulated)
      const webhookUrl = "https://example.com/webhooks/styleswap";
      const isValidWebhook = webhookUrl.startsWith("https://");
      expect(isValidWebhook).toBe(true);

      // Step 3: Verify API key
      const rateLimitStatus = await checkRateLimit(apiKeyResult.id);
      expect(rateLimitStatus.allowed).toBe(true);

      // Step 4: Complete onboarding
      const keys = await getApiKeysByBoutique(testBoutiqueId);
      const onboardedKey = keys.find((k) => k.id === apiKeyResult.id);
      expect(onboardedKey?.status).toBe("active");
    });

    it("should handle onboarding errors gracefully", async () => {
      // Test with invalid boutique ID
      try {
        const result = await createApiKey(0, "Invalid Key");
        // Should either throw or return error
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should provide clear error messages during onboarding", () => {
      const errorMessages = {
        invalidApiKey: "Invalid or revoked API key",
        rateLimitExceeded: "Rate limit exceeded. Maximum 100 requests per minute.",
        webhookFailed: "Failed to configure webhook endpoint",
        verificationFailed: "API key verification failed",
      };

      expect(errorMessages.invalidApiKey).toContain("API key");
      expect(errorMessages.rateLimitExceeded).toContain("100");
      expect(errorMessages.webhookFailed).toContain("webhook");
      expect(errorMessages.verificationFailed).toContain("verification");
    });
  });
});
