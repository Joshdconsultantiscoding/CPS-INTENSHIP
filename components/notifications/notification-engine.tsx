"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useNotificationEngine } from "@/hooks/use-notification-engine";
import { CriticalNotificationModal } from "./critical-modal";
import { Notification } from "@/lib/notifications/notification-types";
import { WhatsNewModal } from "../updates/whats-new-modal";
import { PortalSettings } from "@/hooks/use-portal-settings";
import { Changelog } from "@/lib/changelog/changelog-types";

interface NotificationEngineContextType {
    notifications: Notification[];
    pendingNotifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    hasUnseenUpdates: boolean;
    settings: PortalSettings | null;
    isLoadingSettings: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    dismissNotification: (id: string) => void;
    fetchNotifications: () => Promise<void>;
    markVersionAsSeen: (version: string) => Promise<void>;
    latestChangelog: Changelog | null;
    setLatestVersion: (version: string) => void;
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
    serverLatestLog?: any;
    serverSettings?: PortalSettings;
}

/**
 * NotificationEngineProvider
 * Wraps the dashboard to provide real-time notification handling.
 * - Shows toasts for NORMAL/IMPORTANT notifications
 * - Shows fullscreen modal for CRITICAL notifications
 * - Handles retry logic for IMPORTANT notifications
 * - Recovers pending notifications on login
 * - Shows "What's New" modal for new versions
 */
export function NotificationEngineProvider({ children, role, serverLatestLog, serverSettings }: NotificationEngineProviderProps) {
    const {
        notifications,
        pendingNotifications,
        unreadCount,
        criticalNotification,
        isLoading,
        latestChangelog,
        showWhatsNew,
        hasUnseenUpdates,
        acknowledgeNotification,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        fetchNotifications,
        markVersionAsSeen,
        setLatestVersion
    } = useNotificationEngine(role, serverLatestLog);

    return (
        <NotificationEngineContext.Provider
            value={{
                notifications,
                pendingNotifications,
                unreadCount,
                isLoading,
                hasUnseenUpdates,
                settings: serverSettings || null,
                isLoadingSettings: false, // Settings are pre-loaded from server
                markAsRead,
                markAllAsRead,
                dismissNotification,
                fetchNotifications,
                markVersionAsSeen,
                latestChangelog: latestChangelog || null,
                setLatestVersion
            }}
        >
            {children}

            {/* Critical notification modal - blocks screen */}
            <CriticalNotificationModal
                notification={criticalNotification}
                onAcknowledge={acknowledgeNotification}
            />

            {/* What's New modal - show once after update */}
            {showWhatsNew && (
                <WhatsNewModal
                    changelog={latestChangelog}
                    onClose={markVersionAsSeen}
                />
            )}
        </NotificationEngineContext.Provider>
    );
}
