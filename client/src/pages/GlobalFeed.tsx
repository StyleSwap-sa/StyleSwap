import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share2, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { GlobalRecommendations } from "@/components/GlobalRecommendations";
import { PopularBrands } from "@/components/PopularBrands";
import { StyleCategories } from "@/components/StyleCategories";
import { TopInfluencers } from "@/components/TopInfluencers";
import { CommentModal } from "@/components/CommentModal";
import { useLocation } from "wouter";

interface Outfit {
  id: number;
  title: string;
  description: string | null;
  watermarkedImageUrl: string;
  userId: number;
  userName: string;
  userAvatar: string | null;
  userCountry: string | null;
  style: string | null;
  brand: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isFollowing: boolean;
}

export default function GlobalFeed() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<"latest" | "trending" | "mostLiked" | "mostCommented">("latest");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [activeTab, setActiveTab] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [likedOutfits, setLikedOutfits] = useState<Set<number>>(new Set());
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);



  // Fetch global feed
  const { data: feedData, isLoading: feedLoading } = trpc.globalFeed.getGlobalFeed.useQuery({
    limit: 20,
    offset: 0,
    sortBy: sortBy,
    styleCategory: selectedCategory,
    country: selectedCountry,
    searchQuery: searchQuery || undefined,
  });

  // Fetch global trending
  const { data: trendingData, isLoading: trendingLoading } = trpc.globalFeed.getGlobalTrending.useQuery({
    limit: 10,
    offset: 0,
    timeRange: timeRange,
    styleCategory: selectedCategory,
    country: selectedCountry,
  });

  // Like mutation
  // Update the likeMutation to include optimistic update
const likeMutation = trpc.globalFeed.likeOutfit.useMutation({
  onMutate: async ({ outfitId }) => {
    // Cancel outgoing refetches
    await utils.globalFeed.getGlobalFeed.cancel();
    
    // Snapshot previous value
    const previousData = utils.globalFeed.getGlobalFeed.getData();
    
    // Optimistically update the like count
    utils.globalFeed.getGlobalFeed.setData(
      { limit: 20, offset: 0, sortBy, styleCategory: selectedCategory, country: selectedCountry, searchQuery: searchQuery || undefined },
      (old: any) => {
        if (!old) return old;
        return {
          ...old,
          outfits: old.outfits.map((outfit) =>
            outfit.id === outfitId
              ? {
                  ...outfit,
                  likeCount: outfit.isLiked 
                    ? Number(outfit.likeCount) - 1 
                    : Number(outfit.likeCount) + 1,
                  isLiked: !outfit.isLiked,
                }
              : outfit
          ),
        };
      }
    );
    
    return { previousData };
  },
  onError: (err, input, context) => {
    // Rollback on error
    if (context?.previousData) {
      utils.globalFeed.getGlobalFeed.setData(
        { limit: 20, offset: 0, sortBy, styleCategory: selectedCategory, country: selectedCountry, searchQuery: searchQuery || undefined },
        context.previousData
      );
    }
  },
  onSuccess: (data, input) => {
    if (data.success) {
      if (data.liked) {
        setLikedOutfits((prev) => new Set([...prev, input.outfitId]));
      } else {
        setLikedOutfits((prev) => {
          const newSet = new Set(prev);
          newSet.delete(input.outfitId);
          return newSet;
        });
      }
    }
  },
});

  // Share mutation
  const shareMutation = trpc.globalFeed.shareOutfit.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        navigator.clipboard.writeText(data.shareUrl);
        alert(`Share link copied! Platform: ${data.platform}`);
      }
    },
  });

  const handleLike = (outfitId: number) => {
    if (!user) {
      alert("Please login to like outfits");
      return;
    }
    likeMutation.mutate({ outfitId });
  };

  const handleShare = (outfitId: number, platform: "whatsapp" | "instagram" | "tiktok" | "twitter") => {
    if (!user) {
      alert("Please login to share outfits");
      return;
    }
    shareMutation.mutate({ outfitId, platform });
  };
  const followMutation = trpc.globalFeed.toggleFollow.useMutation({
  onSuccess: () => {
    // Refetch feed to update isFollowing status
    refetch();
  },
});

const handleFollow = (userId: number) => {
  if (!user) {
    toast({ title: "Please login to follow users", variant: "destructive" });
    return;
  }
  followMutation.mutate({ userId });
};

  const OutfitCard = ({ outfit }: { outfit: Outfit }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative group">
        <img
          src={outfit.watermarkedImageUrl}
          alt={outfit.title}
          className="w-full h-96 object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleLike(outfit.id)}
            className={likedOutfits.has(outfit.id) ? "bg-red-500 text-white" : ""}
          >
            <Heart className="w-4 h-4" fill={likedOutfits.has(outfit.id) ? "currentColor" : "none"} />
          </Button>
          <button
            onClick={() => {
              setSelectedOutfitId(outfit.id);
              setIsCommentModalOpen(true);
            }}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {outfit.commentCount}
          </button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleShare(outfit.id, "whatsapp")}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
        {/* Make the user info clickable */}
        <div 
          className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setLocation(`/profile/${outfit.userId}`)}
        >
          {outfit.userAvatar ? (
            <img
              src={outfit.userAvatar}
              alt={outfit.userName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-sm">{outfit.userName?.[0] || "U"}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{outfit.userName}</h3>
            <p className="text-xs text-muted-foreground">
              {outfit.userCountry && `${outfit.userCountry} • `}
              {new Date(outfit.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {/* Follow button stays separate */}
        {user && user.id !== outfit.userId && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleFollow(outfit.userId)}
          >
            {outfit.isFollowing ? "Following" : "Follow"}
          </Button>
        )}
      </div>

        <h2 className="font-bold text-lg mb-1">{outfit.title}</h2>
        {outfit.description && (
          <p className="text-sm text-muted-foreground mb-2">{outfit.description}</p>
        )}
        {outfit.style && (
          <p className="text-xs text-primary font-semibold mb-3">#{outfit.style}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <button
            onClick={() => handleLike(outfit.id)}
            className={`flex items-center gap-1 hover:text-primary transition-colors ${
              likedOutfits.has(outfit.id) ? "text-red-500" : ""
            }`}
          >
            <Heart className="w-4 h-4" fill={likedOutfits.has(outfit.id) ? "currentColor" : "none"} />
            {Number(outfit.likeCount)}
          </button>
          <button
            onClick={() => {
              setSelectedOutfitId(outfit.id);
              setIsCommentModalOpen(true);
            }}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {outfit.commentCount}
          </button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-lg">
        <p className="text-muted-foreground">Discover inspiring outfits from stylists around the world</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search outfits, brands, styles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="latest">Latest</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>

            {/* Latest Tab */}
            <TabsContent value="latest" className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant={sortBy === "latest" ? "default" : "outline"}
                  onClick={() => setSortBy("latest")}
                >
                  Latest
                </Button>
                <Button 
                  variant={sortBy === "mostLiked" ? "default" : "outline"}
                  onClick={() => setSortBy("mostLiked")}
                >
                  Most Liked
                </Button>
                <Button 
                  variant={sortBy === "mostCommented" ? "default" : "outline"}
                  onClick={() => setSortBy("mostCommented")}
                >
                  Most Commented
                </Button>
              </div>

              {feedLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedData?.outfits.map((outfit) => (
                    <OutfitCard key={outfit.id} outfit={outfit} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Trending Tab */}
            <TabsContent value="trending" className="space-y-4">
              <div className="flex gap-2">
                {(["24h", "7d", "30d"] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    onClick={() => setTimeRange(range)}
                  >
                    {range === "24h" ? "Today" : range === "7d" ? "This Week" : "This Month"}
                  </Button>
                ))}
              </div>

              {trendingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trendingData?.outfits.map((outfit) => (
                    <OutfitCard key={outfit.id} outfit={outfit} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlobalRecommendations limit={6} />
          <PopularBrands timeRange={timeRange} />
          <StyleCategories onCategorySelect={setSelectedCategory} />
          <TopInfluencers limit={5} />
        </div>
      </div>

      <CommentModal
      isOpen={isCommentModalOpen}
      onClose={() => {
        setIsCommentModalOpen(false);
        setSelectedOutfitId(null);
      }}
      outfitId={selectedOutfitId || 0}
      onCommentAdded={() => {
        // Refetch feed to update comment count
        feedData?.refetch();
      }}
    />

    </div>
  );
}