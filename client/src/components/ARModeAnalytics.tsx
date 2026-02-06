import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Camera, Upload, TrendingUp } from "lucide-react";

interface ARAnalyticsData {
  totalARTryOns: number;
  totalUploadTryOns: number;
  arPercentage: number;
  uploadPercentage: number;
  conversionRateAR: number;
  conversionRateUpload: number;
  trendData: Array<{
    date: string;
    ar: number;
    upload: number;
  }>;
}

interface ARModeAnalyticsProps {
  data: ARAnalyticsData | null;
  isLoading: boolean;
}

export function ARModeAnalytics({ data, isLoading }: ARModeAnalyticsProps) {
  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading AR mode analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No analytics data available yet</p>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: "AR Try-Ons", value: data.arPercentage },
    { name: "Upload Try-Ons", value: data.uploadPercentage },
  ];

  const COLORS = ["#FF6B35", "#F7931E"];

  return (
    <>
      {/* AR Mode Overview */}
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            AR Try-Ons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold text-primary">{data.totalARTryOns}</div>
          <p className="text-sm text-muted-foreground">Total AR attempts</p>
          <div className="pt-2 border-t border-border/20">
            <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
            <p className="text-lg font-semibold">{data.conversionRateAR.toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Mode Overview */}
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-secondary" />
            Upload Try-Ons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold text-secondary">{data.totalUploadTryOns}</div>
          <p className="text-sm text-muted-foreground">Total upload attempts</p>
          <div className="pt-2 border-t border-border/20">
            <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
            <p className="text-lg font-semibold">{data.conversionRateUpload.toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Distribution Pie Chart */}
      <Card className="col-span-full lg:col-span-1">
        <CardHeader>
          <CardTitle>Try-On Mode Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Try-On Mode Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="ar"
                stroke="#FF6B35"
                name="AR Try-Ons"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="upload"
                stroke="#F7931E"
                name="Upload Try-Ons"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-sm font-medium text-primary">
              AR Mode Usage: {data.arPercentage.toFixed(1)}% of total try-ons
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.totalARTryOns} customers have used the AR try-on feature
            </p>
          </div>
          <div className="p-3 bg-secondary/10 rounded-lg">
            <p className="text-sm font-medium text-secondary">
              Upload Mode Usage: {data.uploadPercentage.toFixed(1)}% of total try-ons
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.totalUploadTryOns} customers have used the upload try-on feature
            </p>
          </div>
          <div className="p-3 bg-accent/10 rounded-lg">
            <p className="text-sm font-medium">
              {data.conversionRateAR > data.conversionRateUpload
                ? "AR mode shows higher conversion"
                : "Upload mode shows higher conversion"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              AR: {data.conversionRateAR.toFixed(1)}% vs Upload: {data.conversionRateUpload.toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
