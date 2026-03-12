import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { YocoCheckout } from "./YocoCheckout";

interface CreditTopupProps {
  boutiqueId?: number;
  currentCredits?: number;
  onSuccess?: () => void;
}

export function CreditTopup({ boutiqueId, currentCredits = 0, onSuccess }: CreditTopupProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Credit packages with pricing
  const creditPackages = [
    { id: "100", credits: 100, price: 38500, pricePerCredit: 3.85 }, // 385 in cents
    { id: "250", credits: 250, price: 87500, pricePerCredit: 3.50 }, // 875 in cents
    { id: "500", credits: 500, price: 165000, pricePerCredit: 3.30 }, // 1650 in cents
    { id: "1000", credits: 1000, price: 310000, pricePerCredit: 3.10 }, // 3100 in cents
  ];

  const getSelectedPackage = () => {
    return creditPackages.find((pkg) => pkg.id === selectedPackage);
  };

  const handlePaymentSuccess = async (token: string) => {
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
      // Send token to backend for charging
      const result = await trpc.boutiques.purchaseCredits.useMutation().mutateAsync({
        boutiqueId,
        credits: pkg.credits,
        amount: pkg.price / 100, // Convert cents to rand
        token: token,
      });

      if (result.success) {
        setSuccess(true);
        setSelectedPackage(null);
        setShowCheckout(false);
        setTimeout(() => {
          setSuccess(false);
          onSuccess?.();
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process payment";
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
    setIsProcessing(false);
  };

  if (!boutiqueId) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-900">Please log in to purchase credits</p>
      </div>
    );
  }

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
          {error && !showCheckout && (
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

          {!showCheckout ? (
            <>
              {/* Credit Packages */}
              <div>
                <label className="text-base font-semibold mb-3 block">Select Package</label>
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
                      <div className="font-bold text-primary mt-2">R{(pkg.price / 100).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">R{pkg.pricePerCredit}/credit</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Non-Refundable Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-900">
                  <strong>Note:</strong> Credit purchases are non-refundable. Credits do not expire and can be used anytime.
                </p>
              </div>

              {/* Proceed to Payment Button */}
              <Button
                onClick={() => setShowCheckout(true)}
                disabled={!selectedPackage}
                className="w-full h-11 text-base"
                size="lg"
              >
                Proceed to Payment - R{(getSelectedPackage()?.price ?? 0) / 100}
              </Button>

              {/* Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  Credits are deducted per virtual try-on. You can purchase credits anytime without restrictions.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Yoco Checkout Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Payment Details</h3>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ← Back
                  </button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{getSelectedPackage()?.credits} Credits</span>
                    <span className="text-lg font-bold text-primary">R{(getSelectedPackage()?.price ?? 0) / 100}</span>
                  </div>
                </div>

                <YocoCheckout
                  amount={getSelectedPackage()?.price ?? 0}
                  description={`${getSelectedPackage()?.credits} try-on credits`}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isProcessing={isProcessing}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
