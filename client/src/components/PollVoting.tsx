import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Share2, Heart, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface PollVotingProps {
  pollId: string;
  onVoted?: () => void;
}

export function PollVoting({ pollId, onVoted }: PollVotingProps) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");

  // Fetch poll details
  const { data: poll, isLoading: pollLoading } = trpc.outfitPolls.getPoll.useQuery(
    { pollId },
    { enabled: !!pollId }
  );

  // Fetch user's vote
  const { data: userVoteData } = trpc.outfitPolls.getUserVote.useQuery(
    { pollId },
    { enabled: !!pollId && !!user }
  );

  // Vote mutation
  const voteMutation = trpc.outfitPolls.vote.useMutation({
    onSuccess: () => {
      onVoted?.();
    },
  });

  // Track share mutation
  const trackShareMutation = trpc.outfitPolls.trackPollShare.useMutation();

  useEffect(() => {
    if (userVoteData?.optionId) {
      setUserVote(userVoteData.optionId);
    }
  }, [userVoteData]);

  useEffect(() => {
    if (poll?.id) {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/polls/${poll.id}?ref=${user?.id || 'anonymous'}`);
    }
  }, [poll?.id, user?.id]);

  const handleVote = (optionId: string) => {
    if (!user) {
      // Redirect to login
      window.location.href = `/login?redirect=/polls/${pollId}`;
      return;
    }

    voteMutation.mutate({ pollId, optionId });
    setUserVote(optionId);
  };

  const handleShare = async (platform: 'whatsapp' | 'twitter' | 'facebook') => {
    if (!shareUrl) return;

    trackShareMutation.mutate({ pollId, platform });

    const pollTitle = poll?.title || "Check out this StyleSwap poll!";
    const message = `${pollTitle}\n\nVote now: ${shareUrl}`;

    switch (platform) {
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        break;
    }
  };

  if (pollLoading) {
    return <div className="animate-pulse">Loading poll...</div>;
  }

  if (!poll) {
    return <div>Poll not found</div>;
  }

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">{poll.title}</CardTitle>
        {poll.description && (
          <p className="text-sm text-muted-foreground mt-2">{poll.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Poll Options */}
        <div className="space-y-4">
          {poll.options.map((option) => {
            const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
            const isSelected = userVote === option.id;

            return (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleVote(option.id)}
                    className={`flex-1 text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    disabled={voteMutation.isPending}
                  >
                    <span className="font-medium">{option.text}</span>
                  </button>
                  <span className="ml-4 text-sm font-semibold text-muted-foreground">
                    {Math.round(percentage)}%
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Total Votes */}
        <div className="text-center text-sm text-muted-foreground">
          {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
        </div>

        {/* Share Section */}
        <div className="border-t pt-6 space-y-4">
          <p className="text-sm font-medium">Share this poll</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Facebook
            </Button>
          </div>
        </div>

        {/* Poll Stats */}
        <div className="border-t pt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{totalVotes}</p>
            <p className="text-xs text-muted-foreground">Votes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{poll.options.length}</p>
            <p className="text-xs text-muted-foreground">Options</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {poll.shareCount || 0}
            </p>
            <p className="text-xs text-muted-foreground">Shares</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
