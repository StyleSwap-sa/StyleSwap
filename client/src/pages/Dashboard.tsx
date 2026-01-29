import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, History, Shirt, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";


type DashboardTab = "overview" | "history";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  // Redirect based on user type (skip for admins testing customer dashboard)
  useEffect(() => {
    if (isAuthenticated && user) {
      const params = new URLSearchParams(window.location.search);
      const isTestingCustomer = params.get('test') === 'customer';
      
      if (!isTestingCustomer) {
        if (user.userType === 'admin' || user.role === 'admin') {
          setLocation('/admin');
        } else if (user.userType === 'merchant') {
          setLocation('/boutique-dashboard');
        }
      }
    }
  }, [isAuthenticated, user, setLocation]);

  // Handle tab query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as DashboardTab | null;
    if (tab && ['overview', 'try-on', 'history'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  // Fetch user credits
  const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = 
    trpc.tryon.getCredits.useQuery();

  // TODO: Fetch transaction history
  const transactions: any[] = [];
  const transactionsLoading = false;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/20 px-6 py-8">
          <h1 className="text-4xl font-bold mb-2">StyleSwap Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
        </div>

        {/* Credits Overview */}
        <div className="grid md:grid-cols-3 gap-6 p-6 border-b border-border/20">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-primary" />
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <div className="text-4xl font-bold text-primary">
                  {credits?.totalCredits || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-secondary" />
                Remaining Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <div className="text-4xl font-bold text-secondary">
                  {credits?.remainingCredits || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-foreground/50" />
                Used Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <div className="text-4xl font-bold text-foreground/50">
                  {credits?.usedCredits || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-6 border-b border-border/20 bg-secondary/5">
          <Button
            onClick={() => setActiveTab("overview")}
            variant={activeTab === "overview" ? "default" : "outline"}
            className={activeTab === "overview" ? "premium-button" : ""}
          >
            Overview
          </Button>
          <Button
            onClick={() => setActiveTab("history")}
            variant={activeTab === "history" ? "default" : "outline"}
            className={activeTab === "history" ? "premium-button" : ""}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>

          {/* Admin Dashboard Link - Only visible to owner */}
          {(user?.role === 'admin' || user?.userType === 'admin') && (
            <Button
              onClick={() => setLocation('/admin')}
              variant="outline"
              className="ml-auto border-primary/50 text-primary hover:bg-primary/10"
            >
              Platform Analytics
            </Button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <Card className="premium-card border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardHeader>
                  <CardTitle>Welcome to StyleSwap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Start your virtual try-on journey with StyleSwap's AI-powered fitting room technology.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-bold flex items-center gap-2">
                        <Shirt className="w-5 h-5 text-primary" />
                        Try On Garments
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Upload your photo and select from our catalog to see how garments look on you
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-secondary" />
                        Browse Catalog
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Explore our curated collection of premium garments across all categories
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Share Results
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Share your try-on results on social media and inspire your friends
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setActiveTab("try-on")}
                      className="premium-button bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Start Try-On
                    </Button>
                  <Button
                    onClick={() => window.location.href = '/pricing'}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Buy More Credits
                  </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle>Your Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Credits Purchased</p>
                      <p className="text-2xl font-bold">{credits?.totalCredits || 0}</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Credits Used</p>
                      <p className="text-2xl font-bold">{credits?.usedCredits || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}





          {/* Transaction History Tab */}
          {activeTab === "history" && (
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center p-4 bg-secondary/5 rounded-lg border border-border/20 hover:border-border/40 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium capitalize">{tx.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {tx.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${
                            tx.type === "purchase" ? "text-primary" : "text-foreground/70"
                          }`}>
                            {tx.type === "purchase" ? "+" : "-"}{tx.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No transactions yet. Buy credits to get started!
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer CTA */}
        {credits && credits.remainingCredits < 5 && (
          <div className="p-6 bg-primary/10 border-t border-primary/20 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              You're running low on credits! Get more to continue enjoying StyleSwap.
            </p>
            <Button
              onClick={() => window.location.href = '/pricing'}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Buy More Credits
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
