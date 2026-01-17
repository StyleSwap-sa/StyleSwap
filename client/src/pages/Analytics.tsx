import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, ShoppingCart, DollarSign, Download } from "lucide-react";
import { useLocation } from "wouter";

export default function Analytics() {
  const { isAuthenticated, user } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();

  // Check if user is admin
  if (isAuthenticated && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the analytics dashboard.
            </p>
            <Button onClick={() => setLocation("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data for analytics
  const revenueData = [
    { month: "Jan", revenue: 12500, tryOns: 450 },
    { month: "Feb", revenue: 18900, tryOns: 680 },
    { month: "Mar", revenue: 22100, tryOns: 795 },
    { month: "Apr", revenue: 28500, tryOns: 1020 },
    { month: "May", revenue: 35200, tryOns: 1265 },
    { month: "Jun", revenue: 42800, tryOns: 1540 },
  ];

  const packagePopularity = [
    { name: "R45 (10)", value: 15, revenue: 675 },
    { name: "R80 (20)", value: 22, revenue: 1760 },
    { name: "R150 (50)", value: 28, revenue: 4200 },
    { name: "R385 (100)", value: 18, revenue: 6930 },
    { name: "R750 (200)", value: 12, revenue: 9000 },
    { name: "R1350 (500)", value: 5, revenue: 6750 },
  ];

  const customerMetrics = [
    { metric: "Total Customers", value: "2,847", change: "+12.5%", icon: Users },
    { metric: "Total Revenue", value: "R160,000", change: "+28.3%", icon: DollarSign },
    { metric: "Total Try-Ons", value: "5,750", change: "+35.2%", icon: ShoppingCart },
    { metric: "Avg. Revenue/Customer", value: "R56.20", change: "+18.7%", icon: TrendingUp },
  ];

  const COLORS = ["#FF6B35", "#F7931E", "#FDB913", "#37B7C3", "#2E86AB", "#A23B72"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">Business performance and customer insights</p>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {customerMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.metric}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.metric}
                    </CardTitle>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-green-600 mt-2">{metric.change} from last month</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Try-On Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#FF6B35" name="Revenue (R)" />
                <Line yAxisId="right" type="monotone" dataKey="tryOns" stroke="#37B7C3" name="Try-Ons" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Package Popularity */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={packagePopularity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#FF6B35" name="Purchases" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Package */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Package</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={packagePopularity}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {packagePopularity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Renelle Mofokeng", purchases: 8, revenue: "R3,200", tryOns: 450 },
                { name: "Sarah Johnson", purchases: 6, revenue: "R2,400", tryOns: 320 },
                { name: "Emma Wilson", purchases: 5, revenue: "R1,950", tryOns: 260 },
                { name: "Lisa Anderson", purchases: 4, revenue: "R1,600", tryOns: 215 },
                { name: "Jessica Brown", purchases: 3, revenue: "R1,200", tryOns: 160 },
              ].map((customer, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.purchases} purchases</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{customer.revenue}</p>
                    <p className="text-sm text-muted-foreground">{customer.tryOns} try-ons</p>
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
