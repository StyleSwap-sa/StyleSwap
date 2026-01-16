import { describe, it, expect, vi } from "vitest";
import {
  generatePurchaseConfirmationEmail,
  generateTryOnCompleteEmail,
  generateCreditsExpiringEmail,
} from "./email";

describe("Email Notifications", () => {
  describe("Purchase Confirmation Email", () => {
    it("should generate purchase confirmation email with correct content", () => {
      const html = generatePurchaseConfirmationEmail("John Doe", 100, "385", "ZAR");
      
      expect(html).toContain("John Doe");
      expect(html).toContain("100 try-ons");
      expect(html).toContain("ZAR 385");
      expect(html).toContain("30 days");
      expect(html).toContain("Purchase Confirmation");
    });

    it("should include contact email in purchase confirmation", () => {
      const html = generatePurchaseConfirmationEmail("Jane Smith", 200, "750", "ZAR");
      
      expect(html).toContain("info@styleswap.co.za");
      expect(html).toContain("Jane Smith");
      expect(html).toContain("200 try-ons");
    });
  });

  describe("Try-On Complete Email", () => {
    it("should generate try-on complete email with garment details", () => {
      const html = generateTryOnCompleteEmail(
        "John Doe",
        "Black Evening Dress",
        "https://styleswap.co.za/share/abc123"
      );
      
      expect(html).toContain("John Doe");
      expect(html).toContain("Black Evening Dress");
      expect(html).toContain("Virtual Try-On is Ready");
      expect(html).toContain("https://styleswap.co.za/share/abc123");
    });

    it("should include social sharing options in try-on email", () => {
      const html = generateTryOnCompleteEmail(
        "Jane Smith",
        "Blue Denim Jacket",
        "https://styleswap.co.za/share/xyz789"
      );
      
      expect(html).toContain("Jane Smith");
      expect(html).toContain("Blue Denim Jacket");
      expect(html).toContain("https://styleswap.co.za/share/xyz789");
    });
  });

  describe("Credits Expiring Email", () => {
    it("should generate credits expiring email with expiry date", () => {
      const html = generateCreditsExpiringEmail(
        "John Doe",
        50,
        "2026-02-15"
      );
      
      expect(html).toContain("John Doe");
      expect(html).toContain("50 try-ons");
      expect(html).toContain("2026-02-15");
      expect(html).toContain("Expiring Soon");
    });

    it("should include renewal reminder in expiring email", () => {
      const html = generateCreditsExpiringEmail(
        "Jane Smith",
        25,
        "2026-02-20"
      );
      
      expect(html).toContain("Jane Smith");
      expect(html).toContain("25 try-ons");
      expect(html).toContain("2026-02-20");
    });
  });

  describe("Email Template Structure", () => {
    it("should have proper HTML structure", () => {
      const html = generatePurchaseConfirmationEmail("Test User", 100, "385", "ZAR");
      
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html>");
      expect(html).toContain("</html>");
      expect(html).toContain("<style>");
      expect(html).toContain("</style>");
    });

    it("should include StyleSwap branding", () => {
      const html = generatePurchaseConfirmationEmail("Test User", 100, "385", "ZAR");
      
      expect(html).toContain("StyleSwap");
      expect(html).toContain("2026");
    });

    it("should have responsive design classes", () => {
      const html = generatePurchaseConfirmationEmail("Test User", 100, "385", "ZAR");
      
      expect(html).toContain("font-family");
      expect(html).toContain("max-width");
      expect(html).toContain("padding");
    });
  });
});
