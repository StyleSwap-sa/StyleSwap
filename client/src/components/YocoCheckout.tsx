import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

interface YocoCheckoutProps {
  amount: number; // Amount in cents (e.g., 38500 for R385.00)
  description: string;
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
  isProcessing?: boolean;
}

export function YocoCheckout({
  amount,
  description,
  onSuccess,
  onError,
  isProcessing = false,
}: YocoCheckoutProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if Yoco SDK is loaded
    if (typeof (window as any).Yoco !== "undefined") {
      setIsInitialized(true);
    } else {
      // Wait for Yoco SDK to load
      const checkYoco = setInterval(() => {
        if (typeof (window as any).Yoco !== "undefined") {
          setIsInitialized(true);
          clearInterval(checkYoco);
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkYoco);
        if (!isInitialized) {
          setError("Failed to load Yoco payment form. Please refresh the page.");
        }
      }, 5000);

      return () => clearInterval(checkYoco);
    }
  }, [isInitialized]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !phone) {
      setError("Please enter your email and phone number");
      return;
    }

    if (!isInitialized) {
      setError("Payment form is not ready. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const yoco = (window as any).Yoco;

      // Create a checkout
      const checkoutOptions = {
        publicKey: import.meta.env.VITE_YOCO_PUBLIC_KEY,
        amount: amount,
        currency: "ZAR",
        email: email,
        phone: phone,
        metadata: {
          description: description,
        },
      };

      // Open Yoco checkout
      yoco.showCheckout(checkoutOptions, (result: any) => {
        if (result.error) {
          setError(result.error.message || "Payment failed");
          onError(result.error.message || "Payment failed");
        } else {
          // Payment successful - token received
          onSuccess(result.id);
        }
        setIsLoading(false);
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Payment processing failed";
      setError(errorMsg);
      onError(errorMsg);
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-900">Loading payment form...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <Label htmlFor="email" className="text-sm font-medium">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={isProcessing || isLoading}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm font-medium">
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+27 123 456 7890"
          disabled={isProcessing || isLoading}
          required
          className="mt-1"
        />
      </div>

      <Button
        type="submit"
        disabled={isProcessing || isLoading || !isInitialized}
        className="w-full"
        size="lg"
      >
        {isLoading || isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay R${(amount / 100).toFixed(2)}`
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your payment information is securely processed by Yoco
      </p>
    </form>
  );
}
