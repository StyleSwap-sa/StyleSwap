import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Clock, Pause } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Subscription {
  id: number;
  boutiqueId: number;
  boutiqueName: string;
  planName: string;
  monthlyLimit: number;
  status: "active" | "inactive" | "suspended" | "expired" | "cancelled";
  billingCycle: "monthly" | "annual";
  autoRenew: number;
  usagePeriodStart: string;
  usagePeriodEnd: string;
  updatedAt: string;
}

export function SubscriptionAdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedBoutique, setSelectedBoutique] = useState<number | null>(null);

  const { data: subscriptions, isLoading: isLoadingSubscriptions } =
    trpc.subscriptionAdmin.listSubscriptions.useQuery({
      status: statusFilter as any,
      limit: 50,
      offset: 0,
    });

  const { data: statistics } = trpc.subscriptionAdmin.getStatistics.query();

  const { data: auditLog } = trpc.subscriptionAdmin.getAuditLog.useQuery(
    selectedBoutique ? { boutiqueId: selectedBoutique, limit: 20 } : undefined,
    { enabled: !!selectedBoutique }
  );

  const suspendMutation = trpc.subscriptionAdmin.suspendSubscription.useMutation({
    onSuccess: () => {
      // Refetch subscriptions
    },
  });

  const reactivateMutation = trpc.subscriptionAdmin.reactivateSubscription.useMutation({
    onSuccess: () => {
      // Refetch subscriptions
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "suspended":
        return <Pause className="w-5 h-5 text-red-600" />;
      case "expired":
        return <XCircle className="w-5 h-5 text-orange-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Suspended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.suspended}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.expired}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{statistics.cancelled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === undefined ? "default" : "outline"}
              onClick={() => setStatusFilter(undefined)}
              size="sm"
            >
              All
            </Button>
            {["active", "suspended", "expired", "cancelled", "inactive"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                size="sm"
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSubscriptions ? (
            <div className="text-center py-8">Loading subscriptions...</div>
          ) : subscriptions?.subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No subscriptions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Boutique</th>
                    <th className="text-left py-2 px-2">Plan</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Billing</th>
                    <th className="text-left py-2 px-2">Period</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions?.subscriptions.map((sub: Subscription) => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <button
                          onClick={() => setSelectedBoutique(sub.boutiqueId)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {sub.boutiqueName}
                        </button>
                      </td>
                      <td className="py-3 px-2">{sub.planName}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(sub.status)}
                          <Badge className={getStatusColor(sub.status)}>
                            {sub.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="capitalize">{sub.billingCycle}</span>
                      </td>
                      <td className="py-3 px-2 text-xs">
                        {sub.usagePeriodStart} to {sub.usagePeriodEnd}
                      </td>
                      <td className="py-3 px-2">
                        {sub.status === "active" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              suspendMutation.mutate({
                                boutiqueId: sub.boutiqueId,
                                reason: "Admin action",
                              })
                            }
                          >
                            Suspend
                          </Button>
                        ) : sub.status === "suspended" ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              reactivateMutation.mutate({
                                boutiqueId: sub.boutiqueId,
                                reason: "Admin action",
                              })
                            }
                          >
                            Reactivate
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log */}
      {selectedBoutique && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Log for Boutique #{selectedBoutique}</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLog?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No audit logs</div>
            ) : (
              <div className="space-y-2">
                {auditLog?.map((log: any) => (
                  <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">{log.reason}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
