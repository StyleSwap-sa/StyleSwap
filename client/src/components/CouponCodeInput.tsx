import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";
import { Ticket, Check, AlertCircle, Loader2 } from "lucide-react";

interface CouponCodeInputProps {
  onCouponApplied?: (creditsAdded: number) => void;
}

export function CouponCodeInput({ onCouponApplied }: CouponCodeInputProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  // Validate coupon mutation
  const validateMutation = trpc.promotional.validateCoupon.useQuery(
    { code: code.toUpperCase() },
    {
      enabled: false,
      retry: false,
    }
  );

  // Apply coupon mutation
  const applyMutation = trpc.promotional.applyCoupon.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
          variant: "default",
        });
        setCode("");
        onCouponApplied?.(result.creditsAdded);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to apply coupon code",
        variant: "destructive",
      });
    },
  });

  const handleApplyCoupon = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    try {
      // First validate the coupon
      const validation = await validateMutation.refetch();
      
      if (validation.data?.isValid) {
        // If valid, apply it
        applyMutation.mutate({ code: code.toUpperCase() });
      } else {
        toast({
          title: "Invalid Coupon",
          description: validation.data?.message || "This coupon code is not valid",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate coupon code",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const isLoading = isValidating || applyMutation.isPending;

  return (
    <Card className="premium-card border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          Apply Coupon Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Have a promotional code? Enter it below to receive bonus credits.
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="Enter your coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isLoading}
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleApplyCoupon();
              }
            }}
          />
          <Button
            onClick={handleApplyCoupon}
            disabled={isLoading || !code.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Apply
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-background/50 border border-border/40 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            Have a code from one of our creators? Enter it above — each code can only be used once per account.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}