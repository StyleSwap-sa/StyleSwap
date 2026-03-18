import { useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "@/components/FollowButton";
import { Loader2, Shirt } from "lucide-react";
import { useState } from "react";

export default function UserProfile() {
  const { userId: userIdParam } = useParams();
  const userId = userIdParam ? parseInt(userIdParam) : null;
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  // Get user info
  const { data: userInfo, isLoading: userLoading } = trpc.profiles.getUserInfo.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  // Get user profile
  const { data: profile, isLoading: profileLoading } = trpc.profiles.getUserProfile.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  // Get user's outfits
  const { data: outfits, isLoading: outfitsLoading } = trpc.profiles.getUserOutfits.useQuery(
    { userId: userId!, limit: 20, page: 1 },
    { enabled: !!userId }
  );

  // Get follower count
  const { data: followerCount } = trpc.profiles.getFollowerCount.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  // Get following count
  const { data: followingCount } = trpc.profiles.getFollowingCount.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  if (userLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{userInfo.name}</h1>
                <p className="text-muted-foreground mb-4">{userInfo.email}</p>

                {profile?.bio && (
                  <p className="text-lg mb-4">{profile.bio}</p>
                )}

                {profile?.favoriteStyle && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      Style: {profile.favoriteStyle}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-8 mb-6">
                  <div>
                    <p className="text-2xl font-bold">{outfits?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Outfits</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{followerCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{followingCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                </div>
              </div>

              {/* Profile Actions */}
              <div className="flex gap-3">
                {!isOwnProfile && (
                  <FollowButton
                    userId={userId}
                    onFollowChange={setIsFollowing}
                  />
                )}
                {isOwnProfile && (
                  <Button variant="outline">Edit Profile</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User's Outfits */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Shirt className="w-6 h-6" />
            Saved Outfits
          </h2>

          {outfitsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : outfits && outfits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outfits.map((outfit) => (
                <Card key={outfit.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={outfit.watermarkedImageUrl}
                      alt={outfit.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-2">{outfit.title}</h3>
                    {outfit.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {outfit.description}
                      </p>
                    )}
                    {outfit.tags && outfit.tags !== "[]" && (
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(outfit.tags).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shirt className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? "You haven't saved any outfits yet"
                    : "This user hasn't saved any outfits yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
