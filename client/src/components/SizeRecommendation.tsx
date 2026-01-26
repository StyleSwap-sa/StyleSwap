import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";
import { trpc } from "@/lib/trpc";

export interface SizeRecommendationProps {
  shoulderWidth?: number;
  chestWidth?: number;
  waistWidth?: number;
  hipWidth?: number;
  height?: number;
  clothingType?: "upper" | "lower" | "combo";
  onSizeSelect?: (size: number) => void;
  isLoading?: boolean;
}

export function SizeRecommendation({
  shoulderWidth,
  chestWidth,
  waistWidth,
  hipWidth,
  height,
  clothingType = "combo",
  onSizeSelect,
  isLoading = false,
}: SizeRecommendationProps) {
  const [selectedSize, setSelectedSize] = useState<number | null>(null);

  // Get recommendation if measurements are provided
  const { data: recommendation, isLoading: isAnalyzing } =
    trpc.recommendation.getRecommendation.useQuery(
      {
        shoulderWidth: shoulderWidth || 0,
        chestWidth: chestWidth || 0,
        waistWidth: waistWidth || 0,
        hipWidth: hipWidth || 0,
        height,
        clothingType,
      },
      {
        enabled: !!(shoulderWidth && chestWidth && waistWidth && hipWidth),
      }
    );

  const handleSizeSelect = (size: number) => {
    setSelectedSize(size);
    onSizeSelect?.(size);
  };

  if (!recommendation || isLoading || isAnalyzing) {
    return null;
  }

  const confidenceColor =
    recommendation.confidence >= 80
      ? "bg-green-500"
      : recommendation.confidence >= 60
        ? "bg-yellow-500"
        : "bg-orange-500";

  const confidenceLabel =
    recommendation.confidence >= 80
      ? "High Confidence"
      : recommendation.confidence >= 60
        ? "Medium Confidence"
        : "Low Confidence";

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Size Recommendation</CardTitle>
          </div>
          <Badge className={`${confidenceColor} text-white`}>
            {confidenceLabel} ({recommendation.confidence}%)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Recommended Size Display */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">
              Recommended Size
            </p>
            <p className="text-3xl font-bold text-primary">
              Size {recommendation.recommendedSize}
            </p>
          </div>
          <CheckCircle2 className="h-12 w-12 text-green-500 flex-shrink-0" />
        </div>

        {/* Explanation */}
        <div className="bg-background rounded-lg p-3 border border-border/50">
          <p className="text-sm text-foreground">{recommendation.explanation}</p>
        </div>

        {/* Measurements Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-background rounded p-2">
            <p className="text-muted-foreground">Shoulder</p>
            <p className="font-semibold">
              {recommendation.measurements.shoulderWidth} cm
            </p>
          </div>
          <div className="bg-background rounded p-2">
            <p className="text-muted-foreground">Chest</p>
            <p className="font-semibold">
              {recommendation.measurements.chestWidth} cm
            </p>
          </div>
          <div className="bg-background rounded p-2">
            <p className="text-muted-foreground">Waist</p>
            <p className="font-semibold">
              {recommendation.measurements.waistWidth} cm
            </p>
          </div>
          <div className="bg-background rounded p-2">
            <p className="text-muted-foreground">Hip</p>
            <p className="font-semibold">
              {recommendation.measurements.hipWidth} cm
            </p>
          </div>
        </div>

        {/* Alternative Sizes */}
        {recommendation.alternativeSizes &&
          recommendation.alternativeSizes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Alternative Sizes
              </p>
              <div className="flex gap-2">
                {recommendation.alternativeSizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSizeSelect(size)}
                    className="flex-1"
                  >
                    Size {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

        {/* Primary Action Button */}
        <Button
          onClick={() => handleSizeSelect(recommendation.recommendedSize)}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          Try Size {recommendation.recommendedSize}
        </Button>

        {/* Info Message */}
        {recommendation.confidence < 70 && (
          <div className="flex gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-700">
              Low confidence in this recommendation. We recommend trying multiple
              sizes to find your perfect fit.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
