import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingDown } from "lucide-react";

interface QuotaDisplayProps {
  remaining: number;
  limit: number;
  resetDate: string;
  isWarning?: boolean;
}

export function QuotaDisplay({
  remaining,
  limit,
  resetDate,
  isWarning = false,
}: QuotaDisplayProps) {
  const percentage = (remaining / limit) * 100;
  const isLow = percentage < 20;
  const isExhausted = remaining === 0;

  const resetDateObj = new Date(resetDate + "T00:00:00Z");
  const formattedResetDate = resetDateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className={`${isExhausted ? "border-red-500 bg-red-50" : isLow ? "border-yellow-500 bg-yellow-50" : "border-green-500 bg-green-50"}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingDown className="w-5 h-5" />
          Monthly Try-On Quota
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${isExhausted ? "text-red-600" : isLow ? "text-yellow-600" : "text-green-600"}`}>
                {remaining}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Total Limit</p>
              <p className="text-2xl font-bold text-foreground">{limit}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  isExhausted
                    ? "bg-red-500"
                    : isLow
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {percentage.toFixed(0)}% used
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Resets on:</strong> {formattedResetDate}
            </p>
          </div>

          {isExhausted && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Quota Exhausted</p>
                <p className="text-xs text-red-700 mt-1">
                  You've reached your monthly try-on limit. Upgrade your plan to get more try-ons.
                </p>
              </div>
            </div>
          )}

          {isLow && !isExhausted && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Running Low</p>
                <p className="text-xs text-yellow-700 mt-1">
                  You're approaching your monthly limit. Consider upgrading your plan.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
