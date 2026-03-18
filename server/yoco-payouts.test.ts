import { describe, it, expect } from "vitest";
import {
  validateBankAccountDetails,
  formatBankAccountType,
} from "./yoco-payouts";

describe("Yoco Payouts Service", () => {
  describe("validateBankAccountDetails", () => {
    it("should validate correct South African bank account details", () => {
      // Valid 10-digit account number with 6-digit branch code
      const result = validateBankAccountDetails("1234567890", "123456");
      expect(result).toBe(true);
    });

    it("should validate 11-digit account numbers", () => {
      const result = validateBankAccountDetails("12345678901", "123456");
      expect(result).toBe(true);
    });

    it("should reject account numbers with less than 10 digits", () => {
      const result = validateBankAccountDetails("123456789", "123456");
      expect(result).toBe(false);
    });

    it("should reject account numbers with more than 11 digits", () => {
      const result = validateBankAccountDetails("123456789012", "123456");
      expect(result).toBe(false);
    });

    it("should reject account numbers with non-numeric characters", () => {
      const result = validateBankAccountDetails("123456789A", "123456");
      expect(result).toBe(false);
    });

    it("should reject branch codes with less than 6 digits", () => {
      const result = validateBankAccountDetails("1234567890", "12345");
      expect(result).toBe(false);
    });

    it("should reject branch codes with more than 6 digits", () => {
      const result = validateBankAccountDetails("1234567890", "1234567");
      expect(result).toBe(false);
    });

    it("should reject branch codes with non-numeric characters", () => {
      const result = validateBankAccountDetails("1234567890", "12345A");
      expect(result).toBe(false);
    });
  });

  describe("formatBankAccountType", () => {
    it("should format 'cheque' account type", () => {
      expect(formatBankAccountType("cheque")).toBe("cheque");
      expect(formatBankAccountType("CHEQUE")).toBe("cheque");
      expect(formatBankAccountType("Cheque")).toBe("cheque");
      expect(formatBankAccountType("checking")).toBe("cheque");
    });

    it("should format 'savings' account type", () => {
      expect(formatBankAccountType("savings")).toBe("savings");
      expect(formatBankAccountType("SAVINGS")).toBe("savings");
      expect(formatBankAccountType("Savings")).toBe("savings");
      expect(formatBankAccountType("savings account")).toBe("savings");
    });

    it("should format 'transmission' account type", () => {
      expect(formatBankAccountType("transmission")).toBe("transmission");
      expect(formatBankAccountType("TRANSMISSION")).toBe("transmission");
      expect(formatBankAccountType("Transmission")).toBe("transmission");
      expect(formatBankAccountType("transmission account")).toBe("transmission");
    });

    it("should default to 'savings' for unknown account types", () => {
      expect(formatBankAccountType("unknown")).toBe("savings");
      expect(formatBankAccountType("")).toBe("savings");
      expect(formatBankAccountType("  ")).toBe("savings");
    });

    it("should handle whitespace", () => {
      expect(formatBankAccountType("  cheque  ")).toBe("cheque");
      expect(formatBankAccountType("\tsavings\t")).toBe("savings");
      expect(formatBankAccountType(" transmission ")).toBe("transmission");
    });
  });
});
