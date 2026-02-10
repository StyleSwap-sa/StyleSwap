import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Shield,
  RefreshCw,
  Mail,
  Download,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Admin Verification Metrics Panel
 * Shows verification statistics and pending actions for admin dashboard
 */

export function AdminVerificationMetrics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [sortBy, setSortBy] = useState('pending');

  // Fetch verification metrics
  const { data: metrics, isLoading, refetch } = trpc.adminVerification.getMetrics.useQuery(
    { timeRange },
    { enabled: true }
  );

  // Fetch pending verifications
  const { data: pendingVerifications } = trpc.adminVerification.getPendingVerifications.useQuery(
    { sortBy, limit: 10 },
    { enabled: true }
  );

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    const csv = generateMetricsCSV(metrics);
    downloadCSV(csv, `verification-metrics-${new Date().toISOString()}.csv`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold">Verification Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Boutique verification statistics and pending actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Verifications */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Total</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">{metrics?.totalVerifications || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{metrics?.newThisPeriod || 0} this period
            </p>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Approved</span>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{metrics?.approvedCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.approvalRate || 0}% approval rate
            </p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Pending</span>
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold">{metrics?.pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {metrics?.avgReviewTime || 0} hours to review
            </p>
          </CardContent>
        </Card>

        {/* Fraud Flags */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Fraud Flags</span>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold">{metrics?.fraudFlags || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.fraudResolutionRate || 0}% resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Verifications Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pending Verifications</CardTitle>
              <CardDescription>Awaiting admin review</CardDescription>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Oldest First</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="risk">Highest Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Boutique</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Submitted</th>
                  <th className="text-left py-3 px-4 font-medium">Risk Level</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingVerifications && pendingVerifications.length > 0 ? (
                  pendingVerifications.map((verification: any) => (
                    <tr key={verification.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{verification.boutique.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {verification.boutique.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {verification.verificationType === 'formal'
                            ? 'Formal Business'
                            : 'Social Media'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {new Date(verification.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge riskLevel={verification.riskLevel} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReviewVerification(verification.id)}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No pending verifications
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Fraud Alerts */}
      {metrics?.fraudAlerts && metrics.fraudAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Fraud Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.fraudAlerts.map((alert: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                  <div>
                    <div className="font-medium text-red-900">{alert.boutiqueName}</div>
                    <div className="text-sm text-red-700">{alert.reason}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInvestigateFraud(alert.boutiqueId)}
                  >
                    Investigate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Verifications */}
      {metrics?.expiringVerifications && metrics.expiringVerifications.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.expiringVerifications.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-yellow-200">
                  <div>
                    <div className="font-medium text-yellow-900">{item.boutiqueName}</div>
                    <div className="text-sm text-yellow-700">
                      Expires in {item.daysUntilExpiry} days
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSendReminder(item.boutiqueId)}
                  >
                    <Mail className="w-4 h-4" />
                    Send Reminder
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Risk Level Badge Component
 */
function RiskBadge({ riskLevel }: { riskLevel: string }) {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <Badge className={colors[riskLevel as keyof typeof colors] || colors.low}>
      {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
    </Badge>
  );
}

/**
 * Handler functions
 */
function handleReviewVerification(verificationId: number) {
  // Navigate to verification review page
  window.location.href = `/admin/verification/${verificationId}/review`;
}

function handleInvestigateFraud(boutiqueId: number) {
  // Navigate to fraud investigation page
  window.location.href = `/admin/fraud/${boutiqueId}`;
}

function handleSendReminder(boutiqueId: number) {
  // Send reminder email
  console.log(`Sending reminder to boutique ${boutiqueId}`);
  // Call API to send reminder
}

/**
 * Generate metrics CSV
 */
function generateMetricsCSV(metrics: any): string {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Verifications', metrics?.totalVerifications || 0],
    ['Approved', metrics?.approvedCount || 0],
    ['Pending', metrics?.pendingCount || 0],
    ['Rejected', metrics?.rejectedCount || 0],
    ['Fraud Flags', metrics?.fraudFlags || 0],
    ['Approval Rate', `${metrics?.approvalRate || 0}%`],
    ['Avg Review Time', `${metrics?.avgReviewTime || 0} hours`],
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
