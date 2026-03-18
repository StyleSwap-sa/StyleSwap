import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";
import {
  MessageCircle,
  Instagram,
  Music,
  Twitter,
  Copy,
  Share2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SocialShareWithReferralProps {
  outfitId: number;
  outfitTitle: string;
  outfitImage: string;
}

export function SocialShareWithReferral({
  outfitId,
  outfitTitle,
  outfitImage,
}: SocialShareWithReferralProps) {
  const { toast } = useToast();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "whatsapp" | "instagram" | "tiktok" | "twitter" | null
  >(null);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReferralMutation = trpc.referrals.generateReferralLink.useMutation(
    {
      onSuccess: (data) => {
        setShareUrl(data.shareUrl);
        toast({
          title: "Referral link generated",
          description: "Ready to share with your friends!",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to generate referral link",
          variant: "destructive",
        });
      },
    }
  );

  const handleShareClick = async (
    platform: "whatsapp" | "instagram" | "tiktok" | "twitter"
  ) => {
    setSelectedPlatform(platform);
    setIsGenerating(true);

    try {
      await generateReferralMutation.mutateAsync({
        outfitId,
        platform,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const getShareMessage = () => {
    return `Check out this amazing outfit on StyleSwap! ${outfitTitle}. Join me and get your own virtual try-on profile: `;
  };

  const getShareUrl = (platform: string) => {
    const message = getShareMessage();
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case "whatsapp":
        return `https://wa.me/?text=${encodedMessage}${encodedUrl}`;
      case "instagram":
        // Instagram doesn't support direct sharing via URL, show copy option
        return null;
      case "tiktok":
        // TikTok doesn't support direct sharing via URL, show copy option
        return null;
      case "twitter":
        return `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
      default:
        return null;
    }
  };

  const handlePlatformShare = () => {
    if (!selectedPlatform) return;

    const url = getShareUrl(selectedPlatform);

    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    } else {
      // For platforms that don't support direct URL sharing
      handleCopyLink();
      toast({
        title: "Link copied",
        description: `Paste the link in your ${selectedPlatform} post`,
      });
    }

    setShowShareDialog(false);
    setSelectedPlatform(null);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShareClick("whatsapp")}
          className="gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          WhatsApp
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShareClick("instagram")}
          className="gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Instagram className="w-4 h-4" />
          )}
          Instagram
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShareClick("tiktok")}
          className="gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Music className="w-4 h-4" />
          )}
          TikTok
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShareClick("twitter")}
          className="gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Twitter className="w-4 h-4" />
          )}
          Twitter
        </Button>
      </div>

      <Dialog open={!!selectedPlatform} onOpenChange={(open) => {
        if (!open) {
          setSelectedPlatform(null);
          setShareUrl("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share "{outfitTitle}" on {selectedPlatform}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Share message:
              </p>
              <p className="text-sm font-medium">
                {getShareMessage()}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Referral Link:</label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                💡 When your friends click this link and sign up, they'll see your outfit and you'll both get rewards!
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPlatform(null);
                setShareUrl("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePlatformShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share on {selectedPlatform}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
