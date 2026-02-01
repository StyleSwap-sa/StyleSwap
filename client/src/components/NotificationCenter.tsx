import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Bell, Trash2, Check, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch notifications
  const { data: notificationsData, refetch: refetchNotifications, isLoading } =
    trpc.notifications.getNotifications.useQuery(
      { limit: 10, offset: 0 },
      { enabled: autoRefresh, refetchInterval: 30000 } // Refetch every 30 seconds
    );

  // Fetch unread count
  const { data: unreadData, refetch: refetchUnread } =
    trpc.notifications.getUnreadCount.useQuery(undefined, {
      enabled: autoRefresh,
      refetchInterval: 30000,
    });

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchUnread();
    },
    onError: (error) => {
      toast.error("Failed to mark notification as read", {
        description: error.message,
      });
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchUnread();
      toast.success("All notifications marked as read");
    },
    onError: (error) => {
      toast.error("Failed to mark all as read", {
        description: error.message,
      });
    },
  });

  const deleteNotificationMutation = trpc.notifications.deleteNotification.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchUnread();
      toast.success("Notification deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete notification", {
        description: error.message,
      });
    },
  });

  const deleteAllMutation = trpc.notifications.deleteAll.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchUnread();
      toast.success("All notifications cleared");
    },
    onError: (error) => {
      toast.error("Failed to clear notifications", {
        description: error.message,
      });
    },
  });

  const notifications = notificationsData || [];
  const unreadCount = unreadData?.unreadCount || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "boutique_signup":
        return "🏪";
      case "try_on_complete":
        return "👕";
      case "credits_low":
        return "⚠️";
      case "product_added":
        return "📦";
      case "boutique_verified":
        return "✅";
      case "payment_received":
        return "💰";
      case "customer_inquiry":
        return "💬";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "boutique_signup":
        return "bg-blue-50 dark:bg-blue-950";
      case "try_on_complete":
        return "bg-purple-50 dark:bg-purple-950";
      case "credits_low":
        return "bg-orange-50 dark:bg-orange-950";
      case "product_added":
        return "bg-green-50 dark:bg-green-950";
      case "boutique_verified":
        return "bg-green-50 dark:bg-green-950";
      case "payment_received":
        return "bg-emerald-50 dark:bg-emerald-950";
      case "customer_inquiry":
        return "bg-cyan-50 dark:bg-cyan-950";
      default:
        return "bg-gray-50 dark:bg-gray-950";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="flex-1"
                >
                  {markAllAsReadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4 mr-1" />
                  )}
                  Mark all read
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteAllMutation.mutate()}
                disabled={deleteAllMutation.isPending}
                className="flex-1"
              >
                {deleteAllMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-muted/50 transition-colors ${
                  notification.read === 0 ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">
                        {notification.title}
                      </h3>
                      {notification.read === 0 && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    {notification.read === 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          markAsReadMutation.mutate({ notificationId: notification.id })
                        }
                        disabled={markAsReadMutation.isPending}
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        deleteNotificationMutation.mutate({ notificationId: notification.id })
                      }
                      disabled={deleteNotificationMutation.isPending}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Action URL Link */}
                {notification.actionUrl && (
                  <div className="mt-2">
                    <a
                      href={notification.actionUrl}
                      className="text-xs text-primary hover:underline"
                      onClick={() => setIsOpen(false)}
                    >
                      View details →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
