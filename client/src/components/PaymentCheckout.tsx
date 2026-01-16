import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Check, AlertCircle } from "lucide-react";

interface PaymentCheckoutProps {
  packageId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentCheckout({
  packageId,
  onSuccess,
  onCancel,
}: PaymentCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const { data: packages } = trpc.payment.getPackages.useQuery();
  const createCheckoutMutation = trpc.payment.createCheckout.useMutation();
  const confirmPaymentMutation = trpc.payment.confirmPayment.useMutation();

  const selectedPackage = packages?.find((p) => p.id === packageId);

  const handleCheckout = async () => {
    if (!selectedPackage) {
      toast.error("Package not found");
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Create payment intent
      const checkout = await createCheckoutMutation.mutateAsync({
        packageId,
        successUrl: `${window.location.origin}/dashboard?tab=overview&payment=success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      // In a real implementation, you would redirect to Yoko's payment page
      // For now, we'll simulate a successful payment after a short delay
      toast.info("Processing payment...", { duration: 2000 });

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Confirm payment
      await confirmPaymentMutation.mutateAsync({
        paymentIntentId: checkout.id,
        packageId,
        credits: selectedPackage.credits,
      });

      setPaymentStatus("success");
      toast.success(
        `Successfully purchased ${selectedPackage.credits} try-on credits!`
      );

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      setPaymentStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Payment failed";
      toast.error(errorMessage);
      console.error("[Payment] Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedPackage) {
    return (
      <Card className="premium-card rounded-2xl">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Package not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="premium-card rounded-2xl max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Confirm Purchase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Package Details */}
        <div className="space-y-3 p-4 bg-foreground/5 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Package</span>
            <span className="font-bold">{selectedPackage.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Credits</span>
            <span className="font-bold text-primary">{selectedPackage.credits}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valid for</span>
            <span className="font-bold">30 days</span>
          </div>
          <div className="border-t border-border/20 pt-3 flex justify-between items-center">
            <span className="font-bold">Total Price</span>
            <span className="text-2xl font-bold text-primary">
              R{(selectedPackage.price / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Status Messages */}
        {paymentStatus === "success" && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-bold text-green-900">Payment Successful!</p>
              <p className="text-sm text-green-800">
                Your credits have been added to your account.
              </p>
            </div>
          </div>
        )}

        {paymentStatus === "error" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-bold text-red-900">Payment Failed</p>
              <p className="text-sm text-red-800">
                Please try again or contact support.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleCheckout}
            disabled={isProcessing || paymentStatus === "success"}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isProcessing ? "Processing..." : "Complete Purchase"}
          </Button>
          <Button
            onClick={onCancel}
            disabled={isProcessing}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </div>

        {/* Security Notice */}
        <p className="text-xs text-muted-foreground text-center">
          Your payment is processed securely through Yoko. We never store your
          card details.
        </p>
      </CardContent>
    </Card>
  );
}
