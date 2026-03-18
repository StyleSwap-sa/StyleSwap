import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AffiliateDisclaimer() {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <AlertCircle className="h-5 w-5" />
          Important Legal Notice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm text-amber-900 dark:text-amber-100">
          <p className="font-semibold">
            StyleSwap Commission Policy
          </p>
          <p>
            <strong>StyleSwap will receive 7.5% commission for purchases originating from the StyleSwap platform.</strong>
          </p>
          <div className="space-y-2 border-t border-amber-200 pt-4 dark:border-amber-900">
            <p>
              This commission is earned when:
            </p>
            <ul className="list-inside space-y-1 pl-2">
              <li>• A customer uses StyleSwap's virtual try-on feature</li>
              <li>• The customer purchases clothing through an affiliate tracking link</li>
              <li>• The boutique/retailer is on a premium tier (Retailer Pro, Enterprise Retail, or Enterprise Retail Pro)</li>
            </ul>
          </div>
          <p className="text-xs italic">
            By using StyleSwap's affiliate tracking links, you acknowledge and agree to this commission structure.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
