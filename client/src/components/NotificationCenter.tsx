import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Bell,
  X,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

/**
 * Notification Center Component
 * Displays in-app notifications for verification events
 */

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch unread notifications
  const { data: unreadNotifications, refetch } = trpc.verification.getUnreadNotifications.useQuery(
    { boutiqueId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Mark as read mutation
  const { mutate: markAsRead } = trpc.verification.markNotificationAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Delete notification mutation
  const { mutate: deleteNotification } = trpc.verification.deleteNotification.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  useEffect(() => {
    if (unreadNotifications) {
      setNotifications(unreadNotifications);
    }
  }, [unreadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'verification_approved':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'verification_rejected':
      case 'fraud_flag_detected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'verification_expiring':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'fraud_appeal_approved':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'fraud_appeal_rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-muted/50 transition ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                window.location.href = notification.actionUrl || '';
                                setIsOpen(false);
                              }}
                              className="gap-1"
                            >
                              <ArrowRight className="w-3 h-3" />
                              View
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  window.location.href = '/dashboard/notifications';
                  setIsOpen(false);
                }}
              >
                View All Notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Full Notifications Page Component
 */
export function NotificationsPage() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState('all');

  // Fetch all notifications
  const { data: allNotifications, refetch } = trpc.verification.getAllNotifications.useQuery(
    { boutiqueId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Mark all as read mutation
  const { mutate: markAllAsRead } = trpc.verification.markAllNotificationsAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const filteredNotifications =
    filterType === 'all'
      ? allNotifications
      : allNotifications?.filter((n: any) => n.type === filterType);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated on your verification status and account activity
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => markAllAsRead()}
          disabled={!allNotifications || allNotifications.length === 0}
        >
          Mark All as Read
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg transition ${
            filterType === 'all'
              ? 'bg-primary text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('verification_approved')}
          className={`px-4 py-2 rounded-lg transition ${
            filterType === 'verification_approved'
              ? 'bg-green-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilterType('verification_rejected')}
          className={`px-4 py-2 rounded-lg transition ${
            filterType === 'verification_rejected'
              ? 'bg-red-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setFilterType('fraud_flag_detected')}
          className={`px-4 py-2 rounded-lg transition ${
            filterType === 'fraud_flag_detected'
              ? 'bg-yellow-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Fraud Flags
        </button>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        {filteredNotifications && filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification: Notification) => (
            <Card key={notification.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {notification.type === 'verification_approved' && (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    )}
                    {notification.type === 'verification_rejected' && (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                    {notification.type === 'fraud_flag_detected' && (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    )}
                    {notification.type === 'verification_expiring' && (
                      <Clock className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold">{notification.title}</h3>
                      <Badge>{notification.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {notification.actionUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => (window.location.href = notification.actionUrl || '')}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="font-bold mb-2">No Notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! Check back later for updates.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
