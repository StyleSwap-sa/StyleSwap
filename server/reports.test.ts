import { describe, it, expect } from "vitest";
import {
  generateCSVReport,
  generatePDFReport,
  exportReportAsCSV,
  exportReportAsPDF,
  generateReportFilename,
} from "./reports";

const mockReportData = {
  boutique: {
    id: 1,
    name: "Test Boutique",
    slug: "test-boutique",
  },
  dateRange: {
    start: new Date("2026-01-01"),
    end: new Date("2026-01-31"),
  },
  statistics: {
    totalTryOns: 100,
    totalCreditsUsed: 500,
    totalCreditsAdded: 1000,
    totalRevenue: 5000,
    averageCreditsPerTryOn: 5,
    transactionCount: 150,
  },
  transactions: [
    {
      id: 1,
      type: "usage",
      amount: 5,
      price: undefined,
      currency: "ZAR",
      description: "Try-on request",
      status: "completed",
      createdAt: new Date("2026-01-15"),
    },
    {
      id: 2,
      type: "purchase",
      amount: 100,
      price: "50.00",
      currency: "ZAR",
      description: "Credit purchase",
      status: "completed",
      createdAt: new Date("2026-01-10"),
    },
  ],
};

describe("Report Export Utilities", () => {
  describe("CSV Report Generation", () => {
    it("should generate valid CSV content", () => {
      const csv = generateCSVReport(mockReportData);
      expect(typeof csv).toBe("string");
      expect(csv.length).toBeGreaterThan(0);
    });

    it("should include report header", () => {
      const csv = generateCSVReport(mockReportData);
      expect(csv).toContain("BOUTIQUE PERFORMANCE REPORT");
      expect(csv).toContain("Test Boutique");
    });

    it("should include date range", () => {
      const csv = generateCSVReport(mockReportData);
      expect(csv).toContain("2026-01-01");
      expect(csv).toContain("2026-01-31");
    });

    it("should include summary statistics", () => {
      const csv = generateCSVReport(mockReportData);
      expect(csv).toContain("SUMMARY STATISTICS");
      expect(csv).toContain("Total Try-Ons,100");
      expect(csv).toContain("Total Credits Used,500");
      expect(csv).toContain("Total Revenue,5000");
    });

    it("should include transactions section", () => {
      const csv = generateCSVReport(mockReportData);
      expect(csv).toContain("TRANSACTIONS");
      expect(csv).toContain("Date,Type,Amount,Price,Currency,Status,Description");
    });

    it("should include transaction data", () => {
      const csv = generateCSVReport(mockReportData);
      expect(csv).toContain("usage");
      expect(csv).toContain("purchase");
      expect(csv).toContain("completed");
    });

    it("should escape CSV special characters", () => {
      const reportWithSpecialChars = {
        ...mockReportData,
        transactions: [
          {
            ...mockReportData.transactions[0],
            description: 'Test "quoted" value with, comma',
          },
        ],
      };

      const csv = generateCSVReport(reportWithSpecialChars);
      expect(csv).toContain('"Test ""quoted"" value with, comma"');
    });
  });

  describe("PDF Report Generation", () => {
    it("should generate valid PDF content", () => {
      const pdf = generatePDFReport(mockReportData);
      expect(typeof pdf).toBe("string");
      expect(pdf.startsWith("%PDF")).toBe(true);
    });

    it("should include PDF header", () => {
      const pdf = generatePDFReport(mockReportData);
      expect(pdf).toContain("%PDF-1.4");
    });

    it("should include PDF objects", () => {
      const pdf = generatePDFReport(mockReportData);
      expect(pdf).toContain("endobj");
      expect(pdf).toContain("stream");
      expect(pdf).toContain("endstream");
    });

    it("should include report content", () => {
      const pdf = generatePDFReport(mockReportData);
      expect(pdf).toContain("BOUTIQUE PERFORMANCE REPORT");
      expect(pdf).toContain("Test Boutique");
    });

    it("should include statistics in PDF", () => {
      const pdf = generatePDFReport(mockReportData);
      expect(pdf).toContain("Total Try-Ons");
      expect(pdf).toContain("Total Credits Used");
      expect(pdf).toContain("Total Revenue");
    });

    it("should have proper PDF structure", () => {
      const pdf = generatePDFReport(mockReportData);
      expect(pdf).toContain("xref");
      expect(pdf).toContain("trailer");
      expect(pdf).toContain("startxref");
      expect(pdf).toContain("%%EOF");
    });
  });

  describe("Buffer Export Functions", () => {
    it("should export CSV as buffer", () => {
      const buffer = exportReportAsCSV(mockReportData);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should export PDF as buffer", () => {
      const buffer = exportReportAsPDF(mockReportData);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should convert CSV buffer to string", () => {
      const buffer = exportReportAsCSV(mockReportData);
      const str = buffer.toString("utf-8");
      expect(str).toContain("BOUTIQUE PERFORMANCE REPORT");
    });

    it("should convert PDF buffer to string", () => {
      const buffer = exportReportAsPDF(mockReportData);
      const str = buffer.toString("utf-8");
      expect(str.startsWith("%PDF")).toBe(true);
    });
  });

  describe("Filename Generation", () => {
    it("should generate CSV filename", () => {
      const filename = generateReportFilename(
        "Test Boutique",
        "csv",
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      expect(filename).toContain("report_");
      expect(filename).toContain("test_boutique");
      expect(filename).toContain("2026-01-01");
      expect(filename).toContain("2026-01-31");
      expect(filename).toBe(filename.endsWith(".csv") ? filename : "");
    });

    it("should generate PDF filename", () => {
      const filename = generateReportFilename(
        "Premium Boutique",
        "pdf",
        new Date("2026-02-01"),
        new Date("2026-02-28")
      );

      expect(filename).toContain("report_");
      expect(filename).toContain("premium_boutique");
      expect(filename).toContain("2026-02-01");
      expect(filename).toContain("2026-02-28");
      expect(filename).toBe(filename.endsWith(".pdf") ? filename : "");
    });

    it("should sanitize boutique names", () => {
      const filename = generateReportFilename(
        "Test & Boutique #1 (Premium)",
        "csv",
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      expect(filename).not.toContain("&");
      expect(filename).not.toContain("#");
      expect(filename).not.toContain("(");
      expect(filename).not.toContain(")");
      expect(filename).toContain("test");
      expect(filename).toContain("boutique");
    });

    it("should format dates consistently", () => {
      const filename1 = generateReportFilename(
        "Boutique",
        "csv",
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      const filename2 = generateReportFilename(
        "Boutique",
        "csv",
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );

      expect(filename1).toBe(filename2);
    });
  });

  describe("Data Integrity", () => {
    it("should preserve all boutique information", () => {
      const csv = generateCSVReport(mockReportData);
      expect(csv).toContain(mockReportData.boutique.name);
    });

    it("should preserve all statistics", () => {
      const csv = generateCSVReport(mockReportData);
      expect(csv).toContain(mockReportData.statistics.totalTryOns.toString());
      expect(csv).toContain(mockReportData.statistics.totalCreditsUsed.toString());
      expect(csv).toContain(mockReportData.statistics.totalRevenue.toString());
    });

    it("should handle empty transactions", () => {
      const reportWithoutTransactions = {
        ...mockReportData,
        transactions: [],
      };

      const csv = generateCSVReport(reportWithoutTransactions);
      expect(csv).toContain("TRANSACTIONS");
      expect(csv).toContain("Date,Type,Amount,Price,Currency,Status,Description");
    });

    it("should handle zero statistics", () => {
      const reportWithZeroStats = {
        ...mockReportData,
        statistics: {
          totalTryOns: 0,
          totalCreditsUsed: 0,
          totalCreditsAdded: 0,
          totalRevenue: 0,
          averageCreditsPerTryOn: 0,
          transactionCount: 0,
        },
      };

      const csv = generateCSVReport(reportWithZeroStats);
      expect(csv).toContain("0");
    });
  });
});
