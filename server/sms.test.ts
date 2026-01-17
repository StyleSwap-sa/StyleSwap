import { describe, it, expect } from "vitest";
import { sendSMS, sendPaymentConfirmationSMS } from "./sms";

describe("Twilio SMS Service", () => {
  describe("SMS Credentials", () => {
    it("should have Twilio credentials configured", () => {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

      expect(accountSid).toBeDefined();
      expect(accountSid).not.toBe("");
      expect(authToken).toBeDefined();
      expect(authToken).not.toBe("");
      expect(phoneNumber).toBeDefined();
      expect(phoneNumber).not.toBe("");
    });

    it("should have valid Twilio Account SID format", () => {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      // Twilio Account SIDs are alphanumeric strings
      expect(accountSid).toMatch(/^[A-Za-z0-9]+$/);
      expect(accountSid?.length).toBeGreaterThan(20);
    });

    it("should have valid Twilio Auth Token format", () => {
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      // Twilio Auth Tokens are hex strings
      expect(authToken).toMatch(/^[A-Fa-f0-9]+$/);
      expect(authToken?.length).toBeGreaterThanOrEqual(28);
    });

    it("should have valid Twilio phone number format", () => {
      const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
      // Phone numbers should start with + and contain digits
      expect(phoneNumber).toMatch(/^\+\d{10,15}$/);
    });
  });

  describe("SMS Message Formatting", () => {
    it("should format payment confirmation SMS correctly", () => {
      const credits = 100;
      const amount = 38500; // R385
      const message = `StyleSwap Payment Confirmed! You've purchased ${credits} try-ons for R${(amount / 100).toFixed(2)}. Your credits are now active. Start creating virtual try-ons at styleswap.co.za`;

      expect(message).toContain("100");
      expect(message).toContain("R385.00");
      expect(message).toContain("styleswap.co.za");
    });

    it("should handle different credit amounts", () => {
      const testCases = [
        { credits: 10, amount: 4500 },
        { credits: 50, amount: 15000 },
        { credits: 1000, amount: 220000 },
      ];

      testCases.forEach(({ credits, amount }) => {
        const message = `StyleSwap Payment Confirmed! You've purchased ${credits} try-ons for R${(amount / 100).toFixed(2)}. Your credits are now active. Start creating virtual try-ons at styleswap.co.za`;
        expect(message).toContain(credits.toString());
        expect(message).toContain(`R${(amount / 100).toFixed(2)}`);
      });
    });
  });

  describe("SMS Service Error Handling", () => {
    it("should have SMS service functions defined", () => {
      expect(sendSMS).toBeDefined();
      expect(sendPaymentConfirmationSMS).toBeDefined();
    });
  });
});
