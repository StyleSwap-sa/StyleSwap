import { Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
// import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: number;
  rating: number;
  comment: string;
  helpfulCount: number;
  createdAt: string;
  user?: {
    name: string;
  };
}

interface ReviewDisplayProps {
  reviews: Review[];
  isLoading?: boolean;
  tryOnResultId?: number;
}

export function ReviewDisplay({
  reviews,
  isLoading,
  tryOnResultId,
}: ReviewDisplayProps) {
  // const { toast } = useToast();
  const markHelpfulMutation = trpc.reviews.markHelpful.useMutation({
    onSuccess: () => {
      console.log("Review marked as helpful");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg bg-card animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-full mb-2"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="p-4 border rounded-lg bg-card hover:bg-card/80 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{review.rating}/5</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {review.user?.name || "Anonymous"} •{" "}
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <p className="text-sm mb-3">{review.comment}</p>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              markHelpfulMutation.mutate({
                reviewId: review.id,
              })
            }
            disabled={markHelpfulMutation.isPending}
            className="gap-2"
          >
            <ThumbsUp className="w-4 h-4" />
            Helpful ({review.helpfulCount})
          </Button>
        </div>
      ))}
    </div>
  );
}
