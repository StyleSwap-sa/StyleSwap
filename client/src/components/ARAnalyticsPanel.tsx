import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Camera, Upload, TrendingUp } from "lucide-react";

interface ARAnalyticsPanelProps {
  arUsageCount?: number;
  uploadUsageCount?: number;
  totalUsage?: number;
  arTrendData?: Array<{ date: string; ar: number; upload: number }>;
}

export function ARAnalyticsPanel({
  arUsageCount = 0,
  uploadUsageCount = 0,
  totalUsage = 0,
  arTrendData = [],
}: ARAnalyticsPanelProps) {
  const arPercentage = totalUsage > 0 ? Math.round((arUsageCount / totalUsage) * 100) : 0;
  const uploadPercentage = totalUsage > 0 ? Math.round((uploadUsageCount / totalUsage) * 100) : 0;

  const modeDistributionData = [
    { name: "AR Try-On", value: arUsageCount, color: "#FF6B35" },
    { name: "Upload Try-On", value: uploadUsageCount, color: "#4F46E5" },
  ];

  const COLORS = ["#FF6B35", "#4F46E5"];

  return (
    <div className="space-y-6">
      {/* AR Analytics Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">AR Mode Analytics</h2>
        <p className="text-muted-foreground">Track customer usage between AR and Upload try-on modes</p>
      </div>

      {/* Mode Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AR Try-On Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Camera className="w-4 h-4 text-orange-500" />
              AR Try-On Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{arUsageCount}</div>
            <p className="text-xs text-muted-foreground mt-2">{arPercentage}% of total usage</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${arPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload Try-On Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-500" />
              Upload Try-On Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{uploadUsageCount}</div>
            <p className="text-xs text-muted-foreground mt-2">{uploadPercentage}% of total usage</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Total Try-Ons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalUsage}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalUsage > 0 ? `Avg ${Math.round(totalUsage / 30)} per day` : "No data yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mode Distribution Pie Chart */}
      {totalUsage > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Try-On Mode Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {modeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Usage Trend Chart */}
      {arTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Try-On Mode Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={arTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ar"
                  stroke="#FF6B35"
                  name="AR Try-On"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="upload"
                  stroke="#4F46E5"
                  name="Upload Try-On"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalUsage === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No try-on data available yet</p>
              <p className="text-xs text-muted-foreground mt-2">Analytics will appear once customers start using AR and Upload modes</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
