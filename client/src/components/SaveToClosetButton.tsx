import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SaveToClosetButtonProps {
  tryOnResultId: number;
  isDisabled?: boolean;
}

export function SaveToClosetButton({
  tryOnResultId,
  isDisabled = false,
}: SaveToClosetButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");

  // Check if outfit is already saved
  const { data: statusData } = trpc.closet.isOutfitSaved.useQuery(
    { tryOnResultId },
    { enabled: !!tryOnResultId }
  );

  // Save outfit mutation
  const saveOutfitMutation = trpc.closet.saveToCloset.useMutation({
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Outfit saved to your closet",
        variant: "default",
      });
      setTitle("");
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save outfit",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for this outfit",
        variant: "destructive",
      });
      return;
    }

    saveOutfitMutation.mutate({
      tryOnResultId,
      title: title.trim(),
    });
  };

  const isSaved = statusData?.isSaved;

  return (
    <>
      <Button
        variant={isSaved ? "default" : "outline"}
        size="lg"
        onClick={() => setIsOpen(true)}
        disabled={isDisabled || saveOutfitMutation.isPending}
        className="w-full gap-2"
      >
        <Heart
          className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`}
        />
        {isSaved ? "Saved to Closet" : "Save to My Closet"}
      </Button>

      {/* Save Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Outfit to Your Closet</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="outfit-title">Outfit Title</Label>
              <Input
                id="outfit-title"
                placeholder="e.g., Red Dress for Party"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Give your try-on a name so you can easily find it later. You can compare multiple outfits, show friends, or re-evaluate before buying.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={saveOutfitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveOutfitMutation.isPending || !title.trim()}
            >
              {saveOutfitMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save to Closet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
