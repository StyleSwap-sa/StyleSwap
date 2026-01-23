import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Trash2,
  Filter,
} from 'lucide-react';

interface Alert {
  id: number;
  alertType: 'webhook_failed' | 'webhook_max_retries' | 'payment_unmatched' | 'payment_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  isResolved: number;
  resolvedAt?: string;
  createdAt: string;
  webhookEventId?: number;
  paymentReconciliationId?: number;
}

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

const SEVERITY_ICONS = {
  low: <AlertCircle className="w-4 h-4" />,
  medium: <AlertTriangle className="w-4 h-4" />,
  high: <AlertTriangle className="w-4 h-4" />,
  critical: <AlertCircle className="w-4 h-4" />,
};

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved');
  const [loading, setLoading] = useState(true);

  // Fetch alerts (you'll need to add this tRPC endpoint)
  useEffect(() => {
    // Simulated data - replace with actual tRPC call
    const mockAlerts: Alert[] = [
      {
        id: 1,
        alertType: 'webhook_max_retries',
        severity: 'critical',
        title: 'Webhook failed after max retries',
        description: 'Yoco payment webhook failed 3 times. Manual intervention needed.',
        isResolved: 0,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        webhookEventId: 123,
      },
      {
        id: 2,
        alertType: 'payment_unmatched',
        severity: 'high',
        title: 'Unmatched Yoco payment',
        description: 'Payment R45.00 from 2026-01-18 not found in StyleSwap',
        isResolved: 0,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        paymentReconciliationId: 456,
      },
      {
        id: 3,
        alertType: 'webhook_failed',
        severity: 'medium',
        title: 'Webhook delivery failed',
        description: 'Connection timeout while delivering webhook',
        isResolved: 1,
        resolvedAt: new Date(Date.now() - 1800000).toISOString(),
        createdAt: new Date(Date.now() - 10800000).toISOString(),
      },
    ];

    setAlerts(mockAlerts);
    setLoading(false);
  }, []);

  // Apply filter
  useEffect(() => {
    let filtered = alerts;

    if (filter === 'unresolved') {
      filtered = alerts.filter((a) => a.isResolved === 0);
    } else if (filter === 'critical') {
      filtered = alerts.filter((a) => a.severity === 'critical' && a.isResolved === 0);
    }

    setFilteredAlerts(filtered);
  }, [alerts, filter]);

  const handleResolve = (alertId: number) => {
    setAlerts(
      alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              isResolved: 1,
              resolvedAt: new Date().toISOString(),
            }
          : a
      )
    );
  };

  const handleRetry = async (webhookEventId?: number) => {
    if (!webhookEventId) return;
    // Call tRPC endpoint to retry webhook
    console.log('Retrying webhook:', webhookEventId);
  };

  const handleDelete = (alertId: number) => {
    setAlerts(alerts.filter((a) => a.id !== alertId));
  };

  const unresolvedCount = alerts.filter((a) => a.isResolved === 0).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.isResolved === 0).length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Webhook & Payment Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage webhook delivery failures and payment reconciliation issues
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{alerts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unresolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{unresolvedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Urgent action required</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            All Alerts
          </Button>
          <Button
            variant={filter === 'unresolved' ? 'default' : 'outline'}
            onClick={() => setFilter('unresolved')}
            className="gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Unresolved ({unresolvedCount})
          </Button>
          <Button
            variant={filter === 'critical' ? 'default' : 'outline'}
            onClick={() => setFilter('critical')}
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Critical ({criticalCount})
          </Button>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading alerts...
              </CardContent>
            </Card>
          ) : filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <p>No alerts to display</p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`border-l-4 ${
                  alert.severity === 'critical'
                    ? 'border-l-red-600'
                    : alert.severity === 'high'
                      ? 'border-l-orange-600'
                      : alert.severity === 'medium'
                        ? 'border-l-yellow-600'
                        : 'border-l-blue-600'
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${SEVERITY_COLORS[alert.severity]}`}
                        >
                          {SEVERITY_ICONS[alert.severity]}
                          {alert.severity.toUpperCase()}
                        </div>
                        {alert.isResolved === 1 && (
                          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            RESOLVED
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold mb-1">{alert.title}</h3>
                      {alert.description && (
                        <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                        {alert.resolvedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      {alert.isResolved === 0 && (
                        <>
                          {alert.webhookEventId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetry(alert.webhookEventId)}
                              className="gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Retry
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolve(alert.id)}
                          >
                            Mark Resolved
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(alert.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
