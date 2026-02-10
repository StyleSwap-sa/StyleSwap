import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, TrendingUp, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * RetailerAnalytics Component
 * Displays retailer-specific API metrics and billing information
 */

export default function RetailerAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const { data: usageStats, isLoading: statsLoading } = trpc.protectedApi.getUsageStats.useQuery(
    { period: timeRange === "7d" ? "7d" : timeRange === "30d" ? "30d" : "90d" },
    { enabled: !!user }
  );

  // Mock data for demonstration
  const quotaData = {
    used: 4250,
    limit: 10000,
    percentage: 42.5,
    period: "monthly",
    resetDate: "2026-03-10",
  };

  const usageData = [
    { date: "Feb 1", requests: 150, successful: 145, failed: 5 },
    { date: "Feb 2", requests: 200, successful: 195, failed: 5 },
    { date: "Feb 3", requests: 180, successful: 175, failed: 5 },
    { date: "Feb 4", requests: 220, successful: 210, failed: 10 },
    { date: "Feb 5", requests: 190, successful: 185, failed: 5 },
    { date: "Feb 6", requests: 210, successful: 205, failed: 5 },
    { date: "Feb 7", requests: 240, successful: 230, failed: 10 },
  ];

  const planData = {
    name: "Professional",
    price: "$99/month",
    requestLimit: 10000,
    rateLimit: "500 req/min",
    features: [
      "API Key Management",
      "Webhook Support",
      "Analytics Dashboard",
      "Email Alerts",
      "Priority Support",
    ],
  };

  const billingData = {
    currentBill: "$99.00",
    nextBillingDate: "2026-03-10",
    status: "Active",
    paymentMethod: "Visa ending in 4242",
  };

  const handleExportReport = () => {
    console.log("Exporting analytics report...");
    // TODO: Implement actual export functionality
  };

  const handleUpgradePlan = () => {
    console.log("Redirecting to upgrade page...");
    // TODO: Implement plan upgrade flow
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your API Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your API usage, quota, and billing information
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">
                Total Requests
              </div>
              <div className="text-3xl font-bold">4,250</div>
              <div className="text-xs text-green-600 mt-2">
                ↑ 12% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">
                Success Rate
              </div>
              <div className="text-3xl font-bold">98.8%</div>
              <div className="text-xs text-green-600 mt-2">Excellent</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">
                Avg Response Time
              </div>
              <div className="text-3xl font-bold">2.3s</div>
              <div className="text-xs text-green-600 mt-2">Fast</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">
                Rate Limit Status
              </div>
              <div className="text-3xl font-bold">42%</div>
              <div className="text-xs text-green-600 mt-2">5,750 remaining</div>
            </CardContent>
          </Card>
        </div>

        {/* Quota Usage */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Quota Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">
                    {quotaData.used.toLocaleString()} /{" "}
                    {quotaData.limit.toLocaleString()} requests
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {quotaData.percentage}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${quotaData.percentage}%` }}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Period</p>
                  <p className="font-medium">Monthly</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Resets On</p>
                  <p className="font-medium">{quotaData.resetDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Requests Remaining</p>
                  <p className="font-medium">
                    {(quotaData.limit - quotaData.used).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Trend Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Usage Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#3b82f6"
                  name="Total Requests"
                />
                <Line
                  type="monotone"
                  dataKey="successful"
                  stroke="#10b981"
                  name="Successful"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan and Billing */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">{planData.name}</h3>
                <p className="text-3xl font-bold text-primary mb-4">
                  {planData.price}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Request Limit</p>
                  <p className="font-medium">{planData.requestLimit.toLocaleString()} requests/month</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rate Limit</p>
                  <p className="font-medium">{planData.rateLimit}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">Included Features:</p>
                <ul className="space-y-2">
                  {planData.features.map((feature) => (
                    <li key={feature} className="text-sm flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={handleUpgradePlan} className="w-full">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Bill</p>
                  <p className="text-3xl font-bold">{billingData.currentBill}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {billingData.status}
                    </span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      Next Billing Date
                    </span>
                    <span className="text-sm font-medium">
                      {billingData.nextBillingDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Payment Method
                    </span>
                    <span className="text-sm font-medium">
                      {billingData.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Update Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Export and Actions */}
        <div className="flex gap-4">
          <Button
            onClick={handleExportReport}
            variant="outline"
            className="flex-1"
          >
            <Download className="mr-2" size={16} />
            Export Report
          </Button>
          <Button variant="outline" className="flex-1">
            View Detailed Logs
          </Button>
        </div>
      </div>
    </div>
  );
}
