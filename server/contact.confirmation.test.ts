import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateEmailTemplate } from "./email-templates";

describe("Email Confirmation System", () => {
  describe("generateEmailTemplate", () => {
    it("should generate general inquiry email template", () => {
      const template = generateEmailTemplate("general", "John Doe");
      
      expect(template.subject).toBe("Thank you for contacting StyleSwap");
      expect(template.html).toContain("John Doe");
      expect(template.html).toContain("24 hours");
      expect(template.html).toContain("info@styleswap.co.za");
    });

    it("should generate enterprise sales email template", () => {
      const template = generateEmailTemplate("enterprise", "Jane Smith");
      
      expect(template.subject).toBe("Enterprise Sales Inquiry - StyleSwap");
      expect(template.html).toContain("Jane Smith");
      expect(template.html).toContain("Enterprise Retail Pro");
      expect(template.html).toContain("Dedicated account manager");
      expect(template.html).toContain("sales@styleswap.co.za");
    });

    it("should generate API integration email template", () => {
      const template = generateEmailTemplate("integration", "Bob Johnson");
      
      expect(template.subject).toBe("API Integration Inquiry - StyleSwap");
      expect(template.html).toContain("Bob Johnson");
      expect(template.html).toContain("API documentation");
      expect(template.html).toContain("Sandbox environment");
      expect(template.html).toContain("5 business days");
    });

    it("should generate support email template", () => {
      const template = generateEmailTemplate("support", "Alice Brown");
      
      expect(template.subject).toBe("Support Request - StyleSwap");
      expect(template.html).toContain("Alice Brown");
      expect(template.html).toContain("2 hours");
      expect(template.html).toContain("support ticket reference");
    });

    it("should include customer name in all templates", () => {
      const customerName = "Test Customer";
      const inquiryTypes = ["general", "enterprise", "integration", "support"] as const;
      
      inquiryTypes.forEach((type) => {
        const template = generateEmailTemplate(type, customerName);
        expect(template.html).toContain(customerName);
      });
    });

    it("should include StyleSwap branding in all templates", () => {
      const inquiryTypes = ["general", "enterprise", "integration", "support"] as const;
      
      inquiryTypes.forEach((type) => {
        const template = generateEmailTemplate(type, "Test");
        expect(template.html).toContain("StyleSwap");
        expect(template.html).toContain("ff6b35"); // Orange color hex
      });
    });

    it("should include proper HTML structure", () => {
      const template = generateEmailTemplate("general", "Test");
      
      expect(template.html).toContain("<div");
      expect(template.html).toContain("</div>");
      expect(template.html).toContain("<p>");
      expect(template.html).toContain("</p>");
      expect(template.html).toContain("<ul>");
      expect(template.html).toContain("</ul>");
      expect(template.html).toContain("<li>");
      expect(template.html).toContain("</li>");
    });

    it("should include call-to-action links", () => {
      const template = generateEmailTemplate("general", "Test");
      
      expect(template.html).toContain("href=");
      expect(template.html).toContain("styleswap.co.za");
    });

    it("should have unique subjects for each inquiry type", () => {
      const subjects = new Set([
        generateEmailTemplate("general", "Test").subject,
        generateEmailTemplate("enterprise", "Test").subject,
        generateEmailTemplate("integration", "Test").subject,
        generateEmailTemplate("support", "Test").subject,
      ]);
      
      expect(subjects.size).toBe(4);
    });

    it("should include response time expectations", () => {
      const generalTemplate = generateEmailTemplate("general", "Test");
      const enterpriseTemplate = generateEmailTemplate("enterprise", "Test");
      const integrationTemplate = generateEmailTemplate("integration", "Test");
      const supportTemplate = generateEmailTemplate("support", "Test");
      
      expect(generalTemplate.html).toContain("24 hours");
      expect(enterpriseTemplate.html).toContain("24 hours");
      expect(integrationTemplate.html).toContain("24 hours");
      expect(supportTemplate.html).toContain("2 hours");
    });
  });
});
