import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Info } from "lucide-react";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

interface SizeSelectorProps {
  selectedSize: string;
  onSizeChange: (size: string) => void;
  disabled?: boolean;
  showDisclaimer?: boolean;
  isMandatory?: boolean;
}

export function SizeSelector({
  selectedSize,
  onSizeChange,
  disabled = false,
  showDisclaimer = true,
  isMandatory = true,
}: SizeSelectorProps) {
  const [hoveredSize, setHoveredSize] = useState<string | null>(null);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Select Size
          {isMandatory && <span className="text-red-500 text-sm font-normal">(Required)</span>}
        </CardTitle>
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

        {/* Legal Compliance Wording */}
        {showDisclaimer && (
          <div className="space-y-3 mt-6">
            {/* Main Legal Wording */}
            <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>StyleSwap uses AI to visually simulate clothing on your photo.</strong> Fit appearance may vary depending on brand, fabric, and cut. Always select the size you usually wear and use the try-on as a visual guide.
              </p>
            </div>

            {/* Fit Accuracy Disclaimer */}
            <div className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Visual guide only:</strong> This try-on is a visual simulation and may not represent the exact fit. Actual fit depends on fabric, cut, brand sizing, and your body shape.
              </p>
            </div>

            {/* AI Disorientation Disclaimer */}
            <div className="flex gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-900 dark:text-orange-100">
                <strong>AI-generated preview:</strong> The virtual try-on is created by artificial intelligence and may appear disoriented, distorted, or unrealistic in some cases. This is a limitation of current AI technology.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
