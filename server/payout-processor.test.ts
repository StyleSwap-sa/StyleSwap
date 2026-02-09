import { describe, it, expect } from "vitest";
import { calculatePayoutAmounts } from "./payout-processor";

describe("Payout Processor", () => {
  describe("calculatePayoutAmounts", () => {
    it("should calculate correct amounts for R100 order", () => {
      const result = calculatePayoutAmounts(100);
      
      expect(result.totalAmount.toNumber()).toBe(100);
      expect(result.yocoFee).toBeCloseTo(2.5, 2); // 2.5%
      expect(result.styleswapCommission).toBeCloseTo(5, 2); // 5%
      expect(result.boutiqueShare).toBeCloseTo(92.5, 2); // 92.5%
    });

    it("should calculate correct amounts for R1000 order", () => {
      const result = calculatePayoutAmounts(1000);
      
      expect(result.totalAmount.toNumber()).toBe(1000);
      expect(result.yocoFee).toBeCloseTo(25, 2); // 2.5%
      expect(result.styleswapCommission).toBeCloseTo(50, 2); // 5%
      expect(result.boutiqueShare).toBeCloseTo(925, 2); // 92.5%
    });

    it("should calculate correct amounts for R299.99 order", () => {
      const result = calculatePayoutAmounts(299.99);
      
      expect(result.totalAmount.toNumber()).toBeCloseTo(299.99, 2);
      expect(result.yocoFee).toBeCloseTo(7.50, 2); // 2.5%
      expect(result.styleswapCommission).toBeCloseTo(15.00, 2); // 5%
      expect(result.boutiqueShare).toBeCloseTo(277.49, 2); // 92.5%
    });

    it("should handle string input", () => {
      const result = calculatePayoutAmounts("500.50");
      
      expect(result.totalAmount.toNumber()).toBeCloseTo(500.50, 2);
      expect(result.yocoFee).toBeCloseTo(12.51, 1);
      expect(result.styleswapCommission).toBeCloseTo(25.03, 1);
      expect(result.boutiqueShare).toBeCloseTo(462.96, 1);
    });

    it("should ensure amounts sum to total", () => {
      const testAmounts = [100, 500, 1000, 299.99, 50.25];
      
      testAmounts.forEach(amount => {
        const result = calculatePayoutAmounts(amount);
        const sum = result.yocoFee + result.styleswapCommission + result.boutiqueShare;
        expect(sum).toBeCloseTo(amount, 1);
      });
    });

    it("should maintain percentage ratios", () => {
      const result = calculatePayoutAmounts(1000);
      
      // Verify percentages
      const yocoPercent = (result.yocoFee / 1000) * 100;
      const styleswapPercent = (result.styleswapCommission / 1000) * 100;
      const boutiquePercent = (result.boutiqueShare / 1000) * 100;
      
      expect(yocoPercent).toBeCloseTo(2.5, 1);
      expect(styleswapPercent).toBeCloseTo(5, 1);
      expect(boutiquePercent).toBeCloseTo(92.5, 1);
    });

    it("should handle very small amounts", () => {
      const result = calculatePayoutAmounts(0.50);
      
      expect(result.totalAmount.toNumber()).toBeCloseTo(0.50, 2);
      expect(result.yocoFee).toBeCloseTo(0.0125, 4); // 2.5%
      expect(result.styleswapCommission).toBeCloseTo(0.025, 4); // 5%
      expect(result.boutiqueShare).toBeCloseTo(0.4625, 4); // 92.5%
    });

    it("should handle large amounts", () => {
      const result = calculatePayoutAmounts(50000);
      
      expect(result.totalAmount.toNumber()).toBe(50000);
      expect(result.yocoFee).toBeCloseTo(1250, 2); // 2.5%
      expect(result.styleswapCommission).toBeCloseTo(2500, 2); // 5%
      expect(result.boutiqueShare).toBeCloseTo(46250, 2); // 92.5%
    });

    it("should maintain precision with decimal amounts", () => {
      const result = calculatePayoutAmounts(123.45);
      
      const sum = result.yocoFee + result.styleswapCommission + result.boutiqueShare;
      expect(sum).toBeCloseTo(123.45, 1);
    });
  });
});
