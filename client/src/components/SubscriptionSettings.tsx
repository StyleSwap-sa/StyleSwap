import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionSettingsProps {
  boutiqueId: number;
}

export function SubscriptionSettings({ boutiqueId }: SubscriptionSettingsProps) {
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: subscription, isLoading, refetch } = trpc.subscription.getSubscription.useQuery(
    { boutiqueId },
    { enabled: !!boutiqueId }
  );

  const reactivateMutation = trpc.subscription.reactivateSubscription.useMutation();

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync({ boutiqueId });
      toast({
        title: "Subscription reactivated",
        description: "Your subscription has been reactivated successfully!",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to reactivate",
        description: error.message || "An error occurred while reactivating your subscription",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription?.subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No subscription found</p>
        </CardContent>
      </Card>
    );
  }

  const sub = subscription.subscription;
  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    active: {
      icon: <CheckCircle className="h-4 w-4" />,
      color: "bg-green-100 text-green-800",
      label: "Active",
    },
    cancelled: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: "bg-gray-100 text-gray-800",
      label: "Cancelled",
    },
    suspended: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: "bg-red-100 text-red-800",
      label: "Suspended",
    },
    expired: {
      icon: <Clock className="h-4 w-4" />,
      color: "bg-yellow-100 text-yellow-800",
      label: "Expired",
    },
  };

  const statusInfo = statusConfig[sub.status] || statusConfig.active;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription Settings</CardTitle>
              <CardDescription>Manage your subscription plan and billing</CardDescription>
            </div>
            <Badge className={statusInfo.color} variant="outline">
              <span className="mr-1">{statusInfo.icon}</span>
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan Type</p>
              <p className="mt-1 text-lg font-semibold capitalize">
                {sub.planType || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Billing Cycle</p>
              <p className="mt-1 text-lg font-semibold capitalize">
                {sub.billingCycle || "N/A"}
              </p>
            </div>
            {sub.currentPeriodEnd && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Billing Date</p>
                <p className="mt-1 text-lg font-semibold">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            )}
            {subscription.lastPayment && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Payment</p>
                <p className="mt-1 text-lg font-semibold">
                  {new Date(subscription.lastPayment.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {sub.status === "cancelled" && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                Your subscription has been cancelled. You can reactivate it anytime to regain access
                to premium features.
              </p>
            </div>
          )}

          {sub.status === "suspended" && (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Your subscription has been suspended. Please contact support to resolve this issue.
              </p>
            </div>
          )}

          {sub.status === "active" && (
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-700">
                Your subscription is active and you have full access to all premium features.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {sub.status === "active" && (
              <Button
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                Cancel Subscription
              </Button>
            )}

            {sub.status === "cancelled" && (
              <Button
                onClick={handleReactivate}
                disabled={reactivateMutation.isPending}
                className="w-full sm:w-auto"
              >
                {reactivateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reactivating...
                  </>
                ) : (
                  "Reactivate Subscription"
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => window.location.href = "/support"}
              className="w-full sm:w-auto"
            >
              Contact Support
            </Button>
          </div>

          {/* Help Text */}
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-medium">💡 Need help?</p>
            <p className="mt-1">
              If you have any questions about your subscription, please{" "}
              <a href="/contact" className="underline hover:no-underline">
                contact our support team
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        boutiqueId={boutiqueId}
        onSuccess={() => refetch()}
      />
    </>
  );
}
