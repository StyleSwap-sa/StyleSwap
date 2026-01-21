/**
 * Report export utilities for CSV and PDF generation
 */

export interface ReportData {
  boutique: {
    id: number;
    name: string;
    slug: string;
  };
  dateRange: {
    start: Date;
    end: Date;
  };
  statistics: {
    totalTryOns: number;
    totalCreditsUsed: number;
    totalCreditsAdded: number;
    totalRevenue: number;
    averageCreditsPerTryOn: number;
    transactionCount: number;
  };
  transactions: Array<{
    id: number;
    type: string;
    amount: number;
    price?: string;
    currency?: string;
    description?: string;
    status: string;
    createdAt: Date;
  }>;
}

/**
 * Generate CSV content from report data
 */
export function generateCSVReport(report: ReportData): string {
  const lines: string[] = [];

  // Header section
  lines.push("BOUTIQUE PERFORMANCE REPORT");
  lines.push(`Boutique: ${report.boutique.name}`);
  lines.push(`Report Period: ${formatDate(report.dateRange.start)} to ${formatDate(report.dateRange.end)}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  // Summary statistics
  lines.push("SUMMARY STATISTICS");
  lines.push("Metric,Value");
  lines.push(`Total Try-Ons,${report.statistics.totalTryOns}`);
  lines.push(`Total Credits Used,${report.statistics.totalCreditsUsed}`);
  lines.push(`Total Credits Added,${report.statistics.totalCreditsAdded}`);
  lines.push(`Total Revenue,${report.statistics.totalRevenue}`);
  lines.push(`Average Credits Per Try-On,${report.statistics.averageCreditsPerTryOn}`);
  lines.push(`Total Transactions,${report.statistics.transactionCount}`);
  lines.push("");

  // Transactions
  lines.push("TRANSACTIONS");
  lines.push("Date,Type,Amount,Price,Currency,Status,Description");

  for (const transaction of report.transactions) {
    const row = [
      formatDate(transaction.createdAt),
      escapeCSV(transaction.type),
      transaction.amount,
      transaction.price || "",
      transaction.currency || "ZAR",
      escapeCSV(transaction.status),
      escapeCSV(transaction.description || ""),
    ];
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

/**
 * Generate PDF content from report data (simplified text-based PDF)
 */
export function generatePDFReport(report: ReportData): string {
  const lines: string[] = [];

  // PDF header
  lines.push("%PDF-1.4");
  lines.push("1 0 obj");
  lines.push("<< /Type /Catalog /Pages 2 0 R >>");
  lines.push("endobj");
  lines.push("2 0 obj");
  lines.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  lines.push("endobj");
  lines.push("3 0 obj");
  lines.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>");
  lines.push("endobj");
  lines.push("4 0 obj");
  lines.push("<< /Length 1500 >>");
  lines.push("stream");

  // PDF content
  const contentLines: string[] = [];
  contentLines.push("BT");
  contentLines.push("/F1 24 Tf");
  contentLines.push("50 750 Td");
  contentLines.push("(BOUTIQUE PERFORMANCE REPORT) Tj");
  contentLines.push("0 -30 Td");
  contentLines.push("/F1 12 Tf");
  contentLines.push(`(Boutique: ${report.boutique.name}) Tj`);
  contentLines.push("0 -20 Td");
  contentLines.push(
    `(Report Period: ${formatDate(report.dateRange.start)} to ${formatDate(report.dateRange.end)}) Tj`
  );
  contentLines.push("0 -30 Td");
  contentLines.push("(SUMMARY STATISTICS) Tj");
  contentLines.push("0 -20 Td");
  contentLines.push(`(Total Try-Ons: ${report.statistics.totalTryOns}) Tj`);
  contentLines.push("0 -15 Td");
  contentLines.push(`(Total Credits Used: ${report.statistics.totalCreditsUsed}) Tj`);
  contentLines.push("0 -15 Td");
  contentLines.push(`(Total Credits Added: ${report.statistics.totalCreditsAdded}) Tj`);
  contentLines.push("0 -15 Td");
  contentLines.push(`(Total Revenue: ${report.statistics.totalRevenue}) Tj`);
  contentLines.push("0 -15 Td");
  contentLines.push(
    `(Average Credits Per Try-On: ${report.statistics.averageCreditsPerTryOn}) Tj`
  );
  contentLines.push("0 -15 Td");
  contentLines.push(`(Total Transactions: ${report.statistics.transactionCount}) Tj`);
  contentLines.push("ET");

  lines.push(contentLines.join("\n"));
  lines.push("endstream");
  lines.push("endobj");
  lines.push("5 0 obj");
  lines.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  lines.push("endobj");
  lines.push("xref");
  lines.push("0 6");
  lines.push("0000000000 65535 f");
  lines.push("0000000009 00000 n");
  lines.push("0000000058 00000 n");
  lines.push("0000000115 00000 n");
  lines.push("0000000214 00000 n");
  lines.push("0000001764 00000 n");
  lines.push("trailer");
  lines.push("<< /Size 6 /Root 1 0 R >>");
  lines.push("startxref");
  lines.push("1841");
  lines.push("%%EOF");

  return lines.join("\n");
}

/**
 * Helper function to format dates
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Helper function to escape CSV values
 */
function escapeCSV(value: string): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export report as CSV buffer
 */
export function exportReportAsCSV(report: ReportData): Buffer {
  const csv = generateCSVReport(report);
  return Buffer.from(csv, "utf-8");
}

/**
 * Export report as PDF buffer
 */
export function exportReportAsPDF(report: ReportData): Buffer {
  const pdf = generatePDFReport(report);
  return Buffer.from(pdf, "utf-8");
}

/**
 * Generate filename for report
 */
export function generateReportFilename(
  boutiqueName: string,
  format: "csv" | "pdf",
  startDate: Date,
  endDate: Date
): string {
  const dateStr = `${formatDate(startDate)}_to_${formatDate(endDate)}`;
  const sanitizedName = boutiqueName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return `report_${sanitizedName}_${dateStr}.${format}`;
}
