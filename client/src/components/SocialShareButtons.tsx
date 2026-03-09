import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Music } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc";

interface SocialShareButtonsProps {
  outfitId: number;
  imageUrl: string;
  title: string;
  onShare?: () => void;
}

export function SocialShareButtons({
  outfitId,
  imageUrl,
  title,
  onShare,
}: SocialShareButtonsProps) {
  const { toast } = useToast();

  // Increment share count mutation
  const incrementShareMutation = trpc.closet.incrementShareCount.useMutation({
    onSuccess: () => {
      onShare?.();
    },
  });

  const handleShare = (platform: "whatsapp" | "instagram" | "tiktok") => {
    const shareText = `Check out my virtual try-on from StyleSwap: ${title}`;
    const encodedText = encodeURIComponent(shareText);

    let shareUrl = "";

    switch (platform) {
      case "whatsapp":
        // WhatsApp share with text and image URL
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodeURIComponent(imageUrl)}`;
        toast({
          title: "Opening WhatsApp",
          description: "Share your outfit with friends",
        });
        break;

      case "instagram":
        // Instagram doesn't support direct sharing via URL, so we show instructions
        toast({
          title: "Instagram Share",
          description: "Image URL copied! Open Instagram and share from your camera roll.",
        });
        // Copy image URL to clipboard
        navigator.clipboard.writeText(imageUrl);
        return;

      case "tiktok":
        // TikTok doesn't support direct sharing via URL
        toast({
          title: "TikTok Share",
          description: "Image URL copied! Open TikTok and upload from your device.",
        });
        // Copy image URL to clipboard
        navigator.clipboard.writeText(imageUrl);
        return;
    }

    // Increment share count
    incrementShareMutation.mutate({ outfitId });

    // Open share URL
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare("whatsapp")}
        disabled={incrementShareMutation.isPending}
        className="gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare("instagram")}
        disabled={incrementShareMutation.isPending}
        className="gap-2"
      >
        <Heart className="w-4 h-4" />
        Instagram
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare("tiktok")}
        disabled={incrementShareMutation.isPending}
        className="gap-2"
      >
        <Music className="w-4 h-4" />
        TikTok
      </Button>
    </div>
  );
}
