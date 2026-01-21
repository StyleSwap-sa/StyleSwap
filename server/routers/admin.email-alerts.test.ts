import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sendCreditAlertEmail, generateCreditAlertEmail } from "../email";

describe("Credit Alert Email System", () => {
  describe("Email Template Generation", () => {
    it("should generate 80% alert email with critical styling", () => {
      const html = generateCreditAlertEmail(
        "John Doe",
        "Fashion Boutique",
        80,
        200,
        1000,
        "80"
      );

      expect(html).toContain("CRITICAL");
      expect(html).toContain("Fashion Boutique");
      expect(html).toContain("80%");
      expect(html).toContain("dc3545"); // Red color for critical
      expect(html).toContain("200");
      expect(html).toContain("1000");
    });

    it("should generate 50% alert email with warning styling", () => {
      const html = generateCreditAlertEmail(
        "Jane Smith",
        "Luxury Boutique",
        50,
        500,
        1000,
        "50"
      );

      expect(html).toContain("WARNING");
      expect(html).toContain("Luxury Boutique");
      expect(html).toContain("50%");
      expect(html).toContain("ff9800"); // Orange color for warning
    });

    it("should generate 20% alert email with notice styling", () => {
      const html = generateCreditAlertEmail(
        "Bob Johnson",
        "Designer Boutique",
        20,
        200,
        1000,
        "20"
      );

      expect(html).toContain("NOTICE");
      expect(html).toContain("Designer Boutique");
      expect(html).toContain("20%");
      expect(html).toContain("ffc107"); // Yellow color for notice
    });

    it("should generate 10% alert email with info styling", () => {
      const html = generateCreditAlertEmail(
        "Alice Brown",
        "Premium Boutique",
        10,
        100,
        1000,
        "10"
      );

      expect(html).toContain("INFO");
      expect(html).toContain("Premium Boutique");
      expect(html).toContain("10%");
      expect(html).toContain("17a2b8"); // Blue color for info
    });

    it("should include purchase button in email", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "Test Boutique",
        50,
        500,
        1000,
        "50"
      );

      expect(html).toContain("Purchase Credits Now");
      expect(html).toContain("styleswap.co.za/dashboard/credits");
    });

    it("should include boutique statistics in email", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "Test Boutique",
        75,
        750,
        1000,
        "80"
      );

      expect(html).toContain("Credits Used:");
      expect(html).toContain("Credits Remaining:");
      expect(html).toContain("Usage Percentage:");
      expect(html).toContain("750");
      expect(html).toContain("250"); // 1000 - 750
    });

    it("should format email with proper HTML structure", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "Test Boutique",
        50,
        500,
        1000,
        "50"
      );

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html>");
      expect(html).toContain("<body>");
      expect(html).toContain("</body>");
      expect(html).toContain("</html>");
    });

    it("should include footer with copyright", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "Test Boutique",
        50,
        500,
        1000,
        "50"
      );

      expect(html).toContain("2026 StyleSwap");
      expect(html).toContain("support@styleswap.co.za");
    });
  });

  describe("Email Alert Thresholds", () => {
    it("should handle 0% usage", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "Test Boutique",
        0,
        0,
        1000,
        "10"
      );

      expect(html).toContain("0%");
      expect(html).toContain("0");
      expect(html).toContain("1000");
    });

    it("should handle 100% usage", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "Test Boutique",
        100,
        1000,
        1000,
        "80"
      );

      expect(html).toContain("100%");
      expect(html).toContain("1000");
      expect(html).toContain("0"); // Remaining credits
    });

    it("should handle fractional percentages", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "Test Boutique",
        33.33,
        333,
        1000,
        "20"
      );

      expect(html).toContain("33.33%");
    });
  });

  describe("Email Content Validation", () => {
    it("should include user name in greeting", () => {
      const html = generateCreditAlertEmail(
        "CustomUserName",
        "Test Boutique",
        50,
        500,
        1000,
        "50"
      );

      expect(html).toContain("Hi <strong>CustomUserName</strong>");
    });

    it("should include boutique name in header", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "CustomBoutiqueName",
        50,
        500,
        1000,
        "50"
      );

      expect(html).toContain("Boutique: CustomBoutiqueName");
    });

    it("should provide action recommendations", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "Test Boutique",
        50,
        500,
        1000,
        "50"
      );

      expect(html).toContain("What should you do?");
      expect(html).toContain("Monitor your credit usage");
      expect(html).toContain("Consider purchasing additional credits");
    });
  });

  describe("Email Styling", () => {
    it("should include proper CSS styling", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "Test Boutique",
        50,
        500,
        1000,
        "50"
      );

      expect(html).toContain("<style>");
      expect(html).toContain("font-family: Arial, sans-serif");
      expect(html).toContain("max-width: 600px");
      expect(html).toContain("border-radius");
    });

    it("should have responsive design", () => {
      const html = generateCreditAlertEmail(
        "Test User",
        "Test Boutique",
        50,
        500,
        1000,
        "50"
      );

      expect(html).toContain("max-width: 600px");
      expect(html).toContain("padding");
    });
  });
});
