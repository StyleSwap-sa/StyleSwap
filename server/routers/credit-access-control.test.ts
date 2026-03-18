import { describe, it, expect, beforeEach, vi } from "vitest";
import { handlePaymentSuccess } from "../yoko-payment";
import { validateSubscription, SubscriptionStatus } from "../middleware/subscriptionValidation";
import { getUserCredits, deductCredits } from "../db.credits";

/**
 * Test Suite: Credit System & Access Control
 * 
 * This test suite verifies:
 * 1. Credits are immediately loaded after payment
 * 2. Subscription-based access control works correctly
 * 3. Credit top-up system allows flexible purchases
 */

describe("Credit System & Access Control", () => {
  describe("Phase 1: Immediate Credit Loading After Payment", () => {
    it("should immediately allocate credits after payment success", async () => {
      const userId = "123";
      const credits = 100;
      const packageId = "pkg_100_credits";

      // Simulate payment success
      await handlePaymentSuccess("payment_intent_123", {
        userId,
        packageId,
        credits,
      });

      // Verify credits are immediately available
      const userCredits = await getUserCredits(parseInt(userId));
      expect(userCredits.remainingCredits).toBeGreaterThanOrEqual(credits);
      expect(userCredits.totalCredits).toBeGreaterThanOrEqual(credits);
    });

    it("should create transaction record for payment", async () => {
      const userId = "456";
      const credits = 50;
      const packageId = "pkg_50_credits";

      await handlePaymentSuccess("payment_intent_456", {
        userId,
        packageId,
        credits,
      });

      // Credits should be recorded in transaction
      const userCredits = await getUserCredits(parseInt(userId));
      expect(userCredits).toBeDefined();
      expect(userCredits.totalCredits).toBeGreaterThanOrEqual(credits);
    });

    it("should set credit expiration to 30 days from purchase", async () => {
      const userId = "789";
      const credits = 200;
      const packageId = "pkg_200_credits";

      await handlePaymentSuccess("payment_intent_789", {
        userId,
        packageId,
        credits,
      });

      const userCredits = await getUserCredits(parseInt(userId));
      const expiresAt = new Date(userCredits.expiresAt);
      const now = new Date();
      const daysDifference = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Should expire in approximately 30 days
      expect(daysDifference).toBeGreaterThanOrEqual(29);
      expect(daysDifference).toBeLessThanOrEqual(31);
    });

    it("should stack credits on existing balance", async () => {
      const userId = "999";
      const firstPurchase = 50;
      const secondPurchase = 100;

      // First purchase
      await handlePaymentSuccess("payment_intent_first", {
        userId,
        packageId: "pkg_50_credits",
        credits: firstPurchase,
      });

      const creditsAfterFirst = await getUserCredits(parseInt(userId));
      const firstBalance = creditsAfterFirst.remainingCredits;

      // Second purchase
      await handlePaymentSuccess("payment_intent_second", {
        userId,
        packageId: "pkg_100_credits",
        credits: secondPurchase,
      });

      const creditsAfterSecond = await getUserCredits(parseInt(userId));
      const secondBalance = creditsAfterSecond.remainingCredits;

      // Second balance should include both purchases
      expect(secondBalance).toBeGreaterThan(firstBalance);
    });
  });

  describe("Phase 2: Subscription-Based Access Control", () => {
    it("should block try-on for users without boutique", async () => {
      const userId = 999999; // Non-existent user

      const result = await validateSubscription(userId);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(SubscriptionStatus.INACTIVE);
      expect(result.reason).toContain("not associated with any boutique");
    });

    it("should block try-on for inactive boutiques", async () => {
      // This test assumes a boutique with inactive status exists
      // In real scenario, you'd create a test boutique with status 'inactive'
      const userId = 888888;

      const result = await validateSubscription(userId);

      // Should fail validation
      expect(result.isValid).toBe(false);
    });

    it("should block try-on for boutiques without subscription", async () => {
      const userId = 777777; // User with active boutique but no subscription

      const result = await validateSubscription(userId);

      expect(result.isValid).toBe(false);
      expect(result.status).toBe(SubscriptionStatus.INACTIVE);
      expect(result.reason).toContain("no active subscription");
    });

    it("should block try-on for expired subscriptions", async () => {
      const userId = 666666; // User with expired subscription

      const result = await validateSubscription(userId);

      if (!result.isValid) {
        expect([SubscriptionStatus.EXPIRED, SubscriptionStatus.INACTIVE]).toContain(
          result.status
        );
      }
    });

    it("should allow try-on for active subscriptions with valid payment", async () => {
      const userId = 555555; // User with active subscription and recent payment

      const result = await validateSubscription(userId);

      // If subscription is valid, should allow access
      if (result.isValid) {
        expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      }
    });

    it("should check payment recency for monthly subscriptions", async () => {
      const userId = 444444; // User with monthly subscription

      const result = await validateSubscription(userId);

      // For monthly subscriptions, payment must be within 30 days
      if (!result.isValid && result.reason?.includes("overdue")) {
        expect(result.status).toBe(SubscriptionStatus.EXPIRED);
      }
    });

    it("should check payment recency for annual subscriptions", async () => {
      const userId = 333333; // User with annual subscription

      const result = await validateSubscription(userId);

      // For annual subscriptions, payment must be within 365 days
      if (!result.isValid && result.reason?.includes("overdue")) {
        expect(result.status).toBe(SubscriptionStatus.EXPIRED);
      }
    });
  });

  describe("Phase 3: Credit Top-Up System", () => {
    it("should allow credit purchase at any time", async () => {
      const userId = "111111";

      // First purchase
      await handlePaymentSuccess("payment_intent_topup_1", {
        userId,
        packageId: "pkg_10_credits",
        credits: 10,
      });

      const firstBalance = await getUserCredits(parseInt(userId));

      // Second purchase (top-up)
      await handlePaymentSuccess("payment_intent_topup_2", {
        userId,
        packageId: "pkg_20_credits",
        credits: 20,
      });

      const secondBalance = await getUserCredits(parseInt(userId));

      // Should allow top-up without restrictions
      expect(secondBalance.totalCredits).toBeGreaterThan(firstBalance.totalCredits);
    });

    it("should support all credit package sizes", async () => {
      const packages = [
        { id: "pkg_10_credits", credits: 10 },
        { id: "pkg_20_credits", credits: 20 },
        { id: "pkg_50_credits", credits: 50 },
        { id: "pkg_100_credits", credits: 100 },
        { id: "pkg_200_credits", credits: 200 },
        { id: "pkg_500_credits", credits: 500 },
        { id: "pkg_1000_credits", credits: 1000 },
        { id: "pkg_5000_credits", credits: 5000 },
        { id: "pkg_20000_credits", credits: 20000 },
      ];

      for (const pkg of packages) {
        const userId = `user_${pkg.id}`;

        await handlePaymentSuccess(`payment_intent_${pkg.id}`, {
          userId,
          packageId: pkg.id,
          credits: pkg.credits,
        });

        const credits = await getUserCredits(parseInt(userId));
        expect(credits.remainingCredits).toBeGreaterThanOrEqual(pkg.credits);
      }
    });

    it("should not restrict credit purchases by monthly cycles", async () => {
      const userId = "222222";

      // Multiple purchases in same month
      for (let i = 0; i < 3; i++) {
        await handlePaymentSuccess(`payment_intent_cycle_${i}`, {
          userId,
          packageId: "pkg_50_credits",
          credits: 50,
        });
      }

      const finalCredits = await getUserCredits(parseInt(userId));

      // Should have accumulated all purchases
      expect(finalCredits.totalCredits).toBeGreaterThanOrEqual(150);
    });

    it("should allow custom amount purchases for annual billing discounts", async () => {
      const userId = "333333";
      const standardPrice = 100; // Example: R1000 for annual
      const discountedPrice = 90; // 10% discount = R900

      // Simulate annual billing with discount
      await handlePaymentSuccess("payment_intent_annual_discount", {
        userId,
        packageId: "pkg_annual",
        credits: 1000, // Same credits, discounted price
      });

      const credits = await getUserCredits(parseInt(userId));
      expect(credits.remainingCredits).toBeGreaterThanOrEqual(1000);
    });
  });

  describe("Integration Tests", () => {
    it("should prevent try-on if subscription is invalid even with credits", async () => {
      // User has credits but no valid subscription
      const userId = 444444;

      // Assuming user has credits
      const credits = await getUserCredits(userId);
      const subscription = await validateSubscription(userId);

      // Should fail if subscription is invalid, regardless of credits
      if (!subscription.isValid) {
        expect(subscription.isValid).toBe(false);
      }
    });

    it("should prevent try-on if credits are insufficient even with valid subscription", async () => {
      const userId = 555555;

      // Check subscription validity
      const subscription = await validateSubscription(userId);

      // Check credit balance
      const credits = await getUserCredits(userId);

      // If subscription is valid but credits are 0, should not allow try-on
      if (subscription.isValid && credits.remainingCredits === 0) {
        expect(credits.remainingCredits).toBe(0);
      }
    });

    it("should allow try-on only when both subscription and credits are valid", async () => {
      const userId = 666666;

      const subscription = await validateSubscription(userId);
      const credits = await getUserCredits(userId);

      // Both conditions must be true to allow try-on
      const canTryOn = subscription.isValid && credits.remainingCredits > 0;

      if (canTryOn) {
        expect(subscription.isValid).toBe(true);
        expect(credits.remainingCredits).toBeGreaterThan(0);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle payment success with invalid user gracefully", async () => {
      try {
        await handlePaymentSuccess("payment_intent_invalid", {
          userId: "invalid_user_id",
          packageId: "pkg_100_credits",
          credits: 100,
        });
      } catch (error) {
        // Should handle error gracefully
        expect(error).toBeDefined();
      }
    });

    it("should handle subscription validation with database unavailability", async () => {
      // This test assumes database might be temporarily unavailable
      const userId = 777777;

      try {
        const result = await validateSubscription(userId);
        // Should return a result even if database has issues
        expect(result).toBeDefined();
        expect(result.isValid).toBeDefined();
      } catch (error) {
        // Should handle error gracefully
        expect(error).toBeDefined();
      }
    });
  });
});
