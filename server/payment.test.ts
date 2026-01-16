import { describe, it, expect } from "vitest";
import {
  PAYMENT_PACKAGES,
  getPaymentPackage,
  getAllPaymentPackages,
} from "./yoko-payment";

describe("Yoko Payment Integration", () => {
  describe("Payment Packages", () => {
    it("should have payment packages defined", () => {
      expect(PAYMENT_PACKAGES.length).toBeGreaterThan(0);
    });

    it("should have correct package structure", () => {
      PAYMENT_PACKAGES.forEach((pkg) => {
        expect(pkg.id).toBeTruthy();
        expect(pkg.name).toBeTruthy();
        expect(pkg.credits).toBeGreaterThan(0);
        expect(pkg.price).toBeGreaterThan(0);
        expect(pkg.currency).toBe("ZAR");
        expect(pkg.description).toBeTruthy();
      });
    });

    it("should have 50, 100, 200, and 500 credit packages", () => {
      const creditAmounts = PAYMENT_PACKAGES.map((p) => p.credits).sort(
        (a, b) => a - b
      );
      expect(creditAmounts).toContain(50);
      expect(creditAmounts).toContain(100);
      expect(creditAmounts).toContain(200);
      expect(creditAmounts).toContain(500);
    });

    it("should have increasing prices for increasing credits", () => {
      const sorted = [...PAYMENT_PACKAGES].sort((a, b) => a.credits - b.credits);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].price).toBeGreaterThan(sorted[i - 1].price);
      }
    });
  });

  describe("Package Retrieval", () => {
    it("should retrieve package by ID", () => {
      const pkg = getPaymentPackage("pkg_50_credits");
      expect(pkg).toBeDefined();
      expect(pkg?.credits).toBe(50);
      expect(pkg?.name).toBe("50 Try-Ons");
    });

    it("should return undefined for invalid package ID", () => {
      const pkg = getPaymentPackage("invalid_package");
      expect(pkg).toBeUndefined();
    });

    it("should get all packages", () => {
      const packages = getAllPaymentPackages();
      expect(packages.length).toBe(PAYMENT_PACKAGES.length);
      expect(packages).toEqual(PAYMENT_PACKAGES);
    });
  });

  describe("Package Pricing", () => {
    it("should have correct pricing for 50 credits", () => {
      const pkg = getPaymentPackage("pkg_50_credits");
      expect(pkg?.price).toBe(15000); // R150 in cents
    });

    it("should have correct pricing for 100 credits", () => {
      const pkg = getPaymentPackage("pkg_100_credits");
      expect(pkg?.price).toBe(38500); // R385 in cents
    });

    it("should have correct pricing for 200 credits", () => {
      const pkg = getPaymentPackage("pkg_200_credits");
      expect(pkg?.price).toBe(75000); // R750 in cents
    });

    it("should have correct pricing for 500 credits", () => {
      const pkg = getPaymentPackage("pkg_500_credits");
      expect(pkg?.price).toBe(165000); // R1650 in cents
    });
  });

  describe("Price per Credit", () => {
    it("should have reasonable price per credit", () => {
      PAYMENT_PACKAGES.forEach((pkg) => {
        const pricePerCredit = pkg.price / pkg.credits;
        // Price per credit should be between 200 and 400 cents (R2-R4)
        expect(pricePerCredit).toBeGreaterThanOrEqual(200);
        expect(pricePerCredit).toBeLessThanOrEqual(400);
      });
    });
  });
});
