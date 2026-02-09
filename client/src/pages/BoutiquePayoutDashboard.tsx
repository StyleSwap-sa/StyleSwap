import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Clock, AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function BoutiquePayoutDashboard() {
  const [selectedPayout, setSelectedPayout] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Fetch earnings summary
  const { data: summary, isLoading: summaryLoading } = trpc.payouts.getEarningsSummary.useQuery();

  // Fetch payout history
  const { data: payoutData, isLoading: historyLoading, refetch } = trpc.payouts.getPayoutHistory.useQuery({
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  // Fetch bank account
  const { data: bankAccount } = trpc.payouts.getBankAccount.useQuery();

  // Fetch payout details when selected
  const { data: payoutDetails } = trpc.payouts.getPayoutDetails.useQuery(
    { payoutId: selectedPayout! },
    { enabled: !!selectedPayout }
  );

  // Sync payout status mutation
  const { mutate: syncStatus, isPending: isSyncing } = trpc.payouts.syncPayoutStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payout Dashboard</h1>
          <p className="text-gray-600">Track your earnings and payout history</p>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Earnings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{summary?.totalEarnings.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500 mt-1">From completed payouts</p>
            </CardContent>
          </Card>

          {/* Pending Payouts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{summary?.pendingPayouts.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-gray-500 mt-1">Processing or pending</p>
            </CardContent>
          </Card>

          {/* Failed Payouts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Payouts</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.failedPayouts || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Bank Account Section */}
        {bankAccount && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Bank Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Account Holder</p>
                  <p className="font-semibold">{bankAccount.accountHolderName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Number</p>
                  <p className="font-semibold font-mono">{bankAccount.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Branch Code</p>
                  <p className="font-semibold font-mono">{bankAccount.bankBranchCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Type</p>
                  <p className="font-semibold capitalize">{bankAccount.accountType}</p>
                </div>
              </div>
              {bankAccount.isVerified ? (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">Account verified and active</span>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">Account pending verification</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : payoutData?.payouts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No payouts yet</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Reference</th>
                        <th className="text-left py-3 px-4 font-semibold">Period</th>
                        <th className="text-right py-3 px-4 font-semibold">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                        <th className="text-center py-3 px-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutData?.payouts.map((payout) => (
                        <tr key={payout.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-xs">{payout.referenceNumber}</td>
                          <td className="py-3 px-4 text-xs">
                            {new Date(payout.payoutPeriodStart).toLocaleDateString()} -{" "}
                            {new Date(payout.payoutPeriodEnd).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            R{parseFloat(payout.boutiquePayout).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`${getStatusColor(payout.status)} flex w-fit items-center gap-1`}>
                              {getStatusIcon(payout.status)}
                              <span className="capitalize">{payout.status}</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-600">
                            {formatDistanceToNow(new Date(payout.createdAt), { addSuffix: true })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPayout(payout.id)}
                              className="text-xs"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {payoutData?.payouts.map((payout) => (
                    <Card key={payout.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs text-gray-600">Reference</p>
                            <p className="font-mono text-xs font-semibold">{payout.referenceNumber}</p>
                          </div>
                          <Badge className={`${getStatusColor(payout.status)} flex items-center gap-1`}>
                            {getStatusIcon(payout.status)}
                            <span className="capitalize text-xs">{payout.status}</span>
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-600">Amount</p>
                            <p className="font-semibold">R{parseFloat(payout.boutiquePayout).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Date</p>
                            <p className="text-xs">
                              {formatDistanceToNow(new Date(payout.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayout(payout.id)}
                          className="w-full text-xs"
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Showing {currentPage * pageSize + 1} to{" "}
                    {Math.min((currentPage + 1) * pageSize, payoutData?.pagination.total || 0)} of{" "}
                    {payoutData?.pagination.total || 0}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!payoutData?.pagination.hasMore}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payout Details Modal */}
        {selectedPayout && payoutDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Payout Details</CardTitle>
                <button
                  onClick={() => setSelectedPayout(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="font-semibold mb-3">Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Reference</p>
                      <p className="font-mono text-sm font-semibold">{payoutDetails.payout.referenceNumber}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Status</p>
                      <Badge className={`${getStatusColor(payoutDetails.payout.status)} mt-1 w-fit`}>
                        {payoutDetails.payout.status}
                      </Badge>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Total Revenue</p>
                      <p className="font-semibold">R{parseFloat(payoutDetails.payout.totalRevenue).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Your Payout</p>
                      <p className="font-semibold text-green-600">
                        R{parseFloat(payoutDetails.payout.boutiquePayout).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div>
                  <h3 className="font-semibold mb-3">Revenue Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Total Revenue</span>
                      <span className="font-semibold">R{parseFloat(payoutDetails.payout.totalRevenue).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">Yoco Fee (2.5%)</span>
                      <span className="font-semibold">-R{parseFloat(payoutDetails.payout.yokoFees).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm">StyleSwap Commission (5%)</span>
                      <span className="font-semibold">-R{parseFloat(payoutDetails.payout.styleswapCommission).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-50 rounded border-2 border-green-200">
                      <span className="text-sm font-semibold">Your Payout (92.5%)</span>
                      <span className="font-bold text-green-600">
                        R{parseFloat(payoutDetails.payout.boutiquePayout).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transactions */}
                {payoutDetails.transactions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Transactions ({payoutDetails.transactions.length})</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {payoutDetails.transactions.map((tx) => (
                        <div key={tx.id} className="border rounded p-3">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold">Order {tx.orderId}</span>
                            <span className="text-sm font-semibold">
                              R{parseFloat(tx.boutiqueShare).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Order Amount:</span>
                              <span>R{parseFloat(tx.orderAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Your Share:</span>
                              <span>R{parseFloat(tx.boutiqueShare).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Log */}
                {payoutDetails.auditLog.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Activity Log</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {payoutDetails.auditLog.map((log) => (
                        <div key={log.id} className="border-l-2 border-gray-300 pl-3 py-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-semibold capitalize">{log.action.replace(/_/g, " ")}</span>
                            <span className="text-xs text-gray-600">
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {log.oldStatus && <span>{log.oldStatus}</span>}
                            {log.oldStatus && log.newStatus && <span> → </span>}
                            {log.newStatus && <span className="font-semibold">{log.newStatus}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sync Button */}
                {payoutDetails.payout.status !== "completed" && (
                  <Button
                    onClick={() => syncStatus({ payoutId: selectedPayout })}
                    disabled={isSyncing}
                    className="w-full"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      "Sync Status with Yoco"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
