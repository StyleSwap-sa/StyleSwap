import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar, CheckCircle, Clock, CreditCard, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { format } from "date-fns";

/**
 * Customer Subscription Status Page
 * Displays subscription details, renewal date, and payment history
 */
export default function SubscriptionStatus() {
  const { user, loading: authLoading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Fetch subscription details
  const { data: subscriptionData, isLoading: subscriptionLoading } = trpc.subscriptionAdmin.getUserSubscriptionStatus.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch payment history
  const { data: paymentHistory, isLoading: paymentLoading } = trpc.payment.getPaymentHistory.useQuery(
    { month: selectedMonth },
    { enabled: !!user?.id }
  );

  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please log in to view your subscription status.</p>
            <Button className="w-full">Log In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subscription = subscriptionData?.subscription;
  const validation = subscriptionData?.validation;

  // Determine status color and icon
  const getStatusDisplay = () => {
    switch (validation?.status) {
      case "active":
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          label: "Active",
          color: "bg-green-50 border-green-200",
          textColor: "text-green-900",
        };
      case "suspended":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          label: "Suspended",
          color: "bg-red-50 border-red-200",
          textColor: "text-red-900",
        };
      case "expired":
        return {
          icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
          label: "Expired",
          color: "bg-orange-50 border-orange-200",
          textColor: "text-orange-900",
        };
      case "inactive":
        return {
          icon: <Clock className="w-6 h-6 text-gray-500" />,
          label: "Inactive",
          color: "bg-gray-50 border-gray-200",
          textColor: "text-gray-900",
        };
      default:
        return {
          icon: <AlertCircle className="w-6 h-6 text-gray-500" />,
          label: "Unknown",
          color: "bg-gray-50 border-gray-200",
          textColor: "text-gray-900",
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const daysUntilExpiry = subscription
    ? Math.ceil(
        (new Date(subscription.usagePeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Subscription Status</h1>
          <p className="text-muted-foreground">Manage your subscription and view payment history</p>
        </div>

        {/* Status Card */}
        <Card className={`mb-8 border-2 ${statusDisplay.color}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusDisplay.icon}
                <div>
                  <CardTitle className={statusDisplay.textColor}>
                    Subscription {statusDisplay.label}
                  </CardTitle>
                  <p className={`text-sm ${statusDisplay.textColor}`}>
                    {validation?.reason || "Your subscription is active and valid"}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Subscription Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Plan Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Plan Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan Name</p>
                <p className="text-lg font-semibold">{subscription?.planName || "No active plan"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing Cycle</p>
                <p className="text-lg font-semibold capitalize">{subscription?.billingCycle || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Limit</p>
                <p className="text-lg font-semibold">{subscription?.monthlyLimit || 0} try-ons</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto-Renewal</p>
                <p className="text-lg font-semibold">{subscription?.autoRenew ? "Enabled" : "Disabled"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Renewal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Renewal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Period</p>
                <p className="text-lg font-semibold">
                  {subscription?.usagePeriodStart ? format(new Date(subscription.usagePeriodStart), "MMM d, yyyy") : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renewal Date</p>
                <p className="text-lg font-semibold">
                  {subscription?.usagePeriodEnd ? format(new Date(subscription.usagePeriodEnd), "MMM d, yyyy") : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Until Renewal</p>
                <p className={`text-lg font-semibold ${daysUntilExpiry <= 7 ? "text-orange-600" : "text-green-600"}`}>
                  {daysUntilExpiry} days
                </p>
              </div>
              {daysUntilExpiry <= 7 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-900">
                    ⚠️ Your subscription expires soon. Renew now to avoid service interruption.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Try-ons Used This Month</p>
                  <p className="text-sm font-semibold">
                    {subscription?.currentMonthUsage || 0} / {subscription?.monthlyLimit || 0}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{
                      width: `${
                        subscription?.monthlyLimit
                          ? Math.min((subscription.currentMonthUsage / subscription.monthlyLimit) * 100, 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {subscription?.monthlyLimit ? subscription.monthlyLimit - subscription.currentMonthUsage : 0} try-ons remaining
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button className="flex-1" size="lg">
            Renew Subscription
          </Button>
          <Button variant="outline" className="flex-1" size="lg">
            Upgrade Plan
          </Button>
          <Button variant="outline" className="flex-1" size="lg">
            View Invoice
          </Button>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentHistory && paymentHistory.length > 0 ? (
                paymentHistory.map((payment: any) => (
                  <div key={payment.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R{payment.amount}</p>
                      <p className={`text-sm ${payment.status === "completed" ? "text-green-600" : "text-orange-600"}`}>
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No payment history available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
