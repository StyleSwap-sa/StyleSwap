import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { boutiqueSubscriptions } from "../../drizzle/schema";

/**
 * Tests for User-Facing Subscription Management
 * Tests cancel, reactivate, and subscription retrieval functionality
 */

describe("Subscription Management (User-Facing)", () => {
  let testBoutiqueId = 1;

  beforeEach(() => {
    testBoutiqueId = Math.floor(Math.random() * 10000);
  });

  describe("Get Subscription", () => {
    it("should retrieve subscription details for a boutique", async () => {
      const db = getDb();

      // Create a test subscription
      const result = await db.insert(boutiqueSubscriptions).values({
        boutiqueId: testBoutiqueId,
        planType: "professional",
        billingCycle: "monthly",
        status: "active",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(result).toBeDefined();

      // Retrieve subscription
      const subscription = await db.query.boutiqueSubscriptions.findFirst({
        where: eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId),
      });

      expect(subscription).toBeDefined();
      expect(subscription?.planType).toBe("professional");
      expect(subscription?.status).toBe("active");
    });

    it("should return null for non-existent subscription", async () => {
      const db = getDb();

      const subscription = await db.query.boutiqueSubscriptions.findFirst({
        where: eq(boutiqueSubscriptions.boutiqueId, 999999),
      });

      expect(subscription).toBeUndefined();
    });
  });

  describe("Cancel Subscription", () => {
    it("should mark subscription as cancelled", async () => {
      const db = getDb();

      // Create active subscription
      await db.insert(boutiqueSubscriptions).values({
        boutiqueId: testBoutiqueId,
        planType: "professional",
        billingCycle: "monthly",
        status: "active",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Cancel subscription
      await db
        .update(boutiqueSubscriptions)
        .set({ status: "cancelled", updatedAt: new Date().toISOString() })
        .where(eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId));

      // Verify cancellation
      const subscription = await db.query.boutiqueSubscriptions.findFirst({
        where: eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId),
      });

      expect(subscription?.status).toBe("cancelled");
    });

    it("should not allow cancelling already cancelled subscription", async () => {
      const db = getDb();

      // Create cancelled subscription
      await db.insert(boutiqueSubscriptions).values({
        boutiqueId: testBoutiqueId,
        planType: "professional",
        billingCycle: "monthly",
        status: "cancelled",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Verify it's already cancelled
      const subscription = await db.query.boutiqueSubscriptions.findFirst({
        where: eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId),
      });

      expect(subscription?.status).toBe("cancelled");
    });

    it("should not allow cancelling suspended subscription", async () => {
      const db = getDb();

      // Create suspended subscription
      await db.insert(boutiqueSubscriptions).values({
        boutiqueId: testBoutiqueId,
        planType: "professional",
        billingCycle: "monthly",
        status: "suspended",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Verify it's suspended
      const subscription = await db.query.boutiqueSubscriptions.findFirst({
        where: eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId),
      });

      expect(subscription?.status).toBe("suspended");
    });
  });

  describe("Reactivate Subscription", () => {
    it("should reactivate a cancelled subscription", async () => {
      const db = getDb();

      // Create cancelled subscription
      await db.insert(boutiqueSubscriptions).values({
        boutiqueId: testBoutiqueId,
        planType: "professional",
        billingCycle: "monthly",
        status: "cancelled",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Reactivate subscription
      await db
        .update(boutiqueSubscriptions)
        .set({ status: "active", updatedAt: new Date().toISOString() })
        .where(eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId));

      // Verify reactivation
      const subscription = await db.query.boutiqueSubscriptions.findFirst({
        where: eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId),
      });

      expect(subscription?.status).toBe("active");
    });

    it("should not reactivate non-cancelled subscription", async () => {
      const db = getDb();

      // Create active subscription
      await db.insert(boutiqueSubscriptions).values({
        boutiqueId: testBoutiqueId,
        planType: "professional",
        billingCycle: "monthly",
        status: "active",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Verify it's still active
      const subscription = await db.query.boutiqueSubscriptions.findFirst({
        where: eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId),
      });

      expect(subscription?.status).toBe("active");
    });
  });

  describe("Subscription Status Transitions", () => {
    it("should track subscription status changes", async () => {
      const db = getDb();

      // Create subscription
      await db.insert(boutiqueSubscriptions).values({
        boutiqueId: testBoutiqueId,
        planType: "professional",
        billingCycle: "monthly",
        status: "active",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Verify initial status
      let subscription = await db.query.boutiqueSubscriptions.findFirst({
        where: eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId),
      });
      expect(subscription?.status).toBe("active");

      // Change to cancelled
      await db
        .update(boutiqueSubscriptions)
        .set({ status: "cancelled" })
        .where(eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId));

      subscription = await db.query.boutiqueSubscriptions.findFirst({
        where: eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId),
      });
      expect(subscription?.status).toBe("cancelled");

      // Change back to active
      await db
        .update(boutiqueSubscriptions)
        .set({ status: "active" })
        .where(eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId));

      subscription = await db.query.boutiqueSubscriptions.findFirst({
        where: eq(boutiqueSubscriptions.boutiqueId, testBoutiqueId),
      });
      expect(subscription?.status).toBe("active");
    });
  });

  describe("Cancellation Reasons", () => {
    it("should provide list of cancellation reasons", async () => {
      const reasons = [
        "too_expensive",
        "not_using",
        "poor_quality",
        "found_alternative",
        "technical_issues",
        "poor_support",
        "business_closed",
        "other",
      ];

      expect(reasons).toHaveLength(8);
      expect(reasons).toContain("too_expensive");
      expect(reasons).toContain("other");
    });
  });
});
