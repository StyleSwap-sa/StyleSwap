import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BoutiqueOnboarding } from "@/components/BoutiqueOnboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Zap, Plus, Settings, Download, Loader2, Copy, Check, Instagram, Music, Facebook, MessageCircle, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { BatchUploadComponent } from "@/components/BatchUploadComponent";

export default function BoutiqueDashboard() {
  const [selectedBoutique, setSelectedBoutique] = useState<number | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Fetch user's boutiques
  const { data: boutiques, isLoading: boutiquesLoading } =
    trpc.boutiques.myBoutiques.useQuery();

  // Fetch billing summary
  const { data: billingSummary, isLoading: billingSummaryLoading } =
    trpc.billing.getBillingSummary.useQuery(
      { boutiqueId: selectedBoutique || 0 },
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

  // Show onboarding if triggered
  if (showOnboarding) {
    return <BoutiqueOnboarding onComplete={() => setShowOnboarding(false)} />;
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
  const isLoading = billingSummaryLoading;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold">Boutique Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Manage your products and credits below.
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
                  Boutique #{boutique.id}
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
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="premium-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    R{(billingSummary?.totalSpending || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    All time
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    R{billingSummary?.averageCostPerCredit || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Per try-on
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold capitalize">
                    Active
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Boutique status
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-4 gap-6">
              <Link href="/products">
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
              </Link>

              <Link href="/boutique-try-on">
                <Card className="premium-card cursor-pointer hover:shadow-lg transition">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 text-primary">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold mb-2">Test Try-Ons</h3>
                    <p className="text-sm text-muted-foreground">
                      Test your products with all clothing types
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href={`/boutique-credits/${selectedBoutique}`}>
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
              </Link>

              <Link href={`/boutique-settings/${selectedBoutique}`}>
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
              </Link>
            </div>

            {/* Landing Page & Social Media */}
            {currentBoutique && (
              <Card className="premium-card border-primary/30">
                <CardHeader>
                  <CardTitle>Your Online Presence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Free Landing Page */}
                  <div className="border-b pb-6">
                    <h4 className="font-bold mb-3">🎁 Free Landing Page</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {currentBoutique.websiteUrl 
                        ? "You have a website. You can also use this free landing page to share on social media:"
                        : "Since you don't have a website, we've created a free landing page for you!"}
                    </p>
                    <div className="flex items-center gap-2 bg-muted/50 p-3 rounded border border-border">
                      <code className="text-xs flex-1 overflow-x-auto">
                        styleswap.co.za/boutique/{currentBoutique.slug}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://styleswap.co.za/boutique/${currentBoutique.slug}`);
                          setCopiedUrl(true);
                          setTimeout(() => setCopiedUrl(false), 2000);
                        }}
                      >
                        {copiedUrl ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this link on your social media to let customers discover your boutique and try on your products!
                    </p>
                  </div>

                  {/* Social Media Links */}
                  {(currentBoutique.instagramHandle || currentBoutique.tiktokHandle || currentBoutique.facebookUrl || currentBoutique.whatsappNumber) && (
                    <div>
                      <h4 className="font-bold mb-3">📱 Connected Social Media</h4>
                      <div className="space-y-2">
                        {currentBoutique.instagramHandle && (
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <Instagram className="w-4 h-4 text-pink-600" />
                            <span className="text-sm">{currentBoutique.instagramHandle}</span>
                          </div>
                        )}
                        {currentBoutique.tiktokHandle && (
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <Music className="w-4 h-4" />
                            <span className="text-sm">{currentBoutique.tiktokHandle}</span>
                          </div>
                        )}
                        {currentBoutique.facebookUrl && (
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <Facebook className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">Facebook</span>
                          </div>
                        )}
                        {currentBoutique.whatsappNumber && (
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <MessageCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{currentBoutique.whatsappNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Batch Upload */}
            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Batch Upload Your Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload multiple clothing images at once to quickly build your catalog
                </p>
                <BatchUploadComponent />
              </CardContent>
            </Card>

            {/* Getting Started */}
            <Card className="premium-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold">Upload Your Products</h4>
                    <p className="text-sm text-muted-foreground">
                      Add your clothing items to the catalog
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold">Purchase Credits</h4>
                    <p className="text-sm text-muted-foreground">
                      Buy credits for your customers to use
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">Embed the Widget on Your Website</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Copy and paste this code into your website HTML:
                    </p>
                    <div className="bg-background/50 border border-border rounded p-3 font-mono text-xs overflow-x-auto mb-3 max-w-full">
                      <code>&lt;script src="https://widget.styleswap.co.za/embed.js"&gt;&lt;/script&gt;</code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add this script to your website header. The widget will appear on product pages, letting customers try on clothes before buying.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
