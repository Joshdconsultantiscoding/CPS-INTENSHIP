"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useNotificationEngine } from "@/hooks/use-notification-engine";
import { CriticalNotificationModal } from "./critical-modal";
import { Notification } from "@/lib/notifications/notification-types";

interface NotificationEngineContextType {
    notifications: Notification[];
    pendingNotifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    dismissNotification: (id: string) => void;
    fetchNotifications: () => Promise<void>;
}

const NotificationEngineContext = createContext<NotificationEngineContextType | null>(null);

export function useNotifications() {
    const context = useContext(NotificationEngineContext);
    if (!context) {
        throw new Error("useNotifications must be used within NotificationEngineProvider");
    }
    return context;
}

interface NotificationEngineProviderProps {
    children: ReactNode;
    role?: string;
}

/**
 * NotificationEngineProvider
 * Wraps the dashboard to provide real-time notification handling.
 * - Shows toasts for NORMAL/IMPORTANT notifications
 * - Shows fullscreen modal for CRITICAL notifications
 * - Handles retry logic for IMPORTANT notifications
 * - Recovers pending notifications on login
 */
export function NotificationEngineProvider({ children, role }: NotificationEngineProviderProps) {
    const {
        notifications,
        pendingNotifications,
        unreadCount,
        criticalNotification,
        isLoading,
        acknowledgeNotification,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        fetchNotifications
    } = useNotificationEngine(role);

    return (
        <NotificationEngineContext.Provider
            value={{
                notifications,
                pendingNotifications,
                unreadCount,
                isLoading,
                markAsRead,
                markAllAsRead,
                dismissNotification,
                fetchNotifications
            }}
        >
            {children}

            {/* Critical notification modal - blocks screen */}
            <CriticalNotificationModal
                notification={criticalNotification}
                onAcknowledge={acknowledgeNotification}
            />
        </NotificationEngineContext.Provider>
    );
}
