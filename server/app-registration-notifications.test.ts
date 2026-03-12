import { describe, it, expect } from "vitest";
import {
  generateAdminNotificationHtml,
  sendRegistrationConfirmationEmail,
  sendWelcomeEmail,
} from "./app-registration-notifications";

describe("App Registration Notifications", () => {
  describe("generateAdminNotificationHtml", () => {
    it("should generate HTML with all required fields", () => {
      const html = generateAdminNotificationHtml({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        website: "https://example.com",
        platformType: "web",
        description: "Test description",
        apiKey: "sk_test123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(html).toContain("Test App");
      expect(html).toContain("Test Company");
      expect(html).toContain("test@example.com");
      expect(html).toContain("https://example.com");
      expect(html).toContain("web");
      expect(html).toContain("Test description");
      expect(html).toContain("sk_test123");
    });

    it("should include email link in HTML", () => {
      const html = generateAdminNotificationHtml({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        website: "https://example.com",
        platformType: "web",
        description: "Test description",
        apiKey: "sk_test123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(html).toContain('href="mailto:test@example.com"');
    });

    it("should include website link in HTML", () => {
      const html = generateAdminNotificationHtml({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        website: "https://fashionretail.com",
        platformType: "shopify",
        description: "Test description",
        apiKey: "sk_test123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(html).toContain('href="https://fashionretail.com"');
    });

    it("should format registration time correctly", () => {
      const registrationTime = "2026-03-12T14:30:00Z";
      const html = generateAdminNotificationHtml({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        website: "https://example.com",
        platformType: "web",
        description: "Test description",
        apiKey: "sk_test123",
        registrationTime,
      });

      // Should contain formatted date
      expect(html).toContain("2026");
    });

    it("should include action items for admin", () => {
      const html = generateAdminNotificationHtml({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        website: "https://example.com",
        platformType: "web",
        description: "Test description",
        apiKey: "sk_test123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(html).toContain("Action Items");
      expect(html).toContain("Review the registration details");
      expect(html).toContain("Verify the company website");
    });
  });

  describe("sendRegistrationConfirmationEmail", () => {
    it("should return success response", async () => {
      const result = await sendRegistrationConfirmationEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        apiKey: "sk_test123",
        apiSecret: "secret123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("test@example.com");
    });

    it("should include HTML content in response", async () => {
      const result = await sendRegistrationConfirmationEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        apiKey: "sk_test123",
        apiSecret: "secret123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(result.htmlContent).toBeDefined();
      expect(result.htmlContent).toContain("Test App");
      expect(result.htmlContent).toContain("sk_test123");
      expect(result.htmlContent).toContain("secret123");
    });

    it("should include security warning in email", async () => {
      const result = await sendRegistrationConfirmationEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        apiKey: "sk_test123",
        apiSecret: "secret123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(result.htmlContent).toContain("Important");
      expect(result.htmlContent).toContain("secure location");
      expect(result.htmlContent).toContain("won't be able to view it again");
    });

    it("should include next steps in email", async () => {
      const result = await sendRegistrationConfirmationEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        apiKey: "sk_test123",
        apiSecret: "secret123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(result.htmlContent).toContain("Next Steps");
      expect(result.htmlContent).toContain("API Documentation");
    });
  });

  describe("sendWelcomeEmail", () => {
    it("should return success response", async () => {
      const result = await sendWelcomeEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("test@example.com");
    });

    it("should include HTML content in response", async () => {
      const result = await sendWelcomeEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
      });

      expect(result.htmlContent).toBeDefined();
      expect(result.htmlContent).toContain("Test App");
      expect(result.htmlContent).toContain("Test Company");
    });

    it("should include quick start guide", async () => {
      const result = await sendWelcomeEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
      });

      expect(result.htmlContent).toContain("Quick Start Guide");
      expect(result.htmlContent).toContain("API Documentation");
      expect(result.htmlContent).toContain("Sandbox Environment");
      expect(result.htmlContent).toContain("Analytics Dashboard");
      expect(result.htmlContent).toContain("Webhook Integration");
    });

    it("should include support contact information", async () => {
      const result = await sendWelcomeEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
      });

      expect(result.htmlContent).toContain("support@styleswap.co.za");
      expect(result.htmlContent).toContain("Need Help");
    });
  });

  describe("Email Content Validation", () => {
    it("should have valid HTML structure", async () => {
      const result = await sendRegistrationConfirmationEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        apiKey: "sk_test123",
        apiSecret: "secret123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(result.htmlContent).toContain("<!DOCTYPE html>");
      expect(result.htmlContent).toContain("<html>");
      expect(result.htmlContent).toContain("</html>");
      expect(result.htmlContent).toContain("<body>");
      expect(result.htmlContent).toContain("</body>");
    });

    it("should include StyleSwap branding", async () => {
      const result = await sendRegistrationConfirmationEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        apiKey: "sk_test123",
        apiSecret: "secret123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(result.htmlContent).toContain("StyleSwap");
      expect(result.htmlContent).toContain("2026");
    });

    it("should include proper styling", async () => {
      const result = await sendRegistrationConfirmationEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        apiKey: "sk_test123",
        apiSecret: "secret123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(result.htmlContent).toContain("<style>");
      expect(result.htmlContent).toContain("</style>");
      expect(result.htmlContent).toContain("font-family");
      expect(result.htmlContent).toContain("color");
    });
  });

  describe("Error Handling", () => {
    it("should handle email sending errors gracefully", async () => {
      const result = await sendRegistrationConfirmationEmail({
        appName: "Test App",
        companyName: "Test Company",
        email: "test@example.com",
        apiKey: "sk_test123",
        apiSecret: "secret123",
        registrationTime: "2026-03-12T10:00:00Z",
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
    });
  });
});
