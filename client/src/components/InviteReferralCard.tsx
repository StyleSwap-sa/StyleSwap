import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";
import {
  Share2,
  Copy,
  MessageCircle,
  Mail,
  Loader2,
  Users,
  Gift,
  CheckCircle2,
} from "lucide-react";

export function InviteReferralCard() {
  const [inviteCode, setInviteCode] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate invite code
  const generateMutation = trpc.inviteCampaign.generateInviteCode.useQuery();

  // Get invite stats
  const statsMutation = trpc.inviteCampaign.getInviteStats.useQuery();

  useEffect(() => {
    if (generateMutation.data) {
      setInviteCode(generateMutation.data.inviteCode);
      setShareUrl(generateMutation.data.shareUrl);
    }
  }, [generateMutation.data]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Share link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = `Join StyleSwap with my invite code: ${inviteCode}\n\nGet 2 free credits when you sign up! 🎁\n\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareEmail = () => {
    const subject = "Join StyleSwap - Get Free Credits!";
    const body = `Hi!\n\nI'm inviting you to try StyleSwap, an AI-powered virtual fitting room for fashion.\n\nUse my invite code: ${inviteCode}\n\nYou'll get 2 free credits to try it out!\n\nJoin here: ${shareUrl}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const stats = statsMutation.data;
  const isLoading = generateMutation.isLoading || statsMutation.isLoading;

  return (
    <Card className="premium-card border-secondary/30 bg-gradient-to-br from-secondary/5 to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-secondary" />
          Invite Friends & Earn Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Offer */}
        <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                Invite 2 friends → Get 5 bonus credits
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your friends get 2 credits each when they join with your code
              </p>
            </div>
          </div>
        </div>

        {/* Invite Code Display */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-secondary" />
          </div>
        ) : (
          <>
            {/* Your Invite Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Your Invite Code
              </label>
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="font-mono font-bold text-center bg-background"
                />
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Share Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Share Link
              </label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="text-xs bg-background truncate"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                className="gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                onClick={handleShareEmail}
                variant="outline"
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>

            {/* Progress Stats */}
            {stats && (
              <div className="border-t border-border/40 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">
                      {stats.totalInvites}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Friends Invited
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {stats.creditsRemaining}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      More to Earn 5 Credits
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>
                      {stats.totalInvites} / 2
                    </span>
                  </div>
                  <div className="w-full bg-secondary/20 rounded-full h-2">
                    <div
                      className="bg-secondary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((stats.totalInvites / 2) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Bonus Earned */}
                {stats.creditsEarned > 0 && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        Bonus Unlocked!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        You've earned {stats.creditsEarned} bonus credits
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Info Box */}
        <div className="bg-background/50 border border-border/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">How it works:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Share your invite code with friends</li>
            <li>They sign up and get 2 free credits</li>
            <li>When 2 friends join, you get 5 bonus credits</li>
            <li>No limits - keep inviting and earning!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
