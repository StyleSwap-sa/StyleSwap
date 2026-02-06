import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, History, Shirt, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { MobileNavMenu } from "@/components/MobileNavMenu";


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

        {/* Navigation Tabs - Mobile Hamburger Menu + Desktop Tabs */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-border/20 bg-secondary/5">
          {/* Desktop Navigation Tabs */}
          <div className="hidden sm:flex sm:flex-row sm:flex-wrap gap-2 w-full">
            <Button
              onClick={() => setActiveTab("overview")}
              variant={activeTab === "overview" ? "default" : "outline"}
              className={`${activeTab === "overview" ? "premium-button" : ""} text-xs sm:text-base px-2 sm:px-4`}
              size="sm"
            >
              Overview
            </Button>
            <Button
              onClick={() => setLocation('/try-on')}
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10 text-xs sm:text-base px-2 sm:px-4"
              size="sm"
            >
              Try-On
            </Button>
            <Button
              onClick={() => setActiveTab("history")}
              variant={activeTab === "history" ? "default" : "outline"}
              className={`${activeTab === "history" ? "premium-button" : ""} text-xs sm:text-base px-2 sm:px-4`}
              size="sm"
            >
              <History className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            {/* Admin Dashboard Link - Only visible to owner */}
            {(user?.role === 'admin' || user?.userType === 'admin') && (
              <Button
                onClick={() => setLocation('/admin')}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10 text-xs sm:text-base px-2 sm:px-4 ml-auto"
                size="sm"
              >
                Analytics
              </Button>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <MobileNavMenu
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onTryOnClick={() => setLocation('/try-on')}
            onAdminClick={() => setLocation('/admin')}
            isAdmin={user?.role === 'admin' || user?.userType === 'admin'}
          />
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
                  <div className="flex flex-col gap-3 pt-4">
                    <Button
                      onClick={() => setLocation('/try-on')}
                      className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                    >
                      Choose Try-On Mode
                    </Button>
                    <Button
                      onClick={() => setActiveTab("try-on")}
                      className="premium-button bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full"
                    >
                      Classic Upload
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/pricing'}
                      className="bg-foreground/10 text-foreground hover:bg-foreground/20 w-full"
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

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : transactions.length === 0 ? (
                    <p className="text-muted-foreground">No transactions yet</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Transaction list would go here */}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
