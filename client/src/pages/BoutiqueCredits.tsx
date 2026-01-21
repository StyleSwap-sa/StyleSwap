import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Zap, Check } from "lucide-react";

interface CreditTier {
  id: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
}

const CREDIT_TIERS: CreditTier[] = [
  { id: "tier-1", credits: 10, price: 50, pricePerCredit: 5.00 },
  { id: "tier-2", credits: 50, price: 225, pricePerCredit: 4.50, popular: true },
  { id: "tier-3", credits: 100, price: 400, pricePerCredit: 4.00 },
  { id: "tier-4", credits: 250, price: 875, pricePerCredit: 3.50 },
  { id: "tier-5", credits: 500, price: 1500, pricePerCredit: 3.00 },
  { id: "tier-6", credits: 1000, price: 2500, pricePerCredit: 2.50 },
];

export default function BoutiqueCredits() {
  const [, params] = useRoute("/boutique-credits/:boutiqueId");
  const [, setLocation] = useLocation();
  const boutiqueId = params?.boutiqueId ? parseInt(params.boutiqueId) : null;
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Fetch current credits
  const { data: credits, isLoading: creditsLoading } = trpc.boutiques.getCredits.useQuery(
    { boutiqueId: boutiqueId || 0 },
    { enabled: !!boutiqueId }
  );

  if (!boutiqueId || creditsLoading) {
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/boutique-dashboard")}
            className="cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Buy Credits</h1>
            <p className="text-muted-foreground mt-2">
              Purchase credits for your customers to use virtual try-ons
            </p>
          </div>
        </div>

        {/* Current Credits */}
        <Card className="premium-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Your Current Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Credits</p>
                <p className="text-3xl font-bold">{credits?.totalCredits || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Used Credits</p>
                <p className="text-3xl font-bold">{credits?.usedCredits || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Remaining Credits</p>
                <p className="text-3xl font-bold text-primary">{credits?.remainingCredits || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Tiers */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Choose Your Package</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {CREDIT_TIERS.map((tier) => (
              <Card
                key={tier.id}
                className={`premium-card cursor-pointer transition-all ${
                  selectedTier === tier.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:shadow-lg"
                } ${tier.popular ? "md:scale-105" : ""}`}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.popular && (
                  <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.credits} Credits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Price</p>
                    <p className="text-3xl font-bold">R{tier.price.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-sm text-muted-foreground">Price per credit</p>
                    <p className="font-bold">R{tier.pricePerCredit.toFixed(2)}</p>
                  </div>
              <Button
                className="w-full cursor-pointer"
                variant={selectedTier === tier.id ? "default" : "outline"}
                onClick={() => setSelectedTier(tier.id)}
              >
                {selectedTier === tier.id ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Selected
                  </>
                ) : (
                  "Select"
                )}
              </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Checkout */}
        {selectedTier && (
          <Card className="premium-card border-primary/30">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">
                  {CREDIT_TIERS.find((t) => t.id === selectedTier)?.credits} Credits
                </span>
                <span className="font-bold">
                  R{CREDIT_TIERS.find((t) => t.id === selectedTier)?.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary text-2xl">
                  R{CREDIT_TIERS.find((t) => t.id === selectedTier)?.price.toFixed(2)}
                </span>
              </div>
              <Button className="w-full cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg">
                Proceed to Payment
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Secure payment powered by Stripe
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
