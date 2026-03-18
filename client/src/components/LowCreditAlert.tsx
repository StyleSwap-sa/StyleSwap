import { AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LowCreditAlertProps {
  currentCredits: number;
  onBuyMore: () => void;
  threshold?: number;
}

export function LowCreditAlert({
  currentCredits,
  onBuyMore,
  threshold = 5,
}: LowCreditAlertProps) {
  // Only show if credits are below threshold
  if (currentCredits >= threshold) {
    return null;
  }

  return (
    <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800 dark:text-orange-200">
        Low Credits Warning
      </AlertTitle>
      <AlertDescription className="text-orange-700 dark:text-orange-300 mt-2">
        <p className="mb-3">
          You only have <strong>{currentCredits} credit{currentCredits !== 1 ? 's' : ''}</strong> remaining.
          {currentCredits === 0 && " You won't be able to create try-ons until you buy more credits."}
        </p>
        <Button
          onClick={onBuyMore}
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
        >
          <Zap className="w-4 h-4" />
          Buy More Credits Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
