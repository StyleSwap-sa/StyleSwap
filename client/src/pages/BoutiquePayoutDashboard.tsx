import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Link } from "wouter";

export default function BoutiquePayoutDashboard() {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Fetch credit usage summary
  const { data: creditSummary, isLoading: summaryLoading } = trpc.boutiques.getCreditsSummary.useQuery();

  // Fetch credit purchase history
  const { data: purchaseHistory, isLoading: historyLoading, refetch } = trpc.boutiques.getCreditPurchaseHistory.useQuery({
    limit: pageSize,
    offset: currentPage * pageSize,
  });

  if (summaryLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Credit Usage</h1>
          <p className="text-muted-foreground mt-2">Track your credit purchases and usage</p>
        </div>

        {/* Credit Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Credits Purchased */}
          <Card className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchased</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {creditSummary?.totalPurchased || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Credits purchased</p>
            </CardContent>
          </Card>

          {/* Total Used */}
          <Card className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Used</CardTitle>
              <Zap className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {creditSummary?.totalUsed || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Credits used for try-ons</p>
            </CardContent>
          </Card>

          {/* Remaining Credits */}
          <Card className="premium-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
              <Zap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {creditSummary?.remainingCredits || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Credits available</p>
            </CardContent>
          </Card>
        </div>

        {/* Buy More Credits CTA */}
        {creditSummary && creditSummary.remainingCredits < 50 && (
          <Card className="premium-card border-primary/30 bg-primary/5">
            <CardContent className="pt-6 flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold mb-2">Running low on credits?</p>
                <p className="text-sm text-muted-foreground mb-4">
                  You have {creditSummary.remainingCredits} credits remaining. Purchase more credits to continue offering try-ons to your customers.
                </p>
                <Link href={`/boutique-credits/${creditSummary.boutiqueId}`}>
                  <Button className="cursor-pointer">
                    <Zap className="w-4 h-4 mr-2" />
                    Buy Credits Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credit Purchase History */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : purchaseHistory && purchaseHistory.purchases.length > 0 ? (
              <div className="space-y-4">
                {purchaseHistory.purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <p className="font-semibold">{purchase.credits} Credits</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(purchase.purchaseDate), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R{purchase.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">R{(purchase.amount / purchase.credits).toFixed(2)}/credit</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No purchases yet</p>
                <Link href={`/boutique-credits/${creditSummary?.boutiqueId}`}>
                  <Button variant="outline" className="mt-4 cursor-pointer">
                    <Zap className="w-4 h-4 mr-2" />
                    Buy Your First Credits
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {purchaseHistory && purchaseHistory.total > pageSize && (
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {currentPage + 1} of {Math.ceil((purchaseHistory?.total || 0) / pageSize)}
            </span>
            <Button
              variant="outline"
              disabled={currentPage >= Math.ceil((purchaseHistory?.total || 0) / pageSize) - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
