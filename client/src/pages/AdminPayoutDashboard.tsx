import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Clock, DollarSign, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function AdminPayoutDashboard() {
  const { user } = useAuth();
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Only administrators can access this dashboard</p>
        </div>
      </div>
    );
  }

  // Fetch payout statistics
  const { data: stats, isLoading: statsLoading } = trpc.admin.payouts.getPayoutStatistics.useQuery();

  // Fetch failed payouts
  const { data: failedPayouts, isLoading: failedLoading } = trpc.admin.payouts.getFailedPayouts.useQuery({
    limit: 50,
  });

  // Fetch pending payouts
  const { data: pendingPayouts, isLoading: pendingLoading } = trpc.admin.payouts.getPendingPayouts.useQuery({
    limit: 50,
  });

  // Retry failed payouts mutation
  const retryMutation = trpc.admin.payouts.retryFailedPayouts.useMutation();
  const processMutation = trpc.admin.payouts.processPendingPayouts.useMutation();

  const handleRetrySelected = async () => {
    if (selectedPayouts.length === 0) return;

    try {
      await retryMutation.mutateAsync({ payoutIds: selectedPayouts });
      setSelectedPayouts([]);
      // Refetch data
    } catch (error) {
      console.error("Error retrying payouts:", error);
    }
  };

  const handleProcessPending = async () => {
    try {
      await processMutation.mutateAsync();
    } catch (error) {
      console.error("Error processing pending payouts:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Payout Management</h1>
          <p className="text-muted-foreground">Manage boutique payouts and handle failed transfers</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">R{stats.completedAmount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-xs text-muted-foreground mt-1">R{stats.failedAmount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R{stats.totalAmount}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={handleProcessPending}
            disabled={!pendingPayouts || pendingPayouts.length === 0 || processMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {processMutation.isPending ? "Processing..." : "Process All Pending"}
          </Button>

          <Button
            onClick={handleRetrySelected}
            disabled={selectedPayouts.length === 0 || retryMutation.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {retryMutation.isPending ? "Retrying..." : `Retry Selected (${selectedPayouts.length})`}
          </Button>
        </div>

        {/* Failed Payouts Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Failed Payouts ({failedPayouts?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {failedLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : failedPayouts && failedPayouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPayouts(failedPayouts.map((p) => p.payoutId));
                              } else {
                                setSelectedPayouts([]);
                              }
                            }}
                            checked={selectedPayouts.length === failedPayouts.length}
                          />
                        </th>
                        <th className="text-left py-2 px-2">Boutique</th>
                        <th className="text-left py-2 px-2">Amount</th>
                        <th className="text-left py-2 px-2">Reason</th>
                        <th className="text-left py-2 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedPayouts.map((payout) => (
                        <tr key={payout.payoutId} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2">
                            <input
                              type="checkbox"
                              checked={selectedPayouts.includes(payout.payoutId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPayouts([...selectedPayouts, payout.payoutId]);
                                } else {
                                  setSelectedPayouts(selectedPayouts.filter((id) => id !== payout.payoutId));
                                }
                              }}
                            />
                          </td>
                          <td className="py-2 px-2 font-medium">{payout.boutiqueName}</td>
                          <td className="py-2 px-2">R{payout.amount}</td>
                          <td className="py-2 px-2 text-muted-foreground text-xs">{payout.failureReason}</td>
                          <td className="py-2 px-2 text-muted-foreground text-xs">
                            {new Date(payout.failedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No failed payouts</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Payouts Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pending Payouts ({pendingPayouts?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : pendingPayouts && pendingPayouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Boutique</th>
                        <th className="text-left py-2 px-2">Amount</th>
                        <th className="text-left py-2 px-2">Email</th>
                        <th className="text-left py-2 px-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayouts.map((payout) => (
                        <tr key={payout.payoutId} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2 font-medium">{payout.boutiqueName}</td>
                          <td className="py-2 px-2">R{payout.amount}</td>
                          <td className="py-2 px-2 text-muted-foreground text-xs">{payout.ownerEmail}</td>
                          <td className="py-2 px-2 text-muted-foreground text-xs">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No pending payouts</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
