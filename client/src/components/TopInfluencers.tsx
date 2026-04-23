import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";


export function TopInfluencers({ limit = 5 }: { limit?: number }) {
  const { user } = useAuth();
  const { data: suggestions, isLoading } = 
    trpc.globalFeed.getFollowSuggestions.useQuery({ limit });

  const followMutation = trpc.globalFeed.toggleFollow.useMutation();

  const handleFollow = (userId: number) => {
    if (!user) {
      alert("Please login to follow users");
      return;
    }
    followMutation.mutate({ userId });
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle>Top Influencers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions?.suggestions.map((user) => (
          <div key={user.id} className="flex items-center gap-2">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.followerCount} followers</p>
            </div>
            {user && (
              <Button size="sm" variant="outline" onClick={() => handleFollow(user.id)}>
                Follow
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}