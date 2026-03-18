import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export function FreeTrialWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Check free trial status
  const { data: freeTrialStatus, isLoading, error } = trpc.freeTrial.getStatus.useQuery(undefined, {
    enabled: true,
    retry: 2,
  });

  // Claim free trial mutation
  const claimFreeTrial = trpc.freeTrial.claimFreeTrial.useMutation();

  // Show modal if user has free trial available
  useEffect(() => {
    console.log("[FreeTrialModal] Query state:", { 
      freeTrialStatus, 
      isLoading, 
      error,
      hasFreeTrial: freeTrialStatus?.hasFreeTrial 
    });
    
    if (!isLoading && freeTrialStatus) {
      if (freeTrialStatus.hasFreeTrial === true) {
        console.log("[FreeTrialModal] Opening modal - user has free trial");
        setIsOpen(true);
      } else {
        console.log("[FreeTrialModal] Free trial already used or expired");
      }
    }
  }, [freeTrialStatus, isLoading, error]);

  const handleClaimAndStart = async () => {
    try {
      console.log("[FreeTrialModal] Claiming free trial...");
      const result = await claimFreeTrial.mutateAsync();
      console.log("[FreeTrialModal] Free trial claimed:", result);
      setIsOpen(false);
      // Redirect to try-on page
      setLocation("/try-on");
    } catch (error) {
      console.error("[FreeTrialModal] Failed to claim free trial:", error);
    }
  };

  const handleLater = () => {
    console.log("[FreeTrialModal] User clicked Maybe Later");
    setIsOpen(false);
  };

  // Don't render if still loading or no data
  if (isLoading) {
    return null;
  }

  if (!freeTrialStatus) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <DialogTitle>Welcome to StyleSwap!</DialogTitle>
          </div>
          <DialogDescription>
            Get your first virtual try-on absolutely free
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Feature highlights */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Photorealistic Try-Ons</p>
                <p className="text-xs text-muted-foreground">See exactly how clothes fit on you in seconds</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Lightning Fast</p>
                <p className="text-xs text-muted-foreground">Get results in under 15 seconds</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">No Credit Card Needed</p>
                <p className="text-xs text-muted-foreground">Try completely free, no strings attached</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-sm font-semibold text-primary mb-2">Expires in 7 days</p>
            <p className="text-xs text-muted-foreground">Use your free try-on within the next week</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleLater}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleClaimAndStart}
            disabled={claimFreeTrial.isPending}
            className="flex-1 gap-2"
          >
            {claimFreeTrial.isPending ? "Claiming..." : "Try Free Now"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
