import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boutiqueId: number;
  onSuccess?: () => void;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  boutiqueId,
  onSuccess,
}: CancelSubscriptionDialogProps) {
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: reasons } = trpc.subscription.getCancellationReasons.useQuery();
  const cancelMutation = trpc.subscription.cancelSubscription.useMutation();

  const handleCancel = async () => {
    if (!selectedReason) {
      toast({
        title: "Please select a reason",
        description: "Please tell us why you're cancelling your subscription",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await cancelMutation.mutateAsync({
        boutiqueId,
        reason: selectedReason,
        feedback: feedback || undefined,
      });

      toast({
        title: "Subscription cancelled",
        description:
          "Your subscription has been cancelled successfully. You can reactivate it anytime.",
        variant: "default",
      });

      onOpenChange(false);
      setSelectedReason("");
      setFeedback("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Failed to cancel subscription",
        description: error.message || "An error occurred while cancelling your subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            We're sorry to see you go. Please tell us why you're cancelling so we can improve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Message */}
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">⚠️ Important</p>
            <p className="mt-1">
              Cancelling your subscription will immediately stop your access to premium features.
              You can reactivate it anytime from your account settings.
            </p>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Why are you cancelling? *</label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {reasons?.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    <div>
                      <p className="font-medium">{reason.label}</p>
                      <p className="text-xs text-muted-foreground">{reason.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional feedback (optional)</label>
            <Textarea
              placeholder="Tell us how we can improve..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your feedback helps us serve you better
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Keep Subscription
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading || !selectedReason}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                Cancelling...
              </>
            ) : (
              "Cancel Subscription"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
