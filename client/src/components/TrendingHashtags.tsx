import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp } from "lucide-react";

export function TrendingHashtags() {
  const { data: hashtags, isLoading } = trpc.hashtags.getTrendingHashtags.useQuery({
    limit: 10,
  });

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading trending hashtags...</div>;
  }

  if (!hashtags || hashtags.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No trending hashtags yet. Start tagging your outfits!
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-bold">Trending Hashtags</h3>
      </div>

      <div className="space-y-3">
        {hashtags.map((hashtag, index) => (
          <div key={hashtag.id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                {index + 1}
              </div>
              <div>
                <div className="font-semibold">#{hashtag.hashtag}</div>
                <div className="text-xs text-muted-foreground">
                  {hashtag.usageCount} uses
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">{hashtag.trendingScore}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Click a hashtag to see all outfits using it
        </p>
      </div>
    </Card>
  );
}
