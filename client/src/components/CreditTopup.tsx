import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CreditTopupProps {
  boutiqueId?: number;
  currentCredits?: number;
  onSuccess?: () => void;
}

export function CreditTopup({ boutiqueId, currentCredits = 0, onSuccess }: CreditTopupProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Credit packages with pricing
  const creditPackages = [
    { id: "100", credits: 100, price: 385, pricePerCredit: 3.85 },
    { id: "250", credits: 250, price: 875, pricePerCredit: 3.50 },
    { id: "500", credits: 500, price: 1650, pricePerCredit: 3.30 },
    { id: "1000", credits: 1000, price: 3100, pricePerCredit: 3.10 },
  ];

  const getSelectedPackage = () => {
    if (selectedPackage === "custom" && customAmount) {
      const credits = parseInt(customAmount);
      return { credits, price: credits * 3.85 }; // Base rate for custom
    }
    return creditPackages.find((pkg) => pkg.id === selectedPackage);
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !boutiqueId) {
      setError("Please select a credit package");
      return;
    }

    const pkg = getSelectedPackage();
    if (!pkg) {
      setError("Invalid package selection");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // In a real implementation, this would integrate with Yoco payment
      // For now, we'll show the flow
      const result = await trpc.boutiques.purchaseCredits.useMutation().mutateAsync({
        boutiqueId,
        credits: pkg.credits,
        amount: pkg.price,
        token: "mock_token", // This would come from payment gateway
      });

      if (result.success) {
        setSuccess(true);
        setSelectedPackage(null);
        setCustomAmount("");
        setTimeout(() => {
          setSuccess(false);
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to purchase credits");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Up Credits</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Current balance: <span className="font-semibold">{currentCredits} credits</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">Credits purchased successfully!</p>
            </div>
          )}

          {/* Credit Packages */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Select Package</Label>
            <div className="grid grid-cols-2 gap-3">
              {creditPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPackage === pkg.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold text-lg">{pkg.credits}</div>
                  <div className="text-sm text-muted-foreground">Credits</div>
                  <div className="font-bold text-primary mt-2">R{pkg.price}</div>
                  <div className="text-xs text-muted-foreground">R{pkg.pricePerCredit}/credit</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <Label htmlFor="custom-credits" className="text-base font-semibold mb-2 block">
              Or Enter Custom Amount
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="custom-credits"
                  type="number"
                  placeholder="Enter number of credits"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) {
                      setSelectedPackage("custom");
                    }
                  }}
                  min="1"
                  className="h-10"
                />
              </div>
              <div className="flex items-center px-3 bg-muted rounded-md">
                <span className="text-sm font-medium">
                  {customAmount ? `R${(parseInt(customAmount) * 3.85).toFixed(2)}` : "R0.00"}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Minimum: 1 credit (R3.85)</p>
          </div>

          {/* Non-Refundable Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900">
              <strong>Note:</strong> Credit purchases are non-refundable. Credits do not expire and can be used anytime.
            </p>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            disabled={!selectedPackage || isProcessing}
            className="w-full h-11 text-base"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Purchase Credits - R${getSelectedPackage()?.price || "0.00"}`
            )}
          </Button>

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              Credits are deducted per virtual try-on. You can purchase credits anytime without restrictions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
