import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateApiCredentials, registerApp } from "./app-registration";
import * as notificationModule from "./_core/notification";

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: 1,
            appName: "Test App",
            companyName: "Test Company",
            email: "test@example.com",
            website: "https://example.com",
            platformType: "web",
            description: "Test description",
            apiKey: "sk_test123",
            apiSecret: "secret123",
            status: "active",
            createdAt: new Date().toISOString(),
          },
        ]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  }),
}));

describe("App Registration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateApiCredentials", () => {
    it("should generate API key with correct prefix", () => {
      const { apiKey } = generateApiCredentials();
      expect(apiKey).toMatch(/^sk_[a-f0-9]{48}$/);
    });

    it("should generate API secret as hex string", () => {
      const { apiSecret } = generateApiCredentials();
      expect(apiSecret).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should generate unique credentials each time", () => {
      const creds1 = generateApiCredentials();
      const creds2 = generateApiCredentials();
      expect(creds1.apiKey).not.toBe(creds2.apiKey);
      expect(creds1.apiSecret).not.toBe(creds2.apiSecret);
    });
  });

  describe("registerApp", () => {
    it("should successfully register an app", async () => {
      const result = await registerApp({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        website: "https://example.com",
        platformType: "web",
        description: "Test description for the app",
      });

      expect(result.success).toBe(true);
      expect(result.registration).toBeDefined();
      expect(result.registration?.appName).toBe("Test App");
      expect(result.registration?.email).toBe("test@example.com");
    });

    it("should generate API credentials", async () => {
      const result = await registerApp({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        website: "https://example.com",
        platformType: "web",
        description: "Test description for the app",
      });

      expect(result.registration?.apiKey).toBeDefined();
      expect(result.registration?.apiSecret).toBeDefined();
      expect(result.registration?.apiKey).toMatch(/^sk_/);
    });

    it("should send admin notification", async () => {
      await registerApp({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        website: "https://example.com",
        platformType: "web",
        description: "Test description for the app",
      });

      expect(notificationModule.notifyOwner).toHaveBeenCalled();
      const callArgs = (notificationModule.notifyOwner as any).mock.calls[0][0];
      expect(callArgs.title).toContain("New App Registration");
      expect(callArgs.content).toContain("Test App");
      expect(callArgs.content).toContain("Test Company");
    });

    it("should set correct status for new registration", async () => {
      const result = await registerApp({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        website: "https://example.com",
        platformType: "web",
        description: "Test description for the app",
      });

      expect(result.registration?.status).toBe("active");
    });

    it("should return registration with correct fields", async () => {
      const result = await registerApp({
        appName: "MyApp",
        companyName: "MyCompany",
        email: "contact@mycompany.com",
        website: "https://mycompany.com",
        platformType: "shopify",
        description: "Shopify integration for virtual try-ons",
      });

      expect(result.registration).toHaveProperty("id");
      expect(result.registration).toHaveProperty("appName");
      expect(result.registration).toHaveProperty("email");
      expect(result.registration).toHaveProperty("apiKey");
      expect(result.registration).toHaveProperty("apiSecret");
      expect(result.registration).toHaveProperty("status");
      expect(result.registration).toHaveProperty("createdAt");
    });
  });

  describe("Admin Notifications", () => {
    it("should include app details in admin notification", async () => {
      await registerApp({
        appName: "Fashion Store",
        companyName: "Fashion Retail Inc",
        email: "dev@fashionretail.com",
        website: "https://fashionretail.com",
        platformType: "woocommerce",
        description: "WooCommerce integration for virtual fitting room",
      });

      const callArgs = (notificationModule.notifyOwner as any).mock.calls[0][0];
      expect(callArgs.content).toContain("Fashion Store");
      expect(callArgs.content).toContain("Fashion Retail Inc");
      expect(callArgs.content).toContain("dev@fashionretail.com");
      expect(callArgs.content).toContain("woocommerce");
    });

    it("should include API key in admin notification", async () => {
      await registerApp({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        website: "https://example.com",
        platformType: "web",
        description: "Test description for the app",
      });

      const callArgs = (notificationModule.notifyOwner as any).mock.calls[0][0];
      expect(callArgs.content).toContain("sk_");
    });
  });

  describe("Error Handling", () => {
    it("should throw error if database connection fails", async () => {
      // Mock database connection failure
      const dbModule = await import("./db");
      vi.spyOn(dbModule, "getDb").mockResolvedValueOnce(null);

      await expect(
        registerApp({
          appName: "Test App",
          companyName: "Test Company",
          email: "test@example.com",
          website: "https://example.com",
          platformType: "web",
          description: "Test description for the app",
        })
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("Platform Types", () => {
    it("should accept all valid platform types", async () => {
      const platformTypes = ["web", "mobile", "shopify", "woocommerce", "custom"];

      for (const platformType of platformTypes) {
        const result = await registerApp({
          appName: `App for ${platformType}`,
          companyName: "Test Company",
          email: "test@example.com",
          website: "https://example.com",
          platformType: platformType as any,
          description: "Test description for the app",
        });

        expect(result.success).toBe(true);
      }
    });
  });
});
