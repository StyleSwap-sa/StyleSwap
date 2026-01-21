import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, Users, Zap, DollarSign } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard() {
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<number | null>(null);

  // Fetch platform metrics
  const { data: metrics, isLoading: metricsLoading } = trpc.admin.getPlatformMetricsData.useQuery();

  // Fetch boutiques list
  const { data: boutiques, isLoading: boutiquesLoading } = trpc.admin.getBoutiquesListPaginated.useQuery({
    limit: 20,
    offset: 0,
  });

  // Fetch credits usage analytics
  const { data: creditsUsage, isLoading: creditsUsageLoading } = trpc.admin.getCreditsUsageAnalytics.useQuery();

  // Fetch top boutiques
  const { data: topBoutiques, isLoading: topBoutiquesLoading } = trpc.admin.getTopPerformingBoutiques.useQuery({
    limit: 5,
  });

  // Calculate credit burn rate
  const calculateBurnRate = () => {
    if (!creditsUsage || creditsUsage.length === 0) return 0;
    const totalUsed = creditsUsage.reduce((sum, day) => sum + (day.creditsUsed || 0), 0);
    return Math.round(totalUsed / creditsUsage.length);
  };

  const burnRate = calculateBurnRate();

  // Calculate days remaining
  const daysRemaining = metrics && metrics.remainingCredits > 0 && burnRate > 0 
    ? Math.ceil(metrics.remainingCredits / burnRate)
    : 0;

  // Colors for charts
  const COLORS = ["#FF6B35", "#F7931E", "#FDB913", "#C1272D", "#662E9B"];

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Platform Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor your platform's credit usage, boutique subscriptions, and revenue metrics</p>
        </div>

        {/* Credit Alert */}
        {metrics && metrics.creditUsagePercentage > 80 && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="pt-6 flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">High Credit Usage Alert</h3>
                <p className="text-sm text-red-800">
                  Your platform is using {metrics.creditUsagePercentage}% of total credits. 
                  {daysRemaining > 0 && ` Estimated ${daysRemaining} days remaining at current burn rate.`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Boutiques */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Boutiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{metrics?.totalBoutiques || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics?.activeBoutiques || 0} active, {metrics?.inactiveBoutiques || 0} inactive
              </p>
            </CardContent>
          </Card>

          {/* Total Credits */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{metrics?.totalCredits || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics?.remainingCredits || 0} remaining
              </p>
            </CardContent>
          </Card>

          {/* Credit Usage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Credit Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{metrics?.creditUsagePercentage || 0}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${metrics?.creditUsagePercentage || 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">R{(metrics?.totalRevenue || 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics?.activeBoutiques && metrics.activeBoutiques > 0
                  ? `R${(metrics.totalRevenue / metrics.activeBoutiques).toFixed(2)} per boutique`
                  : "No active boutiques"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credits Usage Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Credits Usage Trend (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {creditsUsageLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Loading chart...</p>
                </div>
              ) : creditsUsage && creditsUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={creditsUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="creditsUsed" stroke="#FF6B35" name="Credits Used" />
                    <Line type="monotone" dataKey="creditsPurchased" stroke="#4CAF50" name="Credits Purchased" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Boutiques */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Boutiques by Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {topBoutiquesLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : topBoutiques && topBoutiques.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topBoutiques}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usedCredits" fill="#FF6B35" name="Credits Used" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Boutiques List */}
        <Card>
          <CardHeader>
            <CardTitle>Boutiques List</CardTitle>
          </CardHeader>
          <CardContent>
            {boutiquesLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading boutiques...</p>
              </div>
            ) : boutiques && boutiques.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Total Credits</th>
                      <th className="text-left py-3 px-4 font-semibold">Used Credits</th>
                      <th className="text-left py-3 px-4 font-semibold">Remaining</th>
                      <th className="text-left py-3 px-4 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boutiques.map((boutique) => (
                      <tr key={boutique.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{boutique.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            boutique.status === 'active' ? 'bg-green-100 text-green-800' :
                            boutique.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {boutique.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{boutique.totalCredits || 0}</td>
                        <td className="py-3 px-4">{boutique.usedCredits || 0}</td>
                        <td className="py-3 px-4">{boutique.remainingCredits || 0}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(boutique.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No boutiques found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Daily Burn Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{burnRate} credits/day</div>
              <p className="text-xs text-muted-foreground mt-2">Average daily credit usage</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{daysRemaining} days</div>
              <p className="text-xs text-muted-foreground mt-2">
                {daysRemaining > 30 ? "Healthy supply" : daysRemaining > 7 ? "Monitor closely" : "Critical - reorder soon"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Boutiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metrics?.activeBoutiques || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics?.totalBoutiques && metrics.activeBoutiques 
                  ? `${Math.round((metrics.activeBoutiques / metrics.totalBoutiques) * 100)}% of total`
                  : "No boutiques"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
