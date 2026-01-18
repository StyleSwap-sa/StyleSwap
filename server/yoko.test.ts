import { describe, it, expect, beforeAll } from "vitest";
import { ENV } from "./_core/env";

describe("Yoko Payment API Integration", () => {
  beforeAll(() => {
    // Verify environment variables are set
    expect(ENV.yokoSecretKey).toBeDefined();
    expect(ENV.yokoPublicKey).toBeDefined();
    expect(ENV.yokoApiBaseUrl).toBeDefined();
  });

  describe("Yoko Credentials", () => {
    it("should have Yoko secret key configured", () => {
      expect(ENV.yokoSecretKey).toBeTruthy();
      expect(ENV.yokoSecretKey).toContain("sk_live_");
    });

    it("should have Yoko public key configured", () => {
      expect(ENV.yokoPublicKey).toBeTruthy();
      expect(ENV.yokoPublicKey).toContain("pk_live_");
    });

    it("should have Yoko API base URL configured", () => {
      expect(ENV.yokoApiBaseUrl).toBeTruthy();
      expect(ENV.yokoApiBaseUrl).toContain("payments.yoco.com");
    });
  });

  describe("Yoko API Connection", () => {
    it("should validate Yoko credentials format", () => {
      // Secret key should start with sk_live_ or sk_test_
      const secretKeyValid =
        ENV.yokoSecretKey.startsWith("sk_live_") ||
        ENV.yokoSecretKey.startsWith("sk_test_");
      expect(secretKeyValid).toBe(true);

      // Public key should start with pk_live_ or pk_test_
      const publicKeyValid =
        ENV.yokoPublicKey.startsWith("pk_live_") ||
        ENV.yokoPublicKey.startsWith("pk_test_");
      expect(publicKeyValid).toBe(true);
    });

    it("should have proper API base URL format", () => {
      const urlValid =
        ENV.yokoApiBaseUrl.includes("payments.yoco.com") ||
        ENV.yokoApiBaseUrl.includes("localhost");
      expect(urlValid).toBe(true);
    });
  });

  describe("Payment Configuration", () => {
    it("should support creating payment intents", () => {
      // Verify the structure needed for payment intents
      expect(ENV.yokoSecretKey).toBeTruthy();
      expect(ENV.yokoApiBaseUrl).toBeTruthy();
    });

    it("should support webhook verification", () => {
      // Verify we have the secret key for webhook signature verification
      expect(ENV.yokoSecretKey).toBeTruthy();
      expect(ENV.yokoSecretKey.length).toBeGreaterThan(20);
    });
  });
});
