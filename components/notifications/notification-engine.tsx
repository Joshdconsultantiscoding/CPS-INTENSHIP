"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useNotificationEngine } from "@/hooks/use-notification-engine";
import { CriticalNotificationModal } from "./critical-modal";
import { Notification } from "@/lib/notifications/notification-types";

interface NotificationEngineContextType {
    pendingNotifications: Notification[];
    isLoading: boolean;
    markAsRead: (id: string) => Promise<void>;
    dismissNotification: (id: string) => void;
}

const NotificationEngineContext = createContext<NotificationEngineContextType | null>(null);

export function useNotificationEngineContext() {
    const context = useContext(NotificationEngineContext);
    if (!context) {
        throw new Error("useNotificationEngineContext must be used within NotificationEngineProvider");
    }
    return context;
}

interface NotificationEngineProviderProps {
    children: ReactNode;
}

/**
 * NotificationEngineProvider
 * Wraps the dashboard to provide real-time notification handling.
 * - Shows toasts for NORMAL/IMPORTANT notifications
 * - Shows fullscreen modal for CRITICAL notifications
 * - Handles retry logic for IMPORTANT notifications
 * - Recovers pending notifications on login
 */
export function NotificationEngineProvider({ children }: NotificationEngineProviderProps) {
    const {
        pendingNotifications,
        criticalNotification,
        isLoading,
        acknowledgeNotification,
        markAsRead,
        dismissNotification
    } = useNotificationEngine();

    return (
        <NotificationEngineContext.Provider
            value={{
                pendingNotifications,
                isLoading,
                markAsRead,
                dismissNotification
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
