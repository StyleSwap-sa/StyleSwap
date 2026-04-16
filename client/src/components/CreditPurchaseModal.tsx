import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShoppingCart, Zap, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  boutiqueId?: number;
  onPurchaseSuccess?: () => void;
}

export function CreditPurchaseModal({
  isOpen,
  onClose,
  boutiqueId,
  onPurchaseSuccess,
}: CreditPurchaseModalProps) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get credit tiers
  const { data: tiers, isLoading: tiersLoading } = trpc.billing.getCreditTiers.useQuery();

  // Initiate purchase mutation (works for both customer and boutique)
  const initiatePurchase = trpc.billing.initiatePurchase.useMutation();

  const handlePurchase = async () => {
    if (!selectedTier || !tiers) return;

    const tier = tiers.find(t => t.credits === selectedTier);
    if (!tier) return;

    setIsProcessing(true);
    setError(null);

    try {
      let result;
      
      if (boutiqueId) {
        // Boutique credit purchase
        result = await initiatePurchase.mutateAsync({
          boutiqueId,
          creditAmount: selectedTier,
        });
      } else {
        // Customer credit purchase - use userId instead
        result = await initiatePurchase.mutateAsync({
          creditAmount: selectedTier,
          // No boutiqueId - backend will treat as customer purchase
        });
      }

      // Redirect to payment if URL returned
      if (result && (result as any).paymentUrl) {
        window.location.href = (result as any).paymentUrl;
      } else {
        setError("Payment system error. No payment URL returned.");
      }

      onPurchaseSuccess?.();
    } catch (err: any) {
      console.error("Purchase error:", err);
      setError(err.message || "Failed to initiate purchase");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!tiers || tiersLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Buy More Credits
          </DialogTitle>
          <DialogDescription>
            Choose a credit package and instantly add credits to your account. No waiting, no monthly limits.
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {tiers.map((tier) => (
            <Card
              key={tier.credits}
              className={`p-4 cursor-pointer transition-all ${
                selectedTier === tier.credits
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedTier(tier.credits)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">{tier.credits} Credits</div>
                    <div className="text-sm text-muted-foreground">
                      R{tier.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary">
                      R{(tier.price / tier.credits).toFixed(2)}/credit
                    </div>
                  </div>
                </div>

                {/* Show savings for bulk packages */}
                {tier.credits >= 500 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded px-2 py-1">
                    <div className="text-xs font-semibold text-green-700">
                      💰 Best Value - Save up to 76%
                    </div>
                  </div>
                )}

                {/* Selection indicator */}
                {selectedTier === tier.credits && (
                  <div className="flex items-center gap-1 text-primary text-sm font-medium">
                    <Zap className="w-4 h-4 fill-primary" />
                    Selected
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Price Summary */}
        {selectedTier && tiers && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Credits:</span>
              <span className="font-semibold">{selectedTier}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Price:</span>
              <span className="font-semibold">
                R{(tiers.find(t => t.credits === selectedTier)?.price || 0).toFixed(2)}
              </span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-lg text-primary">
                R{(tiers.find(t => t.credits === selectedTier)?.price || 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={!selectedTier || isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Buy Credits Now
              </>
            )}
          </Button>
        </div>

        {/* Info Text */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>✓ Credits are added instantly after payment</p>
          <p>✓ No monthly limits - buy anytime you need more</p>
          <p>✓ Credits never expire</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}