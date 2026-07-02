import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserPlus, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import CustomerDashboardLayout from "@/components/CustomerDashboardLayout";

export default function Following() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"following" | "followers">("following");
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Fetch following list
  const { data: following, isLoading: followingLoading, refetch: refetchFollowing } = trpc.follows.getFollowing.useQuery(
    { userId: user?.id || 0, limit: 50 },
    { enabled: !!user }
  );

  // Fetch followers list
  const { data: followers, isLoading: followersLoading, refetch: refetchFollowers } = trpc.follows.getFollowers.useQuery(
    { userId: user?.id || 0, limit: 50 },
    { enabled: !!user }
  );

  // Follow mutation
  const followMutation = trpc.follows.followUser.useMutation({
    onSuccess: () => {
      refetchFollowing();
      refetchFollowers();
      toast.success("Followed!");
      setProcessingUserId(null);
    },
    onError: () => {
      toast.error("Failed to follow");
      setProcessingUserId(null);
    },
  });

  // Unfollow mutation
  const unfollowMutation = trpc.follows.unfollowUser.useMutation({
    onSuccess: () => {
      refetchFollowing();
      refetchFollowers();
      toast.success("Unfollowed");
      setProcessingUserId(null);
    },
    onError: () => {
      toast.error("Failed to unfollow");
      setProcessingUserId(null);
    },
  });

  const handleFollow = (userId: number) => {
    if (!user) {
      toast.error("Please login to follow");
      return;
    }
    setProcessingUserId(userId);
    followMutation.mutate({ userId });
  };

  const handleUnfollow = (userId: number) => {
    if (!user) {
      toast.error("Please login to unfollow");
      return;
    }
    setProcessingUserId(userId);
    unfollowMutation.mutate({ userId });
  };

  if (!user) {
    return (

        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Sign in to view your connections</h2>
          <Button onClick={() => window.location.href = '/login'}>Sign In</Button>
        </div>
    );
  }

  const isLoading = followingLoading || followersLoading;

  // Helper to check if a user is in the following list
  const isFollowingUser = (userId: number) => {
    return following?.some(f => f.id === userId) || false;
  };

  return (
      <div className=" mx-auto">
        <div className="flex items-center gap-2 mb-6">

        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "following" | "followers")}>
          <TabsList className="w-full justify-start mb-6">
            <TabsTrigger value="following" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Following ({following?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Followers ({followers?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following">
            {followingLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : following?.length === 0 ? (
              <Card className="premium-card">
                <CardContent className="py-12 text-center">
                  <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Not following anyone yet</p>
                  <p className="text-sm text-muted-foreground/60 mt-2">
                    Discover inspiring outfits and follow creators on the Global Feed
                  </p>
                  <Button className="mt-4" onClick={() => window.location.href = '/global-feed'}>
                    Explore Global Feed
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {following?.map((followedUser) => (
                  <Card key={followedUser.id} className="premium-card hover:shadow-lg transition">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={followedUser.avatar || undefined} />
                          <AvatarFallback>
                            {followedUser.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{followedUser.name}</p>
                          <p className="text-xs text-muted-foreground">@{followedUser.email?.split('@')[0]}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnfollow(followedUser.id)}
                        disabled={processingUserId === followedUser.id || unfollowMutation.isPending}
                      >
                        {processingUserId === followedUser.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Unfollow"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers">
            {followersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : followers?.length === 0 ? (
              <Card className="premium-card">
                <CardContent className="py-12 text-center">
                  <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No followers yet</p>
                  <p className="text-sm text-muted-foreground/60 mt-2">
                    Share your outfits and engage with the community to grow your following
                  </p>
                  <Button className="mt-4" onClick={() => window.location.href = '/try-on'}>
                    Create a Try-On
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {followers?.map((follower) => {
                  const isFollowingBack = isFollowingUser(follower.id);
                  return (
                    <Card key={follower.id} className="premium-card hover:shadow-lg transition">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={follower.avatar || undefined} />
                            <AvatarFallback>
                              {follower.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{follower.name}</p>
                            <p className="text-xs text-muted-foreground">@{follower.email?.split('@')[0]}</p>
                          </div>
                        </div>
                        {isFollowingBack ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnfollow(follower.id)}
                            disabled={processingUserId === follower.id || unfollowMutation.isPending}
                          >
                            {processingUserId === follower.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Following"
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleFollow(follower.id)}
                            disabled={processingUserId === follower.id || followMutation.isPending}
                          >
                            {processingUserId === follower.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Follow Back"
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );
}