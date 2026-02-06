"use client";

import { useNotifications } from "@/components/notifications/notification-provider";
import { Notification as AppNotification } from "@/lib/notifications/notification-types";
import { NotificationList } from "@/components/notifications/notification-list";

export default function NotificationsPageContent({ userId }: { userId: string }) {
    const { notifications } = useNotifications();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <p className="text-muted-foreground">
                    Stay updated on tasks, reports, and messages
                </p>
            </div>

            <NotificationList notifications={notifications as AppNotification[]} userId={userId} />
        </div>
    );
}
