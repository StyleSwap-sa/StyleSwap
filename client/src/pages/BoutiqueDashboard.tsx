import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  Plus,
  Settings,
  Download,
} from "lucide-react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function BoutiqueDashboard() {
  const [selectedBoutique, setSelectedBoutique] = useState<number | null>(null);
  
  // Fetch user's boutiques
  const { data: boutiques, isLoading: boutiquesLoading } =
    trpc.boutiques.myBoutiques.useQuery();

  // Fetch dashboard overview
  const { data: overview, isLoading: overviewLoading } =
    trpc.boutiqueDashboard.getOverview.useQuery(
      { boutiqueId: selectedBoutique || 0 },
      { enabled: !!selectedBoutique }
    );

  // Fetch recent try-ons
  const { data: recentTryOns, isLoading: tryOnsLoading } =
    trpc.boutiqueDashboard.getRecentTryOns.useQuery(
      { boutiqueId: selectedBoutique || 0, limit: 5 },
      { enabled: !!selectedBoutique }
    );

  // Fetch product performance
  const { data: productPerformance, isLoading: performanceLoading } =
    trpc.boutiqueDashboard.getProductPerformance.useQuery(
      { boutiqueId: selectedBoutique || 0, limit: 5 },
      { enabled: !!selectedBoutique }
    );

  // Set first boutique as default
  useEffect(() => {
    if (boutiques && boutiques.length > 0 && !selectedBoutique) {
      setSelectedBoutique(boutiques[0].id);
    }
  }, [boutiques, selectedBoutique]);

  if (boutiquesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!boutiques || boutiques.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold">Boutiques</h1>
            <p className="text-muted-foreground mt-2">
              You haven't registered any boutiques yet
            </p>
          </div>

          <Card className="premium-card">
            <CardContent className="pt-12 text-center space-y-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Get Started with StyleSwap
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Register your boutique to start offering virtual try-ons to
                  your customers
                </p>
              </div>
              <Link href="/b2b-signup">
                <Button className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Register Boutique
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const currentBoutique = boutiques.find((b) => b.id === selectedBoutique);
  const isLoading = overviewLoading || tryOnsLoading || performanceLoading;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              {currentBoutique?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/boutique-products/${selectedBoutique}`}>
              <Button variant="outline" className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
            <Button variant="outline" className="cursor-pointer">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Boutique Selector */}
        {boutiques.length > 1 && (
          <div>
            <label className="text-sm font-medium">Select Boutique</label>
          <select
            value={selectedBoutique || ""}
            onChange={(e) => setSelectedBoutique(parseInt(e.target.value))}
              className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background"
            >
              {boutiques.map((boutique) => (
                <option key={boutique.id} value={boutique.id}>
                  {boutique.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="premium-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Credits Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {overview?.credits?.remaining || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {overview?.credits?.isExpired ? 'Expired' : 'Active'}
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Try-Ons This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {overview?.credits?.used || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    of {overview?.credits?.total || 0} total
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    R{(overview?.billing?.totalSpending || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total spent
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold capitalize">
                    {overview?.boutique?.status || 'Active'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Boutique status
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Try-Ons */}
            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Recent Try-Ons</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTryOns && recentTryOns.length > 0 ? (
                  <div className="space-y-4">
                    {recentTryOns.map((tryOn: any) => (
                      <div
                        key={tryOn.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition"
                      >
                        <div className="flex-1">
                          <div className="font-medium">Try-On #{tryOn.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(tryOn.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">-1 Credit</div>
                          <div className="text-sm text-muted-foreground">
                            {tryOn.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No try-ons yet. Add products and start getting customers!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
              </CardHeader>
              <CardContent>
                {productPerformance && productPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {productPerformance.map((product: any) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">Product #{product.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.id} try-ons
                          </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="premium-card cursor-pointer hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">Add Products</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your clothing catalog
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card cursor-pointer hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">Buy Credits</h3>
                  <p className="text-sm text-muted-foreground">
                    Purchase more try-ons
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card cursor-pointer hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary">
                    <Settings className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure your boutique
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
