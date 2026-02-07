"use client";

import { useNotifications } from "@/components/notifications/notification-engine";
import { Notification as AppNotification } from "@/lib/notifications/notification-types";
import { NotificationList } from "@/components/notifications/notification-list";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export interface NotificationsPageContentProps {
    userId: string;
    role: "admin" | "intern";
}

export default function NotificationsPageContent({ userId, role }: NotificationsPageContentProps) {
    const { notifications } = useNotifications();
    const [isTesting, setIsTesting] = useState(false);

    const testSound = () => {
        setIsTesting(true);
        const audio = new Audio('/sounds/notification.mp3');
        audio.play()
            .then(() => {
                toast.success("Sound played successfully! Your browser audio is unlocked.");
                setIsTesting(false);
            })
            .catch((err) => {
                console.error("Manual sound test failed:", err);
                toast.error("Sound blocked. Please click anywhere on the page to enable audio.");
                setIsTesting(false);
            });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        Stay updated on tasks, reports, and messages
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={testSound}
                        disabled={isTesting}
                    >
                        {isTesting ? <VolumeX className="h-4 w-4 mr-2 animate-pulse" /> : <Volume2 className="h-4 w-4 mr-2" />}
                        Troubleshoot Sounds
                    </Button>

                    {role === "admin" && (
                        <Button asChild size="sm">
                            <Link href="/dashboard/notifications/send">
                                <Send className="h-4 w-4 mr-2" />
                                Send Notification
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <NotificationList notifications={notifications as AppNotification[]} userId={userId} />
        </div>
    );
}
