import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MessageCircle, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function TrendingPollsFeed() {
  const [, setLocation] = useLocation();
  const { data: polls, isLoading } = trpc.outfitPolls.getTrendingPolls.useQuery({
    limit: 10,
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading trending polls...</div>;
  }

  if (!polls || polls.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No trending polls yet. Be the first to create one!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Trending Polls</h2>
      </div>

      {polls.map((poll) => {
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
        const topOption = poll.options.reduce((max, opt) =>
          opt.voteCount > max.voteCount ? opt : max
        );
        const topPercentage = totalVotes > 0 ? (topOption.voteCount / totalVotes) * 100 : 0;

        return (
          <Card
            key={poll.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation(`/polls/${poll.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{poll.title}</CardTitle>
                  {poll.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {poll.description}
                    </p>
                  )}
                </div>
                {topPercentage > 50 && (
                  <Badge variant="secondary" className="ml-2">
                    {Math.round(topPercentage)}% agree
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Top Option Preview */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{topOption.text}</span>
                  <span className="text-xs text-muted-foreground">
                    {topOption.voteCount} votes
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${topPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {totalVotes} votes
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  {poll.shareCount || 0} shares
                </div>
              </div>

              {/* View Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation(`/polls/${poll.id}`);
                }}
              >
                View Poll
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
