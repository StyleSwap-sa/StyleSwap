import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Heart, Share2, Download, Loader2, Columns3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { OutfitComparison } from "@/components/OutfitComparison";
import { OutfitTagging } from "@/components/OutfitTagging";

interface SavedOutfit {
  id: number;
  title: string;
  watermarkedImageUrl: string;
  createdAt: string;
  isFavorite: number;
  shareCount: number;
  tags?: string;
}

export default function MyCloset() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<SavedOutfit | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Fetch saved outfits
  const { data: closetData, isLoading: isFetching } = trpc.closet.getClosetOutfits.useQuery(
    { limit: 50, offset: 0 },
    { enabled: !!user }
  );

  // Delete outfit mutation
  const deleteOutfitMutation = trpc.closet.deleteFromCloset.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Outfit deleted from closet",
        variant: "default",
      });
      if (closetData) {
        setOutfits(outfits.filter(o => o.id !== selectedOutfit?.id));
      }
      setSelectedOutfit(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete outfit",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (closetData?.outfits) {
      setOutfits(closetData.outfits);
      setIsLoading(false);
    }
  }, [closetData]);

  const handleDelete = (outfitId: number) => {
    if (confirm("Are you sure you want to delete this outfit from your closet?")) {
      deleteOutfitMutation.mutate({ outfitId });
    }
  };

  const handleDownload = (imageUrl: string, title: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${title}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Downloaded",
      description: "Image saved to your device",
    });
  };

  const handleCompare = () => {
    setShowComparison(true);
  };

  const filteredOutfits = filterTag
    ? outfits.filter((outfit) => {
        try {
          const tags = JSON.parse(outfit.tags || "[]");
          return tags.includes(filterTag);
        } catch {
          return false;
        }
      })
    : outfits;

  const allTags = Array.from(
    new Set(
      outfits.flatMap((outfit) => {
        try {
          return JSON.parse(outfit.tags || "[]");
        } catch {
          return [];
        }
      })
    )
  );

  const handleShare = (outfit: SavedOutfit) => {
    const shareText = `Check out my virtual try-on from StyleSwap: ${outfit.title}`;
    const shareUrl = outfit.watermarkedImageUrl;

    const shareOptions = [
      {
        name: "WhatsApp",
        url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
      },
      {
        name: "Instagram",
        url: `https://www.instagram.com/`,
      },
      {
        name: "TikTok",
        url: `https://www.tiktok.com/`,
      },
    ];

    const selected = shareOptions[0];
    if (selected) {
      window.open(selected.url, "_blank");
      toast({
        title: "Shared",
        description: `Opening ${selected.name}...`,
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p>Please log in to view your closet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">My Closet</h1>
          <p className="text-muted-foreground mt-2">
            Manage and compare your saved virtual try-ons
          </p>
        </div>

        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : outfits.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center pb-12">
              <p className="text-muted-foreground mb-4">
                You haven't saved any outfits yet
              </p>
              <p className="text-sm text-muted-foreground">
                Try on an outfit and save it to your closet to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Tag Filter */}
            {allTags.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={filterTag === null ? "default" : "outline"}
                      onClick={() => setFilterTag(null)}
                    >
                      All Outfits ({outfits.length})
                    </Button>
                    {allTags.map((tag) => {
                      const count = outfits.filter((o) => {
                        try {
                          return JSON.parse(o.tags || "[]").includes(tag);
                        } catch {
                          return false;
                        }
                      }).length;
                      return (
                        <Button
                          key={tag}
                          size="sm"
                          variant={filterTag === tag ? "default" : "outline"}
                          onClick={() => setFilterTag(tag)}
                        >
                          {tag} ({count})
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Outfits Grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredOutfits.map((outfit) => (
                    <Card
                      key={outfit.id}
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedOutfit(outfit)}
                    >
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <img
                          src={outfit.watermarkedImageUrl}
                          alt={outfit.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <CardContent className="pt-4">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {outfit.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(outfit.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(outfit);
                            }}
                          >
                            <Share2 className="w-4 h-4 mr-1" />
                            Share
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(outfit.id);
                            }}
                            disabled={deleteOutfitMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Detail Panel */}
              {selectedOutfit && (
                <div className="lg:col-span-1">
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle className="text-lg">{selectedOutfit.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Large Image Preview */}
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={selectedOutfit.watermarkedImageUrl}
                          alt={selectedOutfit.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Saved</p>
                          <p className="font-medium">
                            {new Date(selectedOutfit.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Shares</p>
                          <p className="font-medium">{selectedOutfit.shareCount}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-4 border-t">
                        <Button
                          className="w-full"
                          onClick={() => handleShare(selectedOutfit)}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share on Social
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleCompare}
                        >
                          <Columns3 className="w-4 h-4 mr-2" />
                          Compare Outfits
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            handleDownload(
                              selectedOutfit.watermarkedImageUrl,
                              selectedOutfit.title
                            )
                          }
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleDelete(selectedOutfit.id)}
                          disabled={deleteOutfitMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>

                      {/* Tags Section */}
                      <div className="pt-4 border-t">
                        <OutfitTagging
                          currentTags={selectedTags}
                          onTagsChange={setSelectedTags}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison Modal */}
        {showComparison && (
          <OutfitComparison
            outfits={filteredOutfits}
            onClose={() => setShowComparison(false)}
          />
        )}
      </div>
    </div>
  );
}
