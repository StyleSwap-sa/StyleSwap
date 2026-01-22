import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";

type DateRange = "7" | "30" | "90";

interface AnalyticsData {
  date: string;
  tryOns: number;
  revenue: number;
  creditsUsed: number;
  creditsRemaining: number;
}

interface BoutiqueAnalytics {
  boutiqueName: string;
  tryOns: number;
  revenue: number;
  creditsUsed: number;
}

export function AdvancedAnalyticsCharts() {
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [selectedBoutique, setSelectedBoutique] = useState<string>("all");

  // Generate sample analytics data based on date range
  const analyticsData = useMemo((): AnalyticsData[] => {
    const days = parseInt(dateRange);
    const data: AnalyticsData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        tryOns: Math.floor(Math.random() * 100) + 10,
        revenue: Math.floor(Math.random() * 5000) + 500,
        creditsUsed: Math.floor(Math.random() * 500) + 50,
        creditsRemaining: Math.floor(Math.random() * 1000) + 500,
      });
    }

    return data;
  }, [dateRange]);

  // Sample boutique analytics
  const boutiqueAnalytics: BoutiqueAnalytics[] = [
    {
      boutiqueName: "Luxury Boutique",
      tryOns: 450,
      revenue: 12500,
      creditsUsed: 2250,
    },
    {
      boutiqueName: "Urban Fashion Co",
      tryOns: 380,
      revenue: 9800,
      creditsUsed: 1900,
    },
    {
      boutiqueName: "Vintage Threads",
      tryOns: 320,
      revenue: 8200,
      creditsUsed: 1600,
    },
    {
      boutiqueName: "Elegant Styles",
      tryOns: 290,
      revenue: 7500,
      creditsUsed: 1450,
    },
    {
      boutiqueName: "Minimalist Store",
      tryOns: 210,
      revenue: 5400,
      creditsUsed: 1050,
    },
  ];

  const handleExportChart = (chartType: string) => {
    // In a real implementation, this would use html2canvas or similar
    console.log(`Exporting ${chartType} chart...`);
    // Toast notification would show success
  };

  return (
    <div className="space-y-6">
      {/* Date Range & Boutique Selector */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            <Calendar className="w-4 h-4 inline mr-2" />
            Date Range
          </label>
          <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Boutique
          </label>
          <Select value={selectedBoutique} onValueChange={setSelectedBoutique}>
            <SelectTrigger>
              <SelectValue placeholder="Select boutique" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Boutiques</SelectItem>
              {boutiqueAnalytics.map((boutique) => (
                <SelectItem key={boutique.boutiqueName} value={boutique.boutiqueName}>
                  {boutique.boutiqueName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Try-Ons Per Day Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Try-Ons Per Day</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportChart("try-ons")}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => `${value} try-ons`}
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="tryOns"
                stroke="#FF6B35"
                strokeWidth={2}
                dot={{ fill: "#FF6B35", r: 4 }}
                activeDot={{ r: 6 }}
                name="Try-Ons"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue Trends</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportChart("revenue")}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => typeof value === 'number' ? `R${value.toFixed(2)}` : value}
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#4CAF50"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue (R)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Credit Usage Patterns Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Credit Usage Patterns</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportChart("credits")}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="creditsUsed"
                fill="#FF6B35"
                name="Credits Used"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="creditsRemaining"
                stroke="#2196F3"
                strokeWidth={2}
                name="Credits Remaining"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Boutiques Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Boutiques Performance</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportChart("boutiques")}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={boutiqueAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="boutiqueName" angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="tryOns"
                fill="#FF6B35"
                name="Try-Ons"
              />
              <Bar
                yAxisId="right"
                dataKey="revenue"
                fill="#4CAF50"
                name="Revenue (R)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Try-Ons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analyticsData.reduce((sum, d) => sum + d.tryOns, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R{((analyticsData.reduce((sum, d) => sum + d.revenue, 0) / 1000) as number).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credits Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analyticsData.reduce((sum, d) => sum + d.creditsUsed, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Daily Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R{(analyticsData.reduce((sum, d) => sum + d.revenue, 0) / analyticsData.length).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
