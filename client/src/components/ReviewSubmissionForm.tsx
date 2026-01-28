import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star } from "lucide-react";

interface ReviewSubmissionFormProps {
  clothingType: "upper" | "lower" | "combo" | "full";
  size: number;
  onSubmitSuccess?: () => void;
}

export function ReviewSubmissionForm({ clothingType, size, onSubmitSuccess }: ReviewSubmissionFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Call API to submit review
      // const response = await fetch("/api/reviews", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     clothingType,
      //     size,
      //     rating,
      //     comment,
      //   }),
      // });

      setSubmitted(true);
      setComment("");
      setRating(5);
      onSubmitSuccess?.();

      // Reset after 2 seconds
      setTimeout(() => setSubmitted(false), 2000);
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <p className="text-green-900 font-semibold">✓ Thank you for your review!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Share Your Experience</CardTitle>
        <p className="text-sm text-muted-foreground">Help other customers with size feedback</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating */}
        <div>
          <label className="text-sm font-semibold mb-2 block">How would you rate the fit?</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-semibold mb-2 block">Your feedback</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How did this size fit? Any recommendations?"
            className="w-full p-2 border border-border rounded-md text-sm"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !comment.trim()}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
