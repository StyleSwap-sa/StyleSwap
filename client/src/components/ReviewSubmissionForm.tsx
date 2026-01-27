import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ReviewSubmissionFormProps {
  selectedSize: number;
  onSuccess?: () => void;
}

export function ReviewSubmissionForm({ selectedSize, onSuccess }: ReviewSubmissionFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [fitDescription, setFitDescription] = useState<"tight" | "perfect" | "loose">("perfect");
  const [reviewText, setReviewText] = useState("");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");

  const submitReviewMutation = trpc.sizeReviews.submitReview.useMutation();

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    if (reviewText.length < 10) {
      alert("Please write a review (at least 10 characters)");
      return;
    }

    submitReviewMutation.mutate(
      {
        size: selectedSize,
        rating,
        fitDescription,
        reviewText,
        height: height || undefined,
        weight: weight || undefined,
      },
      {
        onSuccess: () => {
          setRating(0);
          setFitDescription("perfect");
          setReviewText("");
          setHeight("");
          setWeight("");
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="text-base">Write a Review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating Stars */}
        <div>
          <label className="text-sm font-medium">How would you rate this size?</label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Fit Description */}
        <div>
          <label className="text-sm font-medium">How does this size fit?</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(["tight", "perfect", "loose"] as const).map((fit) => (
              <button
                key={fit}
                onClick={() => setFitDescription(fit)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  fitDescription === fit
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {fit.charAt(0).toUpperCase() + fit.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label className="text-sm font-medium">Your Review</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this size..."
            className="w-full px-3 py-2 border border-input rounded-md text-sm mt-2 min-h-24 resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {reviewText.length}/500 characters
          </p>
        </div>

        {/* Body Measurements */}
        <div>
          <label className="text-sm font-medium">Optional: Your Body Measurements</label>
          <p className="text-xs text-muted-foreground">
            Help other customers with similar measurements find the right size
          </p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground">Height</label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 170cm or 5ft 6in"
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Weight</label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 150lbs or 68kg"
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitReviewMutation.isPending || rating === 0 || reviewText.length < 10}
          className="w-full"
        >
          {submitReviewMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>

        {submitReviewMutation.isError && (
          <p className="text-sm text-red-600">
            Error submitting review. Please try again.
          </p>
        )}

        {submitReviewMutation.isSuccess && (
          <p className="text-sm text-green-600">
            Thank you! Your review has been submitted.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
