import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, TrendingUp, Activity, Zap } from "lucide-react";
import { toast } from "sonner";

export default function MonitoringDashboard() {
  const [apiKey, setApiKey] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check rate limit
  const rateLimitQuery = trpc.monitoring.checkRateLimit.useQuery(
    { apiKey, status: selectedStatus },
    { enabled: !!apiKey, refetchInterval: autoRefresh ? 5000 : false }
  );

  // Get usage stats
  const usageStatsQuery = trpc.monitoring.getUsageStats.useQuery(
    { apiKey },
    { enabled: !!apiKey, refetchInterval: autoRefresh ? 10000 : false }
  );

  // Get all usage stats (admin)
  const allStatsQuery = trpc.monitoring.getAllUsageStats.useQuery(undefined, {
    refetchInterval: autoRefresh ? 15000 : false,
  });

  const handleLoadDashboard = () => {
    if (!apiKey) {
      toast.error("Please enter an API key");
      return;
    }
    // Queries will auto-refetch with the new apiKey
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">API Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Track API usage and rate limits in real-time</p>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Dashboard Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter API Key (sk_...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleLoadDashboard}>Load Dashboard</Button>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium">Status Filter</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="mt-1 px-3 py-2 border rounded"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <span className="text-sm">Auto-refresh (5s)</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limit Status */}
        {apiKey && rateLimitQuery.data?.success && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Rate Limit Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rateLimitQuery.data.allowed ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-green-600">✓ Allowed</p>
                    <p className="text-sm text-muted-foreground">
                      Remaining: {rateLimitQuery.data.remaining} requests
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Resets: {new Date(rateLimitQuery.data.resetAt).toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-red-600">✗ Limited</p>
                    <p className="text-sm text-red-600">{rateLimitQuery.data.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Resets: {new Date(rateLimitQuery.data.resetAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {usageStatsQuery.data?.success && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Total Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">
                      {usageStatsQuery.data.stats.totalRequests}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">All-time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Last 24 Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-600">
                      {usageStatsQuery.data.stats.requestsInLastDay}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {usageStatsQuery.data.stats.requestsInLastHour} in last hour
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Top Endpoints */}
        {usageStatsQuery.data?.success && usageStatsQuery.data.stats.topEndpoints.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Top Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usageStatsQuery.data.stats.topEndpoints.map((endpoint, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="font-mono text-sm">{endpoint.endpoint}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded h-2">
                        <div
                          className="bg-blue-500 h-2 rounded"
                          style={{
                            width: `${
                              (endpoint.count /
                                usageStatsQuery.data.stats.topEndpoints[0].count) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">
                        {endpoint.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Apps Usage (Admin) */}
        {allStatsQuery.data?.success && (
          <Card>
            <CardHeader>
              <CardTitle>All Apps Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">API Key</th>
                      <th className="text-right py-2 px-2">Total Requests</th>
                      <th className="text-right py-2 px-2">Last Hour</th>
                      <th className="text-right py-2 px-2">Last Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStatsQuery.data.stats.map((stat, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 font-mono text-xs">{stat.apiKey}</td>
                        <td className="text-right py-2 px-2">{stat.totalRequests}</td>
                        <td className="text-right py-2 px-2">{stat.requestsInLastHour}</td>
                        <td className="text-right py-2 px-2">{stat.requestsInLastDay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {rateLimitQuery.data?.success === false && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-800">Error Loading Dashboard</p>
                <p className="text-sm text-red-700">{rateLimitQuery.data.error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!apiKey && (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">Enter your API Key to get started</p>
              <p className="text-sm text-muted-foreground">
                Monitor your API usage, rate limits, and performance metrics in real-time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
