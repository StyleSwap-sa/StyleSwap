import { describe, it, expect, beforeEach } from "vitest";
import {
  generateWebhookSecret,
  generateWebhookSignature,
  verifyWebhookSignature,
  isValidWebhookUrl,
  isValidWebhookEvent,
  VALID_WEBHOOK_EVENTS,
} from "../webhook-service";

describe("Webhook Service", () => {
  describe("generateWebhookSecret", () => {
    it("should generate a 64-character hex string", () => {
      const secret = generateWebhookSecret();
      expect(secret).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(secret)).toBe(true);
    });

    it("should generate unique secrets", () => {
      const secret1 = generateWebhookSecret();
      const secret2 = generateWebhookSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe("Webhook Signature", () => {
    const secret = generateWebhookSecret();
    const payload = JSON.stringify({ id: 123, type: "test" });

    it("should generate consistent signatures", () => {
      const sig1 = generateWebhookSignature(payload, secret);
      const sig2 = generateWebhookSignature(payload, secret);
      expect(sig1).toBe(sig2);
    });

    it("should generate different signatures for different payloads", () => {
      const sig1 = generateWebhookSignature(payload, secret);
      const sig2 = generateWebhookSignature(JSON.stringify({ id: 456 }), secret);
      expect(sig1).not.toBe(sig2);
    });

    it("should verify valid signatures", () => {
      const signature = generateWebhookSignature(payload, secret);
      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it("should reject invalid signatures", () => {
      const signature = generateWebhookSignature(payload, secret);
      expect(verifyWebhookSignature(payload, "invalid_signature", secret)).toBe(false);
    });

    it("should reject signatures with wrong secret", () => {
      const signature = generateWebhookSignature(payload, secret);
      const wrongSecret = generateWebhookSecret();
      expect(verifyWebhookSignature(payload, signature, wrongSecret)).toBe(false);
    });
  });

  describe("URL Validation", () => {
    it("should accept valid HTTPS URLs", () => {
      expect(isValidWebhookUrl("https://example.com/webhook")).toBe(true);
      expect(isValidWebhookUrl("https://api.example.com/webhooks/styleswap")).toBe(true);
    });

    it("should accept valid HTTP URLs", () => {
      expect(isValidWebhookUrl("http://localhost:3000/webhook")).toBe(true);
      expect(isValidWebhookUrl("http://192.168.1.1:8080/webhook")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isValidWebhookUrl("not-a-url")).toBe(false);
      expect(isValidWebhookUrl("ftp://example.com/webhook")).toBe(false);
      expect(isValidWebhookUrl("")).toBe(false);
    });

    it("should reject URLs without protocol", () => {
      expect(isValidWebhookUrl("example.com/webhook")).toBe(false);
    });
  });

  describe("Event Validation", () => {
    it("should accept valid events", () => {
      VALID_WEBHOOK_EVENTS.forEach((event) => {
        expect(isValidWebhookEvent(event)).toBe(true);
      });
    });

    it("should reject invalid events", () => {
      expect(isValidWebhookEvent("invalid.event")).toBe(false);
      expect(isValidWebhookEvent("")).toBe(false);
      expect(isValidWebhookEvent("random")).toBe(false);
    });

    it("should have required events", () => {
      expect(VALID_WEBHOOK_EVENTS).toContain("app.registered");
      expect(VALID_WEBHOOK_EVENTS).toContain("tryon.completed");
      expect(VALID_WEBHOOK_EVENTS).toContain("tryon.failed");
      expect(VALID_WEBHOOK_EVENTS).toContain("credits.updated");
      expect(VALID_WEBHOOK_EVENTS).toContain("credits.low");
      expect(VALID_WEBHOOK_EVENTS).toContain("webhook.test");
    });
  });
});
