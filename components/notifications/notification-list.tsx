"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Notification } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckSquare,
  FileText,
  MessageSquare,
  Trophy,
  AlertCircle,
  Check,
  CheckCheck,
} from "lucide-react";
import { useAbly } from "@/providers/ably-provider";

interface NotificationListProps {
  notifications: Notification[];
  userId: string;
}

const typeIcons = {
  task: CheckSquare,
  report: FileText,
  message: MessageSquare,
  achievement: Trophy,
  system: AlertCircle,
};

const typeColors = {
  task: "bg-primary/10 text-primary",
  report: "bg-chart-2/10 text-chart-2",
  message: "bg-chart-1/10 text-chart-1",
  achievement: "bg-chart-3/10 text-chart-3",
  system: "bg-muted text-muted-foreground",
};

export function NotificationList({ notifications, userId }: NotificationListProps) {
  const router = useRouter();
  const { client, isConfigured } = useAbly();

  // Real-time notification subscription via Ably
  useEffect(() => {
    if (!client || !isConfigured || !userId) return;

    const channelName = `user-notifications:${userId}`;
    const channel = client.channels.get(channelName);

    const handleNotification = (message: any) => {
      const data = message.data;
      toast(data.title || "New Notification", {
        description: data.content || data.message,
        duration: 5000,
      });
      // Refresh to show new notification in list
      router.refresh();
    };

    channel.subscribe("alert", handleNotification);
    channel.subscribe("notification", handleNotification);

    return () => {
      channel.unsubscribe("alert", handleNotification);
      channel.unsubscribe("notification", handleNotification);
    };
  }, [client, isConfigured, userId, router]);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    router.refresh();
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    toast.success("All notifications marked as read");
    router.refresh();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{unreadCount} unread</Badge>
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
            <p className="mt-2 text-center text-muted-foreground">
              {"You're all caught up! We'll notify you when something important happens."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            const colorClass = typeColors[notification.type] || typeColors.system;

            return (
              <Card
                key={notification.id}
                className={`transition-colors ${!notification.is_read ? "border-primary/50 bg-primary/5" : ""
                  }`}
              >
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-base">
                      {notification.title}
                    </CardTitle>
                    <CardDescription>{notification.message}</CardDescription>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Mark as read</span>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pl-[4.5rem]">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

