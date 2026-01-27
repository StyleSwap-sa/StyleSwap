import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ThumbsUp, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SizeReviewsDisplayProps {
  selectedSize: number;
}

interface Review {
  id: number;
  userId: number;
  selectedSize: number;
  fitRating: "tight" | "perfect" | "loose";
  helpfulnessRating: number;
  reviewText?: string;
  height?: string;
  weight?: string;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: string;
}

export function SizeReviewsDisplay({ selectedSize }: SizeReviewsDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    tight: 0,
    perfect: 0,
    loose: 0,
    totalReviews: 0,
    averageRating: 0,
  });

  // Fetch reviews
  const getReviewsQuery = trpc.sizeReviews.getReviewsForSize.useQuery(
    { size: selectedSize, limit: 10 },
    { enabled: !!selectedSize }
  );

  // Fetch stats
  const getStatsQuery = trpc.sizeReviews.getSizeFitStats.useQuery(
    { clothingType: "all", selectedSize },
    { enabled: !!selectedSize }
  );

  useEffect(() => {
    if (getReviewsQuery.data) {
      setReviews(getReviewsQuery.data as Review[]);
    }
    if (getStatsQuery.data) {
      setStats(getStatsQuery.data);
    }
    setIsLoading(getReviewsQuery.isLoading || getStatsQuery.isLoading);
  }, [getReviewsQuery.data, getStatsQuery.data, getReviewsQuery.isLoading, getStatsQuery.isLoading]);

  const getFitColor = (fit: "tight" | "perfect" | "loose") => {
    switch (fit) {
      case "tight":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200";
      case "perfect":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
      case "loose":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Card */}
      {stats.totalReviews > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Perfect Fit</p>
                <p className="text-2xl font-bold text-green-600">{stats.perfect}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tight Fit</p>
                <p className="text-2xl font-bold text-orange-600">{stats.tight}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loose Fit</p>
                <p className="text-2xl font-bold text-blue-600">{stats.loose}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Header: Rating and Fit */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.helpfulnessRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getFitColor(review.fitRating)}`}>
                        {review.fitRating.charAt(0).toUpperCase() + review.fitRating.slice(1)} Fit
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Review Text */}
                  {review.reviewText && (
                    <p className="text-sm text-foreground">{review.reviewText}</p>
                  )}

                  {/* Body Measurements */}
                  {(review.height || review.weight) && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {review.height && <p>Height: {review.height}</p>}
                      {review.weight && <p>Weight: {review.weight}</p>}
                    </div>
                  )}

                  {/* Helpful Count */}
                  {review.helpfulCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{review.helpfulCount} found this helpful</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-muted/20">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              No reviews yet for size {selectedSize}. Be the first to share your experience!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
