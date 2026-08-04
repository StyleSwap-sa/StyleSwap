import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Heart, MessageCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("outfits");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const userIdNum = parseInt(userId);
  const utils = trpc.useUtils();
  
  // Fetch user info
  const { data: userInfo, isLoading: userLoading } = trpc.profiles.getUserInfo.useQuery(
    { userId: userIdNum },
    { enabled: !!userIdNum }
  );
  
  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = trpc.profiles.getUserProfile.useQuery(
    { userId: userIdNum },
    { enabled: !!userIdNum }
  );
  
  const avatarPresignedUrl = useAvatarUrl(profile?.avatar);

  // Fetch user's outfits
  const { data: outfits, isLoading: outfitsLoading } = trpc.profiles.getUserOutfits.useQuery(
    { userId: userIdNum, limit: 20 },
    { 
      enabled: !!userIdNum,
      staleTime: 0,
     }
  );
  
  // Fetch follower/following counts
  const { data: followerData, refetch: refetchFollowerCount } = trpc.profiles.getFollowerCount.useQuery(
    { userId: userIdNum },
    { enabled: !!userIdNum }
  );
  
  const { data: followingData, refetch: refetchFollowingCount } = trpc.profiles.getFollowingCount.useQuery(
    { userId: userIdNum },
    { enabled: !!userIdNum }
  );
  
  // Check if current user is following this profile
  const { data: isFollowingData, refetch: refetchIsFollowing } = trpc.profiles.isFollowing.useQuery(
    { userId: userIdNum },
    { enabled: !!currentUser && currentUser.id !== userIdNum }
  );
  
  // Follow/unfollow mutation with optimistic update
  const followMutation = trpc.globalFeed.toggleFollow.useMutation({
    onMutate: async ({ userId: targetUserId }) => {
      // Cancel outgoing refetches
      await utils.profiles.isFollowing.cancel({ userId: targetUserId });
      await utils.profiles.getFollowerCount.cancel({ userId: targetUserId });
      
      // Snapshot previous values
      const previousIsFollowing = utils.profiles.isFollowing.getData({ userId: targetUserId });
      const previousFollowerCount = utils.profiles.getFollowerCount.getData({ userId: targetUserId });
      
      // Optimistically update
      const newIsFollowing = !isFollowing;
      const newFollowerCount = newIsFollowing 
        ? (followerData || 0) + 1 
        : (followerData || 0) - 1;
      
      // Update local state
      setIsFollowing(newIsFollowing);
      setFollowerCount(newFollowerCount);
      
      // Update cache
      utils.profiles.isFollowing.setData({ userId: targetUserId }, newIsFollowing);
      utils.profiles.getFollowerCount.setData({ userId: targetUserId }, newFollowerCount);
      
      return { previousIsFollowing, previousFollowerCount };
    },
    onError: (err, input, context) => {
      // Rollback on error
      if (context?.previousIsFollowing !== undefined) {
        setIsFollowing(context.previousIsFollowing);
        utils.profiles.isFollowing.setData(
          { userId: input.userId },
          context.previousIsFollowing
        );
      }
      if (context?.previousFollowerCount !== undefined) {
        setFollowerCount(context.previousFollowerCount);
        utils.profiles.getFollowerCount.setData(
          { userId: input.userId },
          context.previousFollowerCount
        );
      }
      toast.error("Failed to follow user");
    },
    onSuccess: () => {
      toast.success(isFollowing ? "Unfollowed" : "Following!");
      refetchIsFollowing();
      refetchFollowerCount();
      refetchFollowingCount();
      // Invalidate the outfits query to get fresh like/comment counts
      utils.profiles.getUserOutfits.invalidate({ userId: userIdNum, limit: 20 });
    },
  });

  // Set initial values from data
  useEffect(() => {
    if (followerData !== undefined) {
      setFollowerCount(followerData);
    }
  }, [followerData]);

  useEffect(() => {
    if (followingData !== undefined) {
      setFollowingCount(followingData);
    }
  }, [followingData]);

  useEffect(() => {
    if (isFollowingData !== undefined) {
      setIsFollowing(isFollowingData);
    }
  }, [isFollowingData]);

  const handleFollow = () => {
    if (!currentUser) {
      toast.error("Please login to follow users");
      return;
    }
    if (currentUser.id === userIdNum) {
      toast.error("You can't follow yourself");
      return;
    }
    followMutation.mutate({ userId: userIdNum });
  };

  const isOwnProfile = currentUser?.id === userIdNum;
  
  if (userLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }
  
  if (!userInfo) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">User not found</h2>
        <Button onClick={() => setLocation("/global-feed")}>Back to Feed</Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover & Profile Image */}
      <div className="relative mb-16">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-t-lg" />
        <div className="absolute -bottom-12 left-6">
          <Avatar className="w-24 h-24 border-4 border-background">
            <AvatarImage src={avatarPresignedUrl || undefined} />
            <AvatarFallback className="text-2xl bg-primary/20">
              {userInfo.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Profile Info */}
      <div className="px-6 pt-4 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">{userInfo.name}</h1>
            <p className="text-muted-foreground">@{userInfo.email?.split('@')[0]}</p>
          </div>
          {!isOwnProfile && currentUser && (
            <Button
              onClick={handleFollow}
              disabled={followMutation.isPending}
              variant={isFollowing ? "outline" : "default"}
              className="min-w-[100px]"
            >
              {followMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isFollowing ? (
                "Following"
              ) : (
                "Follow"
              )}
            </Button>
          )}
        </div>
        
        {profile?.bio && (
          <p className="text-muted-foreground mb-4">{profile.bio}</p>
        )}
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {profile?.stylePreferences && (
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{profile.stylePreferences}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Joined January 2026</span>
          </div>
        </div>
        
        <div className="flex gap-6 mt-4 text-sm">
          <div className="text-center">
            <div className="font-bold">{outfits?.length || 0}</div>
            <div className="text-muted-foreground">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-bold">{followerCount}</div>
            <div className="text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-bold">{followingCount}</div>
            <div className="text-muted-foreground">Following</div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="outfits">Outfits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="outfits" className="py-6">
          {outfitsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : outfits?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No outfits yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outfits?.map((outfit) => (
                <Card key={outfit.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition">
                  <div className="aspect-square">
                    <img
                      src={outfit.watermarkedImageUrl}
                      alt={outfit.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm truncate">{outfit.title}</h3>
                    {outfit.style && (
                      <p className="text-xs text-primary font-semibold mt-1">#{outfit.style}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {outfit.likeCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {outfit.commentCount ?? 0}
                        </span>
                      </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saved" className="py-6">
          <div className="text-center py-12 text-muted-foreground">
            Coming soon - outfits you've saved
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}