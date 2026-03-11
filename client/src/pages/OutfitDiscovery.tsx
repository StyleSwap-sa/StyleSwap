import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Share2, Flag, Loader2, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CommentSection } from "@/components/CommentSection";
import { useState } from "react";

type SortOption = "recent" | "popular" | "trending";

export default function OutfitDiscovery() {
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);
  const [searchTag, setSearchTag] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");

  const { data: feedData, isLoading: feedLoading } = trpc.discovery.getFeed.useQuery(
    { page, limit: 12, sortBy }
  );

  const likeMutation = trpc.discovery.likeOutfit.useMutation({
    onSuccess: () => {
      // Refetch feed to update like count
      trpc.useUtils().discovery.getFeed.invalidate();
    },
  });

  const reportMutation = trpc.discovery.reportOutfit.useMutation({
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe",
      });
      setShowReportDialog(false);
      setReportReason("");
      setSelectedOutfitId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLike = (outfitId: number) => {
    likeMutation.mutate({ outfitId });
  };

  const handleReport = () => {
    if (!selectedOutfitId || !reportReason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    reportMutation.mutate({
      outfitId: selectedOutfitId,
      reason: reportReason,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Discover Outfits</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tag..."
              className="pl-8"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {feedLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      ) : feedData && feedData.outfits.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedData.outfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onLike={handleLike}
                onReport={(id) => {
                  setSelectedOutfitId(id);
                  setShowReportDialog(true);
                }}
                isLiking={likeMutation.isPending}
              />
            ))}
          </div>

          {/* Pagination */}
          {feedData.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: feedData.pages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(feedData.pages, page + 1))}
                disabled={page === feedData.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No outfits to discover yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Outfit</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Report *</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="offensive">Offensive</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={reportMutation.isPending}
              variant="destructive"
            >
              {reportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                "Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OutfitCard({
  outfit,
  onLike,
  onReport,
  isLiking,
}: {
  outfit: {
    id: number;
    title: string;
    imageUrl: string;
    likes: number | null;
    views: number | null;
    tags: string[];
    isLiked: boolean;
  };
  onLike: (id: number) => void;
  onReport: (id: number) => void;
  isLiking: boolean;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={outfit.imageUrl}
          alt={outfit.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
          <div className="text-white space-y-2 w-full">
            <h3 className="font-semibold">{outfit.title}</h3>
            <div className="flex gap-2 flex-wrap">
              {outfit.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{outfit.views || 0} views</span>
          <span>{outfit.likes || 0} likes</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant={outfit.isLiked ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => onLike(outfit.id)}
            disabled={isLiking}
          >
            <Heart
              className={`w-4 h-4 mr-2 ${
                outfit.isLiked ? "fill-current" : ""
              }`}
            />
            Like
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReport(outfit.id)}
          >
            <Flag className="w-4 h-4" />
          </Button>
        </div>

        {/* Comments Section */}
        <div className="border-t pt-3 mt-3">
          <CommentSection outfitId={outfit.id} />
        </div>
      </CardContent>
    </Card>
  );
}
