import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Shield,
  Clock,
  Download,
  Filter,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Verification Analytics Dashboard
 * Displays platform-wide verification metrics and trends
 */

export default function VerificationAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [verificationFilter, setVerificationFilter] = useState('all');

  // Fetch analytics data
  const { data: analytics, isLoading } = trpc.verificationAnalytics.getAnalytics.useQuery(
    {
      timeRange,
      verificationFilter,
    },
    { enabled: true }
  );

  const handleExport = () => {
    // Export analytics as CSV
    const csv = generateCSV(analytics);
    downloadCSV(csv, `verification-analytics-${new Date().toISOString()}.csv`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Verification Analytics</h1>
            <p className="text-muted-foreground">
              Platform-wide boutique verification metrics and trends
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex gap-4 flex-col md:flex-row">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Verification Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="formal">Formal Business</SelectItem>
                <SelectItem value="social_media">Social Media Sellers</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Boutiques */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Boutiques</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-bold">{analytics?.totalBoutiques || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                +{analytics?.newBoutiquesThisPeriod || 0} this period
              </p>
            </CardContent>
          </Card>

          {/* Verified Boutiques */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Verified</span>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-3xl font-bold">{analytics?.verifiedBoutiques || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {analytics?.verificationRate || 0}% approval rate
              </p>
            </CardContent>
          </Card>

          {/* Pending Verifications */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Pending</span>
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold">{analytics?.pendingVerifications || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Avg {analytics?.avgVerificationDays || 0} days to approve
              </p>
            </CardContent>
          </Card>

          {/* Fraud Flags */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Fraud Flags</span>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-3xl font-bold">{analytics?.fraudFlagsDetected || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {analytics?.fraudResolutionRate || 0}% resolved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verification Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Trend</CardTitle>
              <CardDescription>Boutiques verified over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.verificationTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="#10b981"
                    name="Approved"
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="#f59e0b"
                    name="Pending"
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    stroke="#ef4444"
                    name="Rejected"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Verification Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Boutiques by verification status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#6b7280" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trust Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Trust Score Distribution</CardTitle>
              <CardDescription>Boutiques by trust score range</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.trustScoreDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fraud Detection Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection</CardTitle>
              <CardDescription>Fraud flags detected over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.fraudTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="detected"
                    stroke="#ef4444"
                    name="Detected"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#10b981"
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Metrics</CardTitle>
            <CardDescription>Verification statistics by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Metric</th>
                    <th className="text-right py-3 px-4 font-medium">Formal Business</th>
                    <th className="text-right py-3 px-4 font-medium">Social Media</th>
                    <th className="text-right py-3 px-4 font-medium">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">Total Submissions</td>
                    <td className="text-right">{analytics?.formalSubmissions || 0}</td>
                    <td className="text-right">{analytics?.socialMediaSubmissions || 0}</td>
                    <td className="text-right font-medium">
                      {(analytics?.formalSubmissions || 0) + (analytics?.socialMediaSubmissions || 0)}
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">Approval Rate</td>
                    <td className="text-right">{analytics?.formalApprovalRate || 0}%</td>
                    <td className="text-right">{analytics?.socialMediaApprovalRate || 0}%</td>
                    <td className="text-right font-medium">{analytics?.verificationRate || 0}%</td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">Avg Trust Score</td>
                    <td className="text-right">{analytics?.formalAvgTrustScore || 0}/100</td>
                    <td className="text-right">{analytics?.socialMediaAvgTrustScore || 0}/100</td>
                    <td className="text-right font-medium">{analytics?.overallAvgTrustScore || 0}/100</td>
                  </tr>
                  <tr className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">Avg Days to Approve</td>
                    <td className="text-right">{analytics?.formalAvgDays || 0} days</td>
                    <td className="text-right">{analytics?.socialMediaAvgDays || 0} days</td>
                    <td className="text-right font-medium">{analytics?.avgVerificationDays || 0} days</td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="py-3 px-4">Fraud Flag Rate</td>
                    <td className="text-right">{analytics?.formalFraudRate || 0}%</td>
                    <td className="text-right">{analytics?.socialMediaFraudRate || 0}%</td>
                    <td className="text-right font-medium">{analytics?.overallFraudRate || 0}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Generate CSV from analytics data
 */
function generateCSV(analytics: any): string {
  const headers = [
    'Metric',
    'Value',
    'Formal Business',
    'Social Media',
  ];

  const rows = [
    ['Total Boutiques', analytics?.totalBoutiques || 0],
    ['Verified Boutiques', analytics?.verifiedBoutiques || 0],
    ['Pending Verifications', analytics?.pendingVerifications || 0],
    ['Fraud Flags Detected', analytics?.fraudFlagsDetected || 0],
    ['Verification Rate', `${analytics?.verificationRate || 0}%`],
    ['Fraud Resolution Rate', `${analytics?.fraudResolutionRate || 0}%`],
    ['Avg Verification Days', analytics?.avgVerificationDays || 0],
  ];

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csv;
}

/**
 * Download CSV file
 */
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
