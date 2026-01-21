import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface YocoPaymentFormProps {
  amount: number; // Amount in cents (e.g., 38500 for R385.00)
  currency: string; // e.g., 'ZAR'
  description: string;
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
  isProcessing?: boolean;
  boutiqueId?: number;
  credits?: number;
}

export function YocoPaymentForm({
  amount,
  currency,
  description,
  onSuccess,
  onError,
  isProcessing = false,
  boutiqueId,
  credits,
}: YocoPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // Create checkout session mutation
  const createCheckoutMutation = trpc.boutiques.createPaymentCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
      } else {
        setError('Failed to create payment session');
      }
      setIsLoading(false);
    },
    onError: (error) => {
      setError(error.message || 'Failed to create payment session');
      setIsLoading(false);
    },
  });

  const handleCreateCheckout = async () => {
    if (!boutiqueId || !credits) {
      setError('Missing payment information');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createCheckoutMutation.mutateAsync({
        boutiqueId,
        credits,
        amount,
        currency,
        description,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment setup failed');
      setIsLoading(false);
    }
  };

  const handleOpenCheckout = () => {
    if (checkoutUrl) {
      // Open checkout in new window
      window.open(checkoutUrl, '_blank', 'width=800,height=600');
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <span className="text-red-700 text-sm">{error}</span>
      </div>
    );
  }

  if (checkoutUrl) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Amount: <span className="font-semibold">R{(amount / 100).toFixed(2)}</span>
          </p>
        </div>

        <Button
          onClick={handleOpenCheckout}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Complete Payment
              <ExternalLink className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          You will be redirected to Yoco to complete your payment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Amount: <span className="font-semibold">R{(amount / 100).toFixed(2)}</span>
        </p>
      </div>

      <Button
        onClick={handleCreateCheckout}
        disabled={isProcessing || isLoading}
        className="w-full"
      >
        {isProcessing || isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Setting up Payment...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </div>
  );
}
