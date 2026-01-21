import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YocoPaymentForm } from "@/components/YocoPaymentForm";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Zap, Check, AlertCircle } from "lucide-react";

interface CreditTier {
  id: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
}

const CREDIT_TIERS: CreditTier[] = [
  { id: "tier-1", credits: 100, price: 385, pricePerCredit: 3.85 },
  { id: "tier-2", credits: 200, price: 750, pricePerCredit: 3.75, popular: true },
  { id: "tier-3", credits: 500, price: 1350, pricePerCredit: 2.70 },
  { id: "tier-4", credits: 1000, price: 2200, pricePerCredit: 2.20 },
  { id: "tier-5", credits: 5000, price: 6250, pricePerCredit: 1.25 },
  { id: "tier-6", credits: 20000, price: 18600, pricePerCredit: 0.93 },
];

export default function BoutiqueCredits() {
  const [, params] = useRoute("/boutique-credits/:boutiqueId");
  const [, setLocation] = useLocation();
  const boutiqueId = params?.boutiqueId ? parseInt(params.boutiqueId) : null;
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current credits
  const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = trpc.boutiques.getCredits.useQuery(
    { boutiqueId: boutiqueId || 0 },
    { enabled: !!boutiqueId }
  );

  // Purchase credits mutation
  const purchaseMutation = trpc.boutiques.purchaseCredits.useMutation({
    onSuccess: () => {
      setSelectedTier(null);
      setError(null);
      setSuccessMessage("Credits purchased successfully!");
      refetchCredits();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (error) => {
      setError(error.message || "Payment failed. Please try again.");
    },
  });

  const handlePaymentSuccess = async (token: string) => {
    if (!selectedTier || !boutiqueId) return;

    const tier = CREDIT_TIERS.find((t) => t.id === selectedTier);
    if (!tier) return;

    setIsProcessing(true);
    setError(null);

    try {
      await purchaseMutation.mutateAsync({
        boutiqueId,
        credits: tier.credits,
        amount: tier.price * 100,
        token,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

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

        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-500 bg-green-50">
            <CardContent className="pt-6 flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Success</p>
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Payment Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

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
                onClick={() => {
                  setSelectedTier(tier.id);
                  setError(null);
                }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTier(tier.id);
                      setError(null);
                    }}
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

              <YocoPaymentForm
                amount={(CREDIT_TIERS.find((t) => t.id === selectedTier)?.price ?? 0) * 100}
                currency="ZAR"
                description={`${CREDIT_TIERS.find((t) => t.id === selectedTier)?.credits} credits for boutique`}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isProcessing={isProcessing}
                boutiqueId={boutiqueId}
                credits={CREDIT_TIERS.find((t) => t.id === selectedTier)?.credits}
              />

              <p className="text-xs text-muted-foreground text-center">
                Secure payment powered by Yoco
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
