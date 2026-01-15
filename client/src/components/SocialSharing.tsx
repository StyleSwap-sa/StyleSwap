import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Copy, Check, Instagram, MessageCircle, Twitter } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ShareResult {
  tryOnId: number;
  resultImageUrl: string;
  garmentName: string;
  shareToken: string;
}

export function SocialSharing({ result }: { result: ShareResult }) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareUrl = `${window.location.origin}/share/${result.shareToken}`;

  // Track share mutation
  const trackShareMutation = trpc.sharing.trackShare.useMutation();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    try {
      await trackShareMutation.mutateAsync({
        shareToken: result.shareToken,
        platform,
      });

      const shareText = `Check out my virtual try-on with StyleSwap! I tried on ${result.garmentName} using AI-powered virtual fitting room technology.`;

      let url = "";
      switch (platform) {
        case "instagram":
          // Instagram doesn't have a direct share URL, so we copy the link
          await navigator.clipboard.writeText(shareUrl);
          alert("Link copied! Open Instagram and share it in your story or post.");
          break;
        case "tiktok":
          // TikTok share
          url = `https://www.tiktok.com/share?url=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
          window.open(url, "_blank");
          break;
        case "twitter":
          // Twitter share
          url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
          window.open(url, "_blank");
          break;
        case "whatsapp":
          // WhatsApp share
          url = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
          window.open(url, "_blank");
          break;
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Share Card */}
      <Card className="premium-card border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Your Try-On
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Result Preview */}
          <div className="rounded-lg overflow-hidden border border-border/20">
            <img
              src={result.resultImageUrl}
              alt="Try-on result"
              className="w-full h-auto"
            />
          </div>

          {/* Share Link Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg border border-border/40 bg-background text-sm"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="px-4"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Social Platforms */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share to Social Media</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Instagram */}
              <Button
                onClick={() => handleShare("instagram")}
                disabled={isSharing}
                className="flex items-center justify-center gap-2 h-10 premium-button bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
              >
                <Instagram className="w-4 h-4" />
                <span className="hidden sm:inline">Instagram</span>
              </Button>

              {/* TikTok */}
              <Button
                onClick={() => handleShare("tiktok")}
                disabled={isSharing}
                className="flex items-center justify-center gap-2 h-10 premium-button bg-black text-white hover:bg-gray-900"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.1 1.82 2.9 2.9 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.135v-3.6a5.9 5.9 0 0 0-1-.1A5.9 5.9 0 0 0 5 13.6a5.9 5.9 0 0 0 5.9 5.9 5.9 5.9 0 0 0 5.9-5.9v-2.7a7.8 7.8 0 0 0 3.77 1.01V9.71a4.82 4.82 0 0 1-.88-.08z" />
                </svg>
                <span className="hidden sm:inline">TikTok</span>
              </Button>

              {/* Twitter */}
              <Button
                onClick={() => handleShare("twitter")}
                disabled={isSharing}
                className="flex items-center justify-center gap-2 h-10 premium-button bg-sky-500 text-white hover:bg-sky-600"
              >
                <Twitter className="w-4 h-4" />
                <span className="hidden sm:inline">Twitter</span>
              </Button>

              {/* WhatsApp */}
              <Button
                onClick={() => handleShare("whatsapp")}
                disabled={isSharing}
                className="flex items-center justify-center gap-2 h-10 premium-button bg-green-500 text-white hover:bg-green-600"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            </div>
          </div>

          {/* Share Stats */}
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Share this try-on with friends and inspire them to shop with StyleSwap!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Share Preview Card */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-lg">Preview on Social Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">TWITTER PREVIEW</p>
            <div className="bg-background rounded p-3 space-y-2 text-sm">
              <p>
                Check out my virtual try-on with StyleSwap! I tried on {result.garmentName} using AI-powered virtual fitting room technology.
              </p>
              <p className="text-primary text-xs">{shareUrl}</p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">INSTAGRAM STORY</p>
            <div className="aspect-video bg-background rounded flex items-center justify-center">
              <img
                src={result.resultImageUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
