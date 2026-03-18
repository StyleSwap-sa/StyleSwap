import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
// import { useToast } from "@/hooks/use-toast";

interface ReviewSubmissionFormProps {
  tryOnResultId: number;
  onSuccess?: () => void;
}

export function ReviewSubmissionForm({
  tryOnResultId,
  onSuccess,
}: ReviewSubmissionFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const { toast } = useToast();

  const submitReviewMutation = trpc.reviews.submitReview.useMutation({
    onSuccess: () => {
      console.log("Review submitted successfully");
      setRating(0);
      setComment("");
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to submit review:", error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      console.warn("Rating required");
      return;
    }

    if (comment.trim().length < 10) {
      console.warn("Comment too short");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReviewMutation.mutateAsync({
        tryOnResultId,
        rating,
        comment: comment.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div>
        <label className="block text-sm font-medium mb-2">
          Rate your experience
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= (hoverRating || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Share your feedback
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your try-on experience... (minimum 10 characters)"
          className="min-h-24"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/500 characters
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || submitReviewMutation.isPending}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
