import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Heart, MessageCircle, UserPlus, Loader2, CheckCheck } from "lucide-react";
import CustomerDashboardLayout from "@/components/CustomerDashboardLayout";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { user } = useAuth();
  const [markingRead, setMarkingRead] = useState(false);

  // Fetch notifications
  const { data: notifications, isLoading, refetch } = trpc.notifications.getNotifications.useQuery(
    { limit: 50 },
    { enabled: !!user }
  );

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    await markAsReadMutation.mutateAsync({ all: true });
    setMarkingRead(false);
  };

  if (!user) {
    return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Sign in to view notifications</h2>
        </div>
    );
  }

  return (
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-6">
          {notifications?.some((n: any) => !n.isRead) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingRead}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !notifications?.length ? (
          <Card className="premium-card">
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                When someone likes, comments, or follows you, you'll see it here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification: any) => (
              <Card
                key={notification.id}
                className={`premium-card transition-colors ${
                  !notification.isRead ? "bg-primary/5 border-primary/20" : ""
                }`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  );
}