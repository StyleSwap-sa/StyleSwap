import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  modelImage: string;
  clothImage: string;
  modelDimensions?: { width: number; height: number };
  clothDimensions?: { width: number; height: number };
  clothType: "upper" | "lower" | "combo" | "full";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ImagePreviewModal({
  isOpen,
  modelImage,
  clothImage,
  modelDimensions,
  clothDimensions,
  clothType,
  onConfirm,
  onCancel,
  isLoading = false,
}: ImagePreviewModalProps) {
  const getQualityIndicator = (width?: number, height?: number) => {
    if (!width || !height) return null;

    const isOptimal = width >= 1024 && height >= 1024;
    const isAcceptable = width >= 512 && height >= 512;

    if (isOptimal) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Optimal quality</span>
        </div>
      );
    } else if (isAcceptable) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <Info className="w-4 h-4" />
          <span className="text-sm font-medium">Acceptable quality</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Low quality - may affect results</span>
        </div>
      );
    }
  };

  const getClothTypeLabel = () => {
    const labels = {
      upper: "Top/Shirt",
      lower: "Bottom/Pants",
      combo: "Top & Bottom",
      full: "Full Dress",
    };
    return labels[clothType] || clothType;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review Your Images</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Model Image Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Body Photo</h3>
              {getQualityIndicator(modelDimensions?.width, modelDimensions?.height)}
            </div>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={modelImage}
                alt="Model preview"
                className="w-full h-auto max-h-80 object-contain"
              />
            </div>
            {modelDimensions && (
              <p className="text-sm text-gray-600">
                Dimensions: {modelDimensions.width} × {modelDimensions.height}px
              </p>
            )}
          </div>

          {/* Clothing Image Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Clothing Image ({getClothTypeLabel()})</h3>
              {getQualityIndicator(clothDimensions?.width, clothDimensions?.height)}
            </div>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={clothImage}
                alt="Clothing preview"
                className="w-full h-auto max-h-80 object-contain"
              />
            </div>
            {clothDimensions && (
              <p className="text-sm text-gray-600">
                Dimensions: {clothDimensions.width} × {clothDimensions.height}px
              </p>
            )}
          </div>

          {/* Quality Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Tips for Best Results:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Ensure good lighting and clear visibility of the clothing</li>
              <li>Body photo should show full body, standing straight</li>
              <li>Clothing should be on a plain or white background</li>
              <li>Images will be auto-optimized if they exceed recommended sizes</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Edit Images
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="bg-primary">
            {isLoading ? "Processing..." : "Proceed to Generation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
