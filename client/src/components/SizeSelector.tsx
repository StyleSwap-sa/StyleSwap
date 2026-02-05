import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

const SIZE_DESCRIPTIONS: Record<string, string> = {
  XS: "Extra Small (15% smaller)",
  S: "Small (8% smaller)",
  M: "Medium (baseline)",
  L: "Large (8% larger)",
  XL: "Extra Large (15% larger)",
  XXL: "2X Large (22% larger)",
  XXXL: "3X Large (25% larger)",
};

interface SizeSelectorProps {
  selectedSize: string;
  onSizeChange: (size: string) => void;
  disabled?: boolean;
  showDisclaimer?: boolean;
}

export function SizeSelector({
  selectedSize,
  onSizeChange,
  disabled = false,
  showDisclaimer = true,
}: SizeSelectorProps) {
  const [hoveredSize, setHoveredSize] = useState<string | null>(null);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Select Size</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Size Grid */}
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 md:gap-3">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              disabled={disabled}
              onMouseEnter={() => setHoveredSize(size)}
              onMouseLeave={() => setHoveredSize(null)}
              className={`
                relative py-3 px-2 sm:px-3 rounded-lg font-bold text-sm sm:text-base
                transition-all duration-200 border-2
                ${
                  selectedSize === size
                    ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105"
                    : hoveredSize === size
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/30"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Size Description */}
        {selectedSize && (
          <div className="mt-4 p-3 bg-secondary/10 rounded-lg border border-secondary/30">
            <p className="text-sm text-foreground font-medium">
              {SIZE_DESCRIPTIONS[selectedSize]}
            </p>
          </div>
        )}

        {/* Disclaimers */}
        {showDisclaimer && (
          <div className="space-y-3">
            {/* Fit Accuracy Disclaimer */}
            <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Fit preview is a visual guide</strong> and may vary from real-life fit. Actual fit depends on fabric, cut, and personal body shape.
              </p>
            </div>

            {/* AI Disorientation Disclaimer */}
            <div className="flex gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-900 dark:text-orange-100">
                <strong>AI-generated preview:</strong> The virtual try-on is created by artificial intelligence and may appear disoriented, distorted, or unrealistic in some cases. This is a limitation of current AI technology and does not reflect the actual product quality.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
