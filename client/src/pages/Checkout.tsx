import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);

  const createCheckoutMutation = trpc.payment.createCheckout.useMutation({
    onSuccess: (data) => {
      // Redirect to Yoko payment page
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Failed to get payment URL");
        setLocation("/dashboard?tab=overview");
      }
    },
    onError: (error) => {
      console.error("[Checkout] Error:", error);
      toast.error(error.message || "Failed to create checkout session");
      setIsProcessing(false);
      setTimeout(() => setLocation("/dashboard?tab=overview"), 2000);
    },
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    const packageId = params.get("package");
    const successUrl = `${window.location.origin}/dashboard?tab=overview&payment=success`;
    const cancelUrl = `${window.location.origin}/dashboard?tab=overview&payment=cancelled`;

    if (!packageId) {
      toast.error("Invalid checkout session");
      setLocation("/dashboard?tab=overview");
      return;
    }

    // Create checkout session
    createCheckoutMutation.mutate({
      packageId,
      successUrl,
      cancelUrl,
    });
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="premium-card rounded-2xl max-w-md w-full mx-4">
        <CardContent className="pt-8 text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-bold">Processing Payment</h2>
          <p className="text-muted-foreground">
            {isProcessing
              ? "Redirecting to payment gateway..."
              : "Payment session created. Redirecting..."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
