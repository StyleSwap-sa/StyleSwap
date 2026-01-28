import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface SizeReviewsDisplayProps {
  clothingType: "upper" | "lower" | "combo" | "full";
  size: number;
}

export function SizeReviewsDisplay({ clothingType, size }: SizeReviewsDisplayProps) {
  // TODO: Fetch reviews from API based on clothingType and size
  // For now, show placeholder
  const reviews = [
    {
      id: 1,
      rating: 5,
      comment: "Perfect fit! Exactly as expected.",
      author: "Customer 1",
    },
    {
      id: 2,
      rating: 4,
      comment: "Good fit, slightly loose around the waist.",
      author: "Customer 2",
    },
  ];

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Customer Reviews for Size {size}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {reviews.length} reviews • Average rating: {averageRating} / 5
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{review.author}</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No reviews yet for this size. Be the first to share your experience!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
