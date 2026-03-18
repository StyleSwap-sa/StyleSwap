import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
  userId: number;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ userId, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if already following
  const { data: followStatus } = trpc.follows.isFollowing.useQuery(
    { userId },
    { enabled: !!userId }
  );

  useEffect(() => {
    if (followStatus !== undefined) {
      setIsFollowing(followStatus);
    }
  }, [followStatus]);

  const followMutation = trpc.follows.followUser.useMutation({
    onSuccess: () => {
      setIsFollowing(true);
      onFollowChange?.(true);
      toast({
        title: "Following",
        description: "You are now following this user",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = trpc.follows.unfollowUser.useMutation({
    onSuccess: () => {
      setIsFollowing(false);
      onFollowChange?.(false);
      toast({
        title: "Unfollowed",
        description: "You have unfollowed this user",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });

  const handleToggleFollow = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowMutation.mutateAsync({ userId });
      } else {
        await followMutation.mutateAsync({ userId });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isLoading}
      variant={isFollowing ? "outline" : "default"}
      className="gap-2"
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </Button>
  );
}
