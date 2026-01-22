import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Download,
  FileText,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type ExportFormat = "csv" | "pdf" | "excel";
type DateRangeType = "7" | "30" | "90" | "custom";

interface ExportPreview {
  boutiqueName: string;
  totalTryOns: number;
  totalRevenue: number;
  creditsUsed: number;
  dateRange: string;
  format: string;
}

export default function BoutiquePerformanceExport() {
  const [selectedBoutique, setSelectedBoutique] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [dateRange, setDateRange] = useState<DateRangeType>("30");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sendEmail, setSendEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");
  const [showPreview, setShowPreview] = useState(false);

  // Sample boutiques list
  const boutiques = [
    { id: "1", name: "Luxury Boutique" },
    { id: "2", name: "Urban Fashion Co" },
    { id: "3", name: "Vintage Threads" },
    { id: "4", name: "Elegant Styles" },
    { id: "5", name: "Minimalist Store" },
  ];

  // Sample preview data
  const previewData: ExportPreview = {
    boutiqueName: selectedBoutique || "Select a boutique",
    totalTryOns: 450,
    totalRevenue: 12500,
    creditsUsed: 2250,
    dateRange: dateRange === "custom" ? `${startDate} to ${endDate}` : `Last ${dateRange} days`,
    format: exportFormat.toUpperCase(),
  };

  const handleExport = async () => {
    if (!selectedBoutique) {
      setExportStatus("error");
      return;
    }

    setIsExporting(true);
    setExportStatus("idle");

    try {
      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create filename
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${selectedBoutique.replace(/\s+/g, "_")}_report_${timestamp}.${exportFormat}`;

      // Simulate download
      console.log(`Exporting ${filename}...`);

      // In a real implementation, this would call the tRPC procedure
      // const result = await trpc.admin.exportBoutiquePerformanceReport.mutate({
      //   boutiqueId: parseInt(selectedBoutique),
      //   format: exportFormat,
      //   startDate: dateRange === 'custom' ? startDate : undefined,
      //   endDate: dateRange === 'custom' ? endDate : undefined,
      //   sendEmail: sendEmail ? email : undefined,
      // });

      setExportStatus("success");

      // Reset form after 3 seconds
      setTimeout(() => {
        setExportStatus("idle");
        setSelectedBoutique("");
        setStartDate("");
        setEndDate("");
        setEmail("");
        setSendEmail(false);
      }, 3000);
    } catch (error) {
      console.error("Export failed:", error);
      setExportStatus("error");
    } finally {
      setIsExporting(false);
    }
  };

  const getDaysLabel = () => {
    switch (dateRange) {
      case "7":
        return "Last 7 Days";
      case "30":
        return "Last 30 Days";
      case "90":
        return "Last 90 Days";
      case "custom":
        return `${startDate} to ${endDate}`;
      default:
        return "Select range";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Performance Reports</h1>
          <p className="text-muted-foreground">
            Export detailed analytics and performance metrics for your boutique
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Boutique Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Select Boutique
                  </label>
                  <Select value={selectedBoutique} onValueChange={setSelectedBoutique}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a boutique" />
                    </SelectTrigger>
                    <SelectContent>
                      {boutiques.map((boutique) => (
                        <SelectItem key={boutique.id} value={boutique.id}>
                          {boutique.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date Range
                  </label>
                  <Select value={dateRange} onValueChange={(value: DateRangeType) => setDateRange(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 Days</SelectItem>
                      <SelectItem value="30">Last 30 Days</SelectItem>
                      <SelectItem value="90">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Date Range */}
                {dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Export Format */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Export Format
                  </label>
                  <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                      <SelectItem value="pdf">PDF (Document)</SelectItem>
                      <SelectItem value="excel">Excel (Advanced)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Delivery */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <label htmlFor="sendEmail" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Send to Email
                    </label>
                  </div>

                  {sendEmail && (
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex-1"
                  >
                    {showPreview ? "Hide Preview" : "Preview"}
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={!selectedBoutique || isExporting}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? "Exporting..." : "Export Report"}
                  </Button>
                </div>

                {/* Status Messages */}
                {exportStatus === "success" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Export successful!</p>
                      <p className="text-sm text-green-700">Your report has been generated and is ready to download.</p>
                    </div>
                  </div>
                )}

                {exportStatus === "error" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Export failed</p>
                      <p className="text-sm text-red-700">Please select a boutique and try again.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Features */}
            <Card>
              <CardHeader>
                <CardTitle>What's Included in Your Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Try-On Analytics</p>
                      <p className="text-sm text-muted-foreground">Daily try-on counts and trends</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Revenue Tracking</p>
                      <p className="text-sm text-muted-foreground">Total revenue and per-transaction breakdown</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Credit Usage</p>
                      <p className="text-sm text-muted-foreground">Credits consumed and remaining balance</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Performance Metrics</p>
                      <p className="text-sm text-muted-foreground">Conversion rates and customer insights</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Report Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">Boutique</p>
                    <p className="text-sm font-semibold text-foreground">{previewData.boutiqueName}</p>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Try-Ons</p>
                      <p className="text-2xl font-bold text-foreground">{previewData.totalTryOns}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Revenue</p>
                      <p className="text-2xl font-bold text-foreground">R{previewData.totalRevenue.toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">Credits Used</p>
                      <p className="text-2xl font-bold text-foreground">{previewData.creditsUsed}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Date Range:</span>
                      <span className="font-medium">{getDaysLabel()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Format:</span>
                      <span className="font-medium">{previewData.format}</span>
                    </div>
                    {sendEmail && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Email To:</span>
                        <span className="font-medium text-xs">{email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Export History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Luxury Boutique", date: "2026-01-22", format: "PDF" },
                { name: "Urban Fashion Co", date: "2026-01-21", format: "CSV" },
                { name: "Vintage Threads", date: "2026-01-20", format: "Excel" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">{item.format}</span>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
