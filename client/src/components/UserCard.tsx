import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";

interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
  };
  action: "follow" | "unfollow" | "follow-back";
  isProcessing: boolean;
  onAction: () => void;
  actionLabel?: string;
}

export function UserCard({
  user,
  action,
  isProcessing,
  onAction,
  actionLabel,
}: UserCardProps) {
  const avatarPresignedUrl = useAvatarUrl(user.avatar);

  return (
    <Card className="premium-card hover:shadow-lg transition">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarPresignedUrl || undefined} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs text-muted-foreground">@{user.email?.split('@')[0]}</p>
          </div>
        </div>
        <Button
          variant={action === "unfollow" ? "outline" : "default"}
          size="sm"
          onClick={onAction}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            actionLabel || (action === "follow" ? "Follow" : action === "unfollow" ? "Unfollow" : "Follow Back")
          )}
        </Button>
      </CardContent>
    </Card>
  );
}