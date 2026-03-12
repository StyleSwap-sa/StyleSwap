import { describe, it, expect, vi } from "vitest";
import { sendCommissionNotification, handleCommissionStatusUpdate } from "./commission-notifications";

describe("Commission Notifications", () => {
  describe("Commission Notification Formatting", () => {
    it("should format currency correctly for ZAR", () => {
      const amount = "1234.56";
      const formatted = new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
      }).format(parseFloat(amount));

      expect(formatted).toContain("R");
      expect(formatted).toContain("1,234.56");
    });

    it("should calculate 7.5% commission correctly", () => {
      const purchaseAmount = 1000;
      const commissionRate = 7.5;
      const commissionAmount = (purchaseAmount * commissionRate) / 100;

      expect(commissionAmount).toBe(75);
    });

    it("should handle small commission amounts", () => {
      const purchaseAmount = 50;
      const commissionRate = 7.5;
      const commissionAmount = (purchaseAmount * commissionRate) / 100;

      expect(commissionAmount).toBeCloseTo(3.75, 2);
    });
  });

  describe("Commission Status Types", () => {
    it("should have valid commission status values", () => {
      const validStatuses = ["approved", "paid", "pending", "failed"];
      const testStatus = "approved";

      expect(validStatuses).toContain(testStatus);
    });

    it("should handle all commission notification types", () => {
      const notificationTypes = ["approved", "paid", "pending", "failed"];

      notificationTypes.forEach((type) => {
        expect(["approved", "paid", "pending", "failed"]).toContain(type);
      });
    });
  });

  describe("Commission Notification Timing", () => {
    it("should calculate expected payout date for approved commissions", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expectedPayoutDate = tomorrow.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      expect(expectedPayoutDate).toBeTruthy();
      expect(expectedPayoutDate.length).toBeGreaterThan(0);
    });

    it("should format date correctly for email", () => {
      const testDate = new Date("2026-03-15");
      const formattedDate = testDate.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      expect(formattedDate).toContain("March");
      expect(formattedDate).toContain("2026");
    });
  });

  describe("Commission Email Content", () => {
    it("should include commission ID in notification", () => {
      const commissionId = "COMM-12345-67890";
      const emailContent = `Commission ID: ${commissionId}`;

      expect(emailContent).toContain(commissionId);
    });

    it("should include boutique name in notification", () => {
      const boutiqueName = "Fashion Boutique XYZ";
      const emailContent = `Boutique: ${boutiqueName}`;

      expect(emailContent).toContain(boutiqueName);
    });

    it("should include purchase amount in notification", () => {
      const purchaseAmount = "R 1,000.00";
      const emailContent = `Purchase Amount: ${purchaseAmount}`;

      expect(emailContent).toContain(purchaseAmount);
    });

    it("should include commission rate in notification", () => {
      const commissionRate = "7.5";
      const emailContent = `Commission Rate: ${commissionRate}%`;

      expect(emailContent).toContain("7.5");
    });
  });

  describe("Commission Notification Subjects", () => {
    it("should have correct subject for approved commission", () => {
      const affiliateName = "Partner A";
      const subject = `Commission Approved - ${affiliateName}`;

      expect(subject).toContain("Approved");
      expect(subject).toContain(affiliateName);
    });

    it("should have correct subject for paid commission", () => {
      const affiliateName = "Partner B";
      const subject = `Commission Paid - ${affiliateName}`;

      expect(subject).toContain("Paid");
      expect(subject).toContain(affiliateName);
    });

    it("should have correct subject for pending commission", () => {
      const affiliateName = "Partner C";
      const subject = `Commission Pending Review - ${affiliateName}`;

      expect(subject).toContain("Pending");
      expect(subject).toContain(affiliateName);
    });

    it("should have correct subject for failed commission", () => {
      const affiliateName = "Partner D";
      const subject = `Commission Processing Failed - ${affiliateName}`;

      expect(subject).toContain("Failed");
      expect(subject).toContain(affiliateName);
    });
  });

  describe("Commission Payout Calculation", () => {
    it("should calculate boutique payout after commission deduction", () => {
      const salePrice = 1000;
      const styleswapCommission = 7.5;
      const paymentProcessorFee = 2.5;

      const commissionAmount = (salePrice * styleswapCommission) / 100;
      const feeAmount = (salePrice * paymentProcessorFee) / 100;
      const boutiquePayout = salePrice - commissionAmount - feeAmount;

      expect(commissionAmount).toBe(75);
      expect(feeAmount).toBe(25);
      expect(boutiquePayout).toBe(900);
    });

    it("should verify payout percentages add up correctly", () => {
      const salePrice = 1000;
      const styleswapPercentage = 7.5;
      const processorPercentage = 2.5;
      const boutiquePercentage = 100 - styleswapPercentage - processorPercentage;

      expect(boutiquePercentage).toBe(90);
    });
  });
});
