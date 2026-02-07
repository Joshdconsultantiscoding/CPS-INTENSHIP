"use client";

import { useNotifications } from "@/components/notifications/notification-engine";
import { Notification as AppNotification } from "@/lib/notifications/notification-types";
import { NotificationList } from "@/components/notifications/notification-list";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import Link from "next/link";

export interface NotificationsPageContentProps {
    userId: string;
    role: "admin" | "intern";
}

export default function NotificationsPageContent({ userId, role }: NotificationsPageContentProps) {
    const { notifications } = useNotifications();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        Stay updated on tasks, reports, and messages
                    </p>
                </div>

                {role === "admin" && (
                    <Button asChild>
                        <Link href="/dashboard/notifications/send">
                            <Send className="h-4 w-4 mr-2" />
                            Send Notification
                        </Link>
                    </Button>
                )}
            </div>

            <NotificationList notifications={notifications as AppNotification[]} userId={userId} />
        </div>
    );
}
