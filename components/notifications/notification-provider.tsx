"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAbly } from "@/providers/ably-provider";
import { Notification as AppNotification } from "@/lib/notifications/notification-types";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    permissionStatus: NotificationPermission;
    requestPermission: () => Promise<NotificationPermission>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { client: ablyClient, isConfigured } = useAbly();
    const { user } = useUser();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
        typeof window !== 'undefined' ? Notification.permission : 'default'
    );

    // 1. Fetch initial notifications
    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/notifications?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // 2. Sound Management & Reactive Permission Tracking
    useEffect(() => {
        // Preload sounds
        const soundTypes = ['success', 'warning', 'task', 'message', 'notification'];
        soundTypes.forEach(type => {
            const audio = new Audio(`/sounds/${type}.mp3`);
            audio.onerror = () => { };
            audioRefs.current[type] = audio;
        });

        // Request Browser Notification Permission (Attempt on mount, usually blocked)
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                // We keep this, but add a way to trigger it via user gesture
                Notification.requestPermission().then(status => {
                    setPermissionStatus(status);
                });
            }
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            const status = await Notification.requestPermission();
            setPermissionStatus(status);
            if (status === 'granted') {
                toast.success("Browser notifications enabled!");
            } else if (status === 'denied') {
                toast.error("Notifications were blocked. Please enable them in your browser settings to stay updated.");
            }
            return status;
        }
        return 'default';
    }, []);

    const playSound = useCallback((type: string) => {
        if (isMuted) return;
        const audio = audioRefs.current[type] || audioRefs.current['notification'];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => { });
        }
    }, [isMuted]);

    const showBrowserNotification = useCallback((notif: AppNotification) => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const systemNotif = new Notification(notif.title, {
                body: notif.message,
                icon: '/icon-192x192.png', // Fallback to PWA icon
            });

            systemNotif.onclick = () => {
                window.focus();
                if (notif.link) window.location.href = notif.link;
            };
        }
    }, []);

    // 3. Real-time Subscription
    useEffect(() => {
        if (!ablyClient || !user?.id || !isConfigured) return;

        const channel = ablyClient.channels.get(`user-notifications:${user.id}`);

        const handleNewNotification = (message: any) => {
            const notification = message.data as AppNotification;

            // Avoid duplicates if already in list (sync logic)
            setNotifications(prev => {
                if (prev.some(n => n.id === notification.id)) return prev;
                return [notification, ...prev];
            });

            // Play sound
            playSound(notification.sound || 'notification');

            // Show Toast
            toast(notification.title, {
                description: notification.message,
                action: notification.link ? {
                    label: "View",
                    onClick: () => window.location.href = notification.link!
                } : undefined,
                duration: notification.priority === 'urgent' ? Infinity : 8000
            });

            // Browser Notification
            showBrowserNotification(notification);
        };

        const globalChannel = ablyClient.channels.get("announcements:global");

        channel.subscribe("new-notification", handleNewNotification);
        globalChannel.subscribe("announcement", handleNewNotification);

        return () => {
            channel.unsubscribe("new-notification", handleNewNotification);
            globalChannel.unsubscribe("announcement", handleNewNotification);
        };
    }, [ablyClient, user?.id, isConfigured, playSound, showBrowserNotification]);

    // 4. Actions
    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        try {
            await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        try {
            await fetch(`/api/notifications`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id })
            });
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            fetchNotifications,
            isMuted,
            setIsMuted,
            permissionStatus,
            requestPermission
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
