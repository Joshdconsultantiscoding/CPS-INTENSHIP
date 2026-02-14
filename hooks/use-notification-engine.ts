"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAbly } from "@/providers/ably-provider";
import { useAuth } from "@clerk/nextjs";
import { Notification, PriorityLevel, PRIORITY_SOUNDS } from "@/lib/notifications/notification-types";
import { toast } from "sonner";
import { Changelog } from "@/lib/changelog/changelog-types";
import { Profile } from "@/lib/types";

interface NotificationEngineState {
    notifications: Notification[];
    pendingNotifications: Notification[];
    criticalNotification: Notification | null;
    isLoading: boolean;
    unreadCount: number;
    latestChangelog: Changelog | null;
    showWhatsNew: boolean;
    hasUnseenUpdates: boolean;
}

interface UseNotificationEngineReturn extends NotificationEngineState {
    acknowledgeNotification: (id: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    dismissNotification: (id: string) => void;
    fetchNotifications: () => Promise<void>;
    markVersionAsSeen: (version: string) => Promise<void>;
    setLatestVersion: (version: string) => void;
}

// Audio refs for sounds
const audioCache: Record<string, HTMLAudioElement> = {};

// Track if sound is blocked to play on first interaction
let soundBlocked = false;
let queuedSound: { name: string; loop: boolean } | null = null;

function playSound(soundName: string, loop = false) {
    if (typeof window === "undefined") return null;

    const soundPath = `/sounds/${soundName}.mp3`;
    // Reduced logging for performance

    if (!audioCache[soundPath]) {
        console.log(`[NotificationEngine] Creating new Audio object for: ${soundName}`);
        audioCache[soundPath] = new Audio(soundPath);
        audioCache[soundPath].load();
    }

    const audio = audioCache[soundPath];
    audio.loop = loop;
    audio.currentTime = 0;

    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log(`[NotificationEngine] Successfully playing: ${soundName}`);
        }).catch((err) => {
            console.warn(`[NotificationEngine] Playback blocked by browser policy: ${err.name}`);

            // If blocked by autoplay, queue it for first interaction
            if (err.name === 'NotAllowedError' || err.name === 'NotSupportedError') {
                soundBlocked = true;
                queuedSound = { name: soundName, loop };
                console.log(`[NotificationEngine] Queued "${soundName}" to play on next user interaction.`);

                // Add one-time listener for interaction
                const handleInteraction = () => {
                    if (queuedSound) {
                        console.log(`[NotificationEngine] User interaction detected. Attempting to play queued sound: ${queuedSound.name}`);
                        const qSoundPath = `/sounds/${queuedSound.name}.mp3`;
                        const qAudio = audioCache[qSoundPath];
                        if (qAudio) {
                            qAudio.play()
                                .then(() => console.log(`[NotificationEngine] Queued sound "${queuedSound?.name}" played successfully.`))
                                .catch(e => console.error(`[NotificationEngine] Failed to play queued sound even after interaction:`, e));
                        }
                        queuedSound = null;
                        soundBlocked = false;
                    }
                    window.removeEventListener('click', handleInteraction);
                    window.removeEventListener('keydown', handleInteraction);
                    window.removeEventListener('mousedown', handleInteraction);
                    window.removeEventListener('touchstart', handleInteraction);
                };

                window.addEventListener('click', handleInteraction, { once: true });
                window.addEventListener('keydown', handleInteraction, { once: true });
                window.addEventListener('mousedown', handleInteraction, { once: true });
                window.addEventListener('touchstart', handleInteraction, { once: true });
            }
        });
    }

    return audio;
}

function stopSound(soundName: string) {
    const soundPath = `/sounds/${soundName}.mp3`;
    const audio = audioCache[soundPath];
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;
    }
}

export function useNotificationEngine(role?: string, serverLatestLog?: Changelog | null): UseNotificationEngineReturn {
    const { userId, isSignedIn } = useAuth();
    const { client: ably, isConfigured } = useAbly();

    const [state, setState] = useState<NotificationEngineState>(({
        notifications: [],
        pendingNotifications: [],
        criticalNotification: null,
        isLoading: true,
        unreadCount: 0,
        latestChangelog: serverLatestLog || null,
        showWhatsNew: false,
        hasUnseenUpdates: false
    }));

    const retryTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const alarmAudio = useRef<HTMLAudioElement | null>(null);
    const locallyAcknowledgedIds = useRef<Set<string>>(new Set());

    // Process a notification based on priority level
    const processNotification = useCallback((notification: Notification, silent = false) => {
        // Skip if we already acknowledged this locally in this session
        if (locallyAcknowledgedIds.current.has(notification.id)) {
            console.log("[NotificationEngine] Skipping locally acknowledged notification:", notification.id);
            return;
        }

        const level = notification.priority_level || "NORMAL";

        switch (level) {
            case "CRITICAL":
                // Show fullscreen modal, play alarm
                setState(prev => ({ ...prev, criticalNotification: notification }));
                if (!silent) alarmAudio.current = playSound(notification.sound || PRIORITY_SOUNDS.CRITICAL, true);
                break;

            case "IMPORTANT":
                // Show yellow toast, start retry timer
                toast.warning(notification.title, {
                    description: notification.message,
                    duration: 10000,
                    action: notification.link ? {
                        label: "View",
                        onClick: () => window.location.href = notification.link!
                    } : undefined
                });
                if (!silent) playSound(notification.sound || PRIORITY_SOUNDS.IMPORTANT);

                // Start retry timer if configured
                if (notification.repeat_interval > 0 && notification.repeat_count < notification.max_repeats) {
                    const timerId = setTimeout(() => {
                        retryNotification(notification);
                    }, notification.repeat_interval * 60 * 1000);

                    retryTimers.current.set(notification.id, timerId);
                }
                break;

            case "NORMAL":
            default:
                // Show blue toast once
                toast.info(notification.title, {
                    description: notification.message,
                    duration: 5000,
                    action: notification.link ? {
                        label: "View",
                        onClick: () => window.location.href = notification.link!
                    } : undefined
                });
                if (!silent) playSound(notification.sound || PRIORITY_SOUNDS.NORMAL);
                break;
        }

        // If it's a changelog push, update latest version AND show modal to everyone
        if (notification.metadata?.type === 'changelog_push' && notification.metadata?.version) {
            if (!silent) playSound('success');

            setState(prev => ({
                ...prev,
                showWhatsNew: true,
                hasUnseenUpdates: true,
                latestChangelog: {
                    ...(prev.latestChangelog || {}),
                    version: notification.metadata.version,
                    title: notification.title,
                    description: notification.message,
                } as any
            }));
        }

        // Add to pending list
        setState(prev => {
            const updatedPending = [notification, ...prev.pendingNotifications.filter(n => n.id !== notification.id)];
            const updatedAll = [notification, ...prev.notifications.filter(n => n.id !== notification.id)];
            return {
                ...prev,
                pendingNotifications: updatedPending,
                notifications: updatedAll,
                unreadCount: updatedAll.filter(n => !n.is_read).length
            };
        });
    }, []);

    // Process status updates (e.g. marking as acknowledged from another session or admin)
    const processStatusUpdate = useCallback((update: { id: string, acknowledged?: boolean, is_read?: boolean }) => {
        setState(prev => {
            // If the current critical notification is the one being acknowledged/read, clear it
            const isCriticalAffected = prev.criticalNotification?.id === update.id && (update.acknowledged || update.is_read);

            const updatedAll = prev.notifications.map(n =>
                n.id === update.id
                    ? { ...n, ...(update.acknowledged !== undefined ? { acknowledged: update.acknowledged } : {}), ...(update.is_read !== undefined ? { is_read: update.is_read } : {}) }
                    : n
            );

            return {
                ...prev,
                criticalNotification: isCriticalAffected ? null : prev.criticalNotification,
                notifications: updatedAll,
                unreadCount: updatedAll.filter(n => !n.is_read).length,
                pendingNotifications: (update.acknowledged || update.is_read)
                    ? prev.pendingNotifications.filter(n => n.id !== update.id)
                    : prev.pendingNotifications
            };
        });

        // Stop sound if it was the critical one
        if (update.acknowledged || update.is_read) {
            if (state.criticalNotification?.id === update.id && alarmAudio.current) {
                alarmAudio.current.pause();
                alarmAudio.current.currentTime = 0;
            }
        }
    }, [state.criticalNotification]);

    // Fetch all notifications
    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            const roleParam = role ? `&role=${role}` : "";
            const res = await fetch(`/api/notifications?userId=${userId}${roleParam}`);
            if (res.ok) {
                const data = await res.json();
                setState(prev => ({
                    ...prev,
                    notifications: data,
                    unreadCount: (data as Notification[]).filter(n => !n.is_read).length
                }));
            }
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        }
    }, [userId]);

    // Retry an IMPORTANT notification
    const retryNotification = useCallback(async (notification: Notification) => {
        // Increment repeat count on server
        try {
            await fetch("/api/notifications/retry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: notification.id })
            });
        } catch (e) {
            console.warn("Failed to increment retry count:", e);
        }

        // Show notification again
        toast.warning(`🔔 ${notification.title}`, {
            description: notification.message,
            duration: 10000
        });
        playSound(PRIORITY_SOUNDS.IMPORTANT);

        // Schedule next retry if not maxed out
        const newCount = notification.repeat_count + 1;
        if (newCount < notification.max_repeats) {
            const timerId = setTimeout(() => {
                retryNotification({ ...notification, repeat_count: newCount });
            }, notification.repeat_interval * 60 * 1000);

            retryTimers.current.set(notification.id, timerId);
        }
    }, []);

    // Acknowledge CRITICAL notification
    const acknowledgeNotification = useCallback(async (notificationId: string) => {
        console.log("[NotificationEngine] USER ACKNOWLEDGING UI:", notificationId);

        // 1. Instantly update local trackers
        locallyAcknowledgedIds.current.add(notificationId);

        // 2. STOP AUDIO 
        if (alarmAudio.current) {
            alarmAudio.current.pause();
            alarmAudio.current.currentTime = 0;
            alarmAudio.current = null;
        }

        // 3. Optimistically clear critical state to unblock UI immediately
        setState(prev => ({
            ...prev,
            criticalNotification: prev.criticalNotification?.id === notificationId ? null : prev.criticalNotification,
            pendingNotifications: prev.pendingNotifications.filter(n => n.id !== notificationId),
            notifications: prev.notifications.map(n => n.id === notificationId ? { ...n, acknowledged: true, is_read: true } : n)
        }));

        try {
            // 4. Background Server Update
            console.log("[NotificationEngine] Sending API acknowledge...");
            const res = await fetch("/api/notifications/acknowledge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId })
            });

            if (res.ok) {
                console.log("[NotificationEngine] API acknowledge SUCCESS");
            } else {
                console.warn("[NotificationEngine] API acknowledge non-ok result");
            }

            // 5. Check for current notification link AFTER API call (or before, but let's do it after for safety)
            const currentCritical = state.criticalNotification;
            if (currentCritical?.link) {
                console.log("[NotificationEngine] Redirecting to:", currentCritical.link);
                // Use setTimeout to ensure state updates have flushed
                setTimeout(() => {
                    window.location.href = currentCritical.link!;
                }, 100);
            }
        } catch (e) {
            console.error("Failed to acknowledge notification:", e);
        }
    }, [state.criticalNotification]);

    // Mark as read
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await fetch("/api/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId })
            });

            // Clear any retry timer
            const timer = retryTimers.current.get(notificationId);
            if (timer) {
                clearTimeout(timer);
                retryTimers.current.delete(notificationId);
            }

            setState(prev => {
                const updatedAll = prev.notifications.map(n => n.id === notificationId ? { ...n, is_read: true } : n);
                return {
                    ...prev,
                    notifications: updatedAll,
                    unreadCount: updatedAll.filter(n => !n.is_read).length,
                    pendingNotifications: prev.pendingNotifications.filter(n => n.id !== notificationId)
                };
            });
        } catch (e) {
            console.error("Failed to mark as read:", e);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        if (!userId) return;
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });

            setState(prev => ({
                ...prev,
                notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
                unreadCount: 0,
                pendingNotifications: []
            }));

            // Clear all retry timers
            retryTimers.current.forEach(timer => clearTimeout(timer));
            retryTimers.current.clear();
        } catch (e) {
            console.error("Failed to mark all as read:", e);
        }
    }, [userId]);

    // Dismiss notification (local only)
    const dismissNotification = useCallback((notificationId: string) => {
        setState(prev => ({
            ...prev,
            pendingNotifications: prev.pendingNotifications.filter(n => n.id !== notificationId)
        }));
    }, []);

    // Mark version as seen
    const markVersionAsSeen = useCallback(async (version: string) => {
        if (!userId) return;
        try {
            await fetch("/api/profiles/update-version", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, version })
            });

            setState(prev => ({ ...prev, showWhatsNew: false }));
        } catch (e) {
            console.warn("Failed to mark version as seen:", e);
        }
    }, [userId]);

    // Fetch pending notifications on login (offline recovery)
    useEffect(() => {
        if (!isSignedIn || !userId) return;

        const fetchPending = async () => {
            try {
                // Fetch full list AND pending in parallel
                const [fullRes, pendingRes] = await Promise.all([
                    fetch(`/api/notifications?userId=${userId}`),
                    fetch("/api/notifications/pending")
                ]);

                if (fullRes.ok) {
                    const data = await fullRes.json();
                    setState(prev => ({
                        ...prev,
                        notifications: data,
                        unreadCount: (data as Notification[]).filter(n => !n.is_read).length
                    }));
                }

                if (pendingRes.ok) {
                    const { notifications: pending } = await pendingRes.json();
                    if (pending && pending.length > 0) {
                        const sorted = [...pending].sort((a, b) => {
                            const score: Record<string, number> = { CRITICAL: 3, IMPORTANT: 2, NORMAL: 1 };
                            return (score[b.priority_level] || 0) - (score[a.priority_level] || 0);
                        });
                        sorted.forEach((n, index) => processNotification(n, index > 0));
                    }
                }

                // CHECK VERSION FROM PROFILE (Separate from recovery triggers)
                const profileRes = await fetch(`/api/profiles/current`);
                if (profileRes.ok) {
                    const profile = await profileRes.json();
                    // We only show it once per mount or if updated
                    if (state.latestChangelog && profile.last_seen_version !== state.latestChangelog.version) {
                        setState(prev => ({ ...prev, showWhatsNew: true, hasUnseenUpdates: true }));
                    }
                }
            } catch (e) {
                console.warn("[NotificationEngine] Background fetch failed:", e);
            } finally {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        fetchPending();
        // Removed state.latestChangelog from deps to avoid loop when changelog_push arrives
    }, [isSignedIn, userId]);

    // Subscribe to Ably channels for real-time notifications
    useEffect(() => {
        if (!ably || !isConfigured || !userId) return;

        const channels: any[] = [];

        try {
            // User-specific channel
            const userChannel = ably.channels.get(`notifications:${userId}`);

            userChannel.subscribe("notification", (msg: any) => {
                console.log("[NotificationEngine] Received user notification:", msg.data);
                processNotification(msg.data);
            });

            // Handle real-time dismissals/acknowledgments
            userChannel.subscribe("notification_update", (msg: any) => {
                console.log("[NotificationEngine] Received status update via Ably:", msg.data);
                processStatusUpdate(msg.data);
            });

            channels.push(userChannel);

            // Global broadcast channel
            const allChannel = ably.channels.get("notifications:all");
            allChannel.subscribe("notification", (msg: any) => {
                console.log("[NotificationEngine] Received global notification:", msg.data);
                processNotification(msg.data);
            });
            channels.push(allChannel);

            // Role-specific channel (e.g., notifications:interns)
            if (role) {
                const normalizedRole = role.toLowerCase() + "s"; // intern -> interns, admin -> admins
                const roleChannel = ably.channels.get(`notifications:${normalizedRole}`);
                roleChannel.subscribe("notification", (msg: any) => {
                    console.log(`[NotificationEngine] Received ${normalizedRole} notification:`, msg.data);
                    processNotification(msg.data);
                });
                channels.push(roleChannel);
            }

        } catch (e) {
            console.error("Failed to subscribe to notification channels:", e);
        }

        return () => {
            channels.forEach(ch => {
                try { ch.unsubscribe(); } catch (e) { }
            });

            // Clear all retry timers
            retryTimers.current.forEach(timer => clearTimeout(timer));
            retryTimers.current.clear();
        };
    }, [ably, isConfigured, userId, processNotification]);

    // Externally update latest version (for live preview in header)
    const setLatestVersion = useCallback((version: string) => {
        setState(prev => ({
            ...prev,
            latestChangelog: {
                ...(prev.latestChangelog || {}),
                version
            } as any
        }));
    }, []);

    return {
        ...state,
        acknowledgeNotification,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        fetchNotifications,
        markVersionAsSeen,
        setLatestVersion
    };
}
