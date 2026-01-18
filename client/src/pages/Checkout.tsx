import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { isAuthenticated, user } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);

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
    },
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    const pkg = params.get("package");

    if (!pkg) {
      toast.error("Invalid checkout session");
      setLocation("/dashboard?tab=overview");
      return;
    }

    setPackageId(pkg);
  }, [isAuthenticated]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Checkout] Form submitted with phone:', phoneNumber);

    // Validate phone number
    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }

    // Basic phone validation (South African format)
    const phoneRegex = /^(\+27|0)[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      setError("Please enter a valid South African phone number");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const successUrl = `${window.location.origin}/dashboard?tab=overview&payment=success`;
      const cancelUrl = `${window.location.origin}/dashboard?tab=overview&payment=cancelled`;

      console.log('[Checkout] Creating checkout with packageId:', packageId);

      // Create checkout session with phone number
      createCheckoutMutation.mutate({
        packageId: packageId!,
        successUrl,
        cancelUrl,
        phoneNumber: phoneNumber.replace(/\s/g, ""),
      });
    } catch (err) {
      console.error('[Checkout] Error:', err);
      setError("Failed to process checkout");
      setIsProcessing(false);
    }
  };

  const handleContinueClick = () => {
    console.log('[Checkout] Continue button clicked');
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Confirm Your Phone Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                type="tel"
                placeholder="+27 123 456 789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isProcessing}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                We'll send your payment confirmation via SMS
              </p>
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <Button
              type="submit"
              disabled={isProcessing || !phoneNumber}
              onClick={handleContinueClick}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue to Payment"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isProcessing}
              onClick={() => setLocation("/dashboard?tab=overview")}
              className="w-full"
            >
              Cancel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
