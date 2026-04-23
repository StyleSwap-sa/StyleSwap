import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, Heart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";


export function GlobalRecommendations({ limit = 6 }: { limit?: number }) {
  const { user } = useAuth();
  const [selectedOutfits, setSelectedOutfits] = useState<Set<number>>(new Set());

  const { data: recommendations, isLoading } = 
    trpc.globalRecommendations.getGlobalRecommendations.useQuery(
      { limit },
      { enabled: true } // Works for guests too
    );

  const likeOutfitMutation = trpc.globalFeed.likeOutfit.useMutation();

  const handleLike = async (outfitId: number) => {
    if (!user) {
      alert("Please login to like outfits");
      return;
    }
    await likeOutfitMutation.mutateAsync({ outfitId });
    setSelectedOutfits((prev) => {
      const newSet = new Set(prev);
      newSet.has(outfitId) ? newSet.delete(outfitId) : newSet.add(outfitId);
      return newSet;
    });
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Global Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations?.recommendations.map((outfit) => (
            <div
              key={outfit.id}
              className="group relative rounded-lg overflow-hidden bg-secondary/5 border border-border/20 hover:border-primary/50 transition-all"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={outfit.imageUrl}
                  alt={outfit.style}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm">{outfit.style}</h3>
                <p className="text-xs text-muted-foreground">{outfit.likeCount} likes</p>
                <Button
                  size="sm"
                  variant={selectedOutfits.has(outfit.id) ? "default" : "outline"}
                  className="w-full h-8 text-xs"
                  onClick={() => handleLike(outfit.id)}
                >
                  <Heart className="w-3 h-3 mr-1" />
                  Like
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}