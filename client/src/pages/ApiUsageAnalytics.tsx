import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  TrendingUp,
  AlertCircle,
  Download,
  RefreshCw,
  Clock,
} from "lucide-react";

/**
 * API Usage Analytics Dashboard
 * 
 * Displays real-time API usage statistics, request history, and rate limit status
 * for retailers to monitor their API key performance.
 */

export default function ApiUsageAnalytics() {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");
  const [selectedApiKey, setSelectedApiKey] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const stats = {
    totalRequests: 1250,
    errorCount: 15,
    avgResponseTime: 245,
    successRate: 98,
  };

  const rateLimitData = {
    currentRequests: 45,
    rateLimit: 100,
    remaining: 55,
    percentageUsed: 45,
  };

  const usageTrends = [
    { time: "00:00", requests: 120, errors: 2 },
    { time: "04:00", requests: 95, errors: 1 },
    { time: "08:00", requests: 310, errors: 5 },
    { time: "12:00", requests: 280, errors: 3 },
    { time: "16:00", requests: 245, errors: 2 },
    { time: "20:00", requests: 200, errors: 2 },
  ];

  const errorBreakdown = [
    { name: "Timeout", value: 8, color: "#ef4444" },
    { name: "Invalid Request", value: 5, color: "#f97316" },
    { name: "Server Error", value: 2, color: "#eab308" },
  ];

  const requestHistory = [
    {
      id: 1,
      endpoint: "/api/try-on",
      method: "POST",
      status: 200,
      time: "245ms",
      timestamp: "2026-02-10 12:34:56",
    },
    {
      id: 2,
      endpoint: "/api/try-on",
      method: "POST",
      status: 200,
      time: "189ms",
      timestamp: "2026-02-10 12:34:45",
    },
    {
      id: 3,
      endpoint: "/api/widget",
      method: "GET",
      status: 200,
      time: "56ms",
      timestamp: "2026-02-10 12:34:30",
    },
    {
      id: 4,
      endpoint: "/api/try-on",
      method: "POST",
      status: 500,
      time: "1200ms",
      timestamp: "2026-02-10 12:34:15",
    },
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    alert("Export functionality coming soon");
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 400 && status < 500) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">API Usage Analytics</h1>
            <p className="text-muted-foreground">
              Monitor your API key performance and usage patterns
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(["1h", "24h", "7d", "30d"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === "1h"
                ? "1 Hour"
                : range === "24h"
                  ? "24 Hours"
                  : range === "7d"
                    ? "7 Days"
                    : "30 Days"}
            </Button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">
                in the last {timeRange}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.successRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalRequests - stats.errorCount} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {stats.errorCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.errorCount / stats.totalRequests) * 100).toFixed(1)}% error rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground mt-1">
                average latency
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rate Limit Status */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limit Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {rateLimitData.currentRequests} / {rateLimitData.rateLimit} requests
                  in current minute
                </span>
                <span className="text-sm text-muted-foreground">
                  {rateLimitData.percentageUsed}% used
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    rateLimitData.percentageUsed > 80
                      ? "bg-red-500"
                      : rateLimitData.percentageUsed > 50
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${rateLimitData.percentageUsed}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {rateLimitData.remaining} requests remaining • Resets in ~60 seconds
            </p>
          </CardContent>
        </Card>

        {/* Charts */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Usage Trends</TabsTrigger>
            <TabsTrigger value="errors">Error Breakdown</TabsTrigger>
            <TabsTrigger value="history">Request History</TabsTrigger>
          </TabsList>

          {/* Usage Trends Chart */}
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Request Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usageTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="requests"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Requests"
                    />
                    <Line
                      type="monotone"
                      dataKey="errors"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Errors"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Breakdown Chart */}
          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle>Error Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={errorBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {errorBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {errorBreakdown.map((error) => (
                    <div key={error.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: error.color }}
                      />
                      <span className="text-sm">
                        {error.name}: {error.value} ({error.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Request History */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4 font-medium">
                          Timestamp
                        </th>
                        <th className="text-left py-2 px-4 font-medium">
                          Endpoint
                        </th>
                        <th className="text-left py-2 px-4 font-medium">
                          Method
                        </th>
                        <th className="text-left py-2 px-4 font-medium">
                          Status
                        </th>
                        <th className="text-left py-2 px-4 font-medium">
                          Response Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestHistory.map((request) => (
                        <tr key={request.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4 text-xs text-muted-foreground">
                            {request.timestamp}
                          </td>
                          <td className="py-2 px-4 font-mono text-xs">
                            {request.endpoint}
                          </td>
                          <td className="py-2 px-4">
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {request.method}
                            </span>
                          </td>
                          <td className={`py-2 px-4 font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </td>
                          <td className="py-2 px-4 text-xs">{request.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Best Practices */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">API Usage Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2 text-sm">
            <p>
              • Monitor your rate limit usage to avoid hitting the 100 req/min
              threshold
            </p>
            <p>
              • Implement caching on your side to reduce redundant API calls
            </p>
            <p>
              • Use batch operations when available to optimize request count
            </p>
            <p>
              • Set up alerts when error rate exceeds 5% for quick issue
              detection
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
