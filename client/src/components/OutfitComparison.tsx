import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ChevronLeft } from "lucide-react";

interface SavedOutfit {
  id: number;
  title: string;
  watermarkedImageUrl: string;
  createdAt: string;
}

interface OutfitComparisonProps {
  outfits: SavedOutfit[];
  onClose: () => void;
}

export function OutfitComparison({ outfits, onClose }: OutfitComparisonProps) {
  const [selectedOutfits, setSelectedOutfits] = useState<number[]>([]);
  const [comparisonView, setComparisonView] = useState<"select" | "compare">(
    "select"
  );

  const handleSelectOutfit = (outfitId: number) => {
    if (selectedOutfits.includes(outfitId)) {
      setSelectedOutfits(selectedOutfits.filter((id) => id !== outfitId));
    } else if (selectedOutfits.length < 3) {
      setSelectedOutfits([...selectedOutfits, outfitId]);
    }
  };

  const handleStartComparison = () => {
    if (selectedOutfits.length > 0) {
      setComparisonView("compare");
    }
  };

  const comparisonOutfits = outfits.filter((o) =>
    selectedOutfits.includes(o.id)
  );

  if (comparisonView === "compare") {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Outfit Comparison</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setComparisonView("select")}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Selection
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comparisonOutfits.map((outfit) => (
                <div key={outfit.id} className="space-y-3">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={outfit.watermarkedImageUrl}
                      alt={outfit.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{outfit.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(outfit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-secondary/10 rounded-lg">
              <h3 className="font-semibold mb-4">Comparison Notes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use this view to compare up to 3 outfits side-by-side. Consider
                factors like:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                <li>• Overall fit and silhouette</li>
                <li>• Color coordination and styling</li>
                <li>• Occasion appropriateness</li>
                <li>• Personal preference and comfort</li>
              </ul>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setComparisonView("select");
                  setSelectedOutfits([]);
                }}
              >
                Start Over
              </Button>
              <Button onClick={onClose}>Close Comparison</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Select Outfits to Compare</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Select up to 3 outfits to compare side-by-side. This helps you
            decide which look works best before making a purchase.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outfits.map((outfit) => (
              <div
                key={outfit.id}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedOutfits.includes(outfit.id)
                    ? "border-primary ring-2 ring-primary/50"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleSelectOutfit(outfit.id)}
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  <img
                    src={outfit.watermarkedImageUrl}
                    alt={outfit.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-1">
                    {outfit.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(outfit.createdAt).toLocaleDateString()}
                  </p>
                  {selectedOutfits.includes(outfit.id) && (
                    <div className="mt-2 text-xs font-semibold text-primary">
                      #{selectedOutfits.indexOf(outfit.id) + 1}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleStartComparison}
              disabled={selectedOutfits.length === 0}
            >
              Compare ({selectedOutfits.length}/3)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
