import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SizeRecommendationWidgetProps {
  bodyMeasurements?: {
    height?: number;
    chest?: number;
    waist?: number;
    hips?: number;
  };
  onTryOn?: () => void;
}

export function SizeRecommendationWidget({
  bodyMeasurements,
  onTryOn,
}: SizeRecommendationWidgetProps) {
  const { data: recommendation, isLoading } = trpc.recommendation.getSizeRecommendation.useQuery(
    bodyMeasurements || {},
    { enabled: !!bodyMeasurements }
  );

  if (!bodyMeasurements) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Size Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload a body photo in the virtual try-on to get personalized size recommendations.
          </p>
          <Button onClick={onTryOn} className="mt-4 w-full">
            Start Virtual Try-On
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-spin" />
            Analyzing Your Size...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return null;
  }

  const sizeRanges = {
    tight: { label: "Tight Fit", sizes: "24-26", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
    perfect: { label: "Perfect Fit", sizes: "28-34", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20" },
    loose: { label: "Relaxed Fit", sizes: "36-50", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/20" },
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Your Size Recommendation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Recommendation */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recommended Size</p>
              <p className="text-3xl font-bold text-primary">{recommendation.recommendedSize}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className="text-2xl font-bold text-green-600">{recommendation.confidence}%</p>
            </div>
          </div>
        </div>

        {/* Size Ranges */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Size Categories</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(sizeRanges).map(([key, range]) => (
              <div
                key={key}
                className={`p-3 rounded-lg border ${range.bg} text-center`}
              >
                <p className={`text-xs font-semibold ${range.color}`}>{range.label}</p>
                <p className="text-sm font-bold mt-1">{range.sizes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alternative Sizes */}
        {recommendation.alternativeSizes && recommendation.alternativeSizes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Alternative Sizes</p>
            <div className="flex gap-2 flex-wrap">
              {recommendation.alternativeSizes.map((size) => (
                <span
                  key={size}
                  className="px-3 py-1 bg-muted rounded-full text-sm font-medium"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Personalized Feedback */}
        {recommendation.feedback && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900 dark:text-blue-100">{recommendation.feedback}</p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <Button onClick={onTryOn} className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          Try Different Sizes
        </Button>
      </CardContent>
    </Card>
  );
}
