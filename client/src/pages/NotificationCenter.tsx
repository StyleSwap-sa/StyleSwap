import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function NotificationCenter() {
  const { user, isAuthenticated } = useAuth();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: notificationsData, isLoading } = trpc.notifications.getNotifications.useQuery(
    { unreadOnly, limit: 50 },
    { enabled: isAuthenticated }
  );

  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(
    {},
    { enabled: isAuthenticated }
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please log in to view notifications</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount && unreadCount.unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount.unreadCount}</Badge>
            )}
          </div>
          {unreadCount && unreadCount.unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Loading notifications...</p>
              </CardContent>
            </Card>
          ) : notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
            <>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={unreadOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUnreadOnly(false)}
                >
                  All
                </Button>
                <Button
                  variant={unreadOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUnreadOnly(true)}
                >
                  Unread
                </Button>
              </div>

              {notificationsData.notifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className={`${
                    !notification.isRead ? "border-primary/50 bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{notification.userName}</p>
                          <Badge variant="secondary" className="text-xs">
                            {notification.notificationType === "new_comment"
                              ? "New Comment"
                              : notification.notificationType === "comment_reply"
                              ? "Reply"
                              : "Like"}
                          </Badge>
                          {!notification.isRead && (
                            <Badge variant="destructive" className="text-xs">
                              Unread
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.comment}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  {unreadOnly
                    ? "No unread notifications"
                    : "No notifications yet. Start engaging with the community!"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
