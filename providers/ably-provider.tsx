"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import * as Ably from "ably";
import { AblyProvider as RootAblyProvider, ChannelProvider, usePresence } from "ably/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// Module-level singleton to prevent multiple connections during HMR/React re-renders
let globalAblyClient: Ably.Realtime | null = null;
let ablyConfigured: boolean | null = null;

const AblyContext = createContext<{
    client: Ably.Realtime | null;
    status: string;
    isOffline: boolean;
    isConfigured: boolean;
}>({ client: null, status: "initialized", isOffline: false, isConfigured: true });

// Presence data map: userId -> { status: 'online' | 'idle' }
const PresenceDataContext = createContext<Map<string, { status: string }>>(new Map());
export const usePresenceData = () => useContext(PresenceDataContext);

// NEW: Global online users context for real-time presence tracking
const OnlineUsersContext = createContext<Set<string>>(new Set());
export const useOnlineUsers = () => useContext(OnlineUsersContext);

// NEW: Global user activity context (typing, recording)
export interface UserActivity {
    typing: Map<string, { targetUserId: string; timestamp: number }>;
    recording: Map<string, { targetUserId: string; timestamp: number }>;
}

const UserActivityContext = createContext<UserActivity>({
    typing: new Map(),
    recording: new Map()
});
export const useUserActivity = () => useContext(UserActivityContext);

// NEW: Unified Hook for checking if a user is online
// Strategies: 
// 1. Ably Presence (Fastest, <1s latency)
// 2. Database `last_active_at` (Fallback, ~1 min latency)
export function useUnifiedPresence(users: any[]) {
    // We already have the set of online user IDs from Ably
    const onlineAblyUsers = useOnlineUsers();
    const presenceData = usePresenceData();

    // Helper to check status — returns 'online' | 'idle' | 'offline'
    const getStatus = useCallback((userId: string) => {
        // 1. Check Ably Realtime Presence (Primary)
        if (onlineAblyUsers.has(userId)) {
            const data = presenceData.get(userId);
            if (data?.status === "idle") return "idle";
            return "online";
        }

        // 2. Check Database Fallback (Secondary)
        const user = users.find(u => u.id === userId);
        if (user?.last_active_at) {
            const lastActive = new Date(user.last_active_at).getTime();
            const now = Date.now();
            if (now - lastActive < 120000) return "online";
        }

        return "offline";
    }, [onlineAblyUsers, presenceData, users]);

    return { getStatus };
}

interface AblyClientProviderProps {
    children: React.ReactNode;
    userId?: string;
}

export function AblyClientProvider({ children, userId }: AblyClientProviderProps) {
    const [client, setClient] = useState<Ably.Realtime | null>(globalAblyClient);
    const [status, setStatus] = useState<string>(globalAblyClient?.connection.state || "initialized");
    const [isOffline, setIsOffline] = useState<boolean>(false);
    const [isConfigured, setIsConfigured] = useState<boolean>(ablyConfigured ?? true);

    // Exponential backoff state
    const reconnectAttempts = useRef(0);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const hasShownOfflineToast = useRef(false);

    // Calculate backoff delay with jitter
    const getBackoffDelay = useCallback((attempt: number) => {
        const baseDelay = 5000; // 5 seconds
        const maxDelay = 120000; // 2 minutes max
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        // Add jitter (±25%)
        return delay + (Math.random() - 0.5) * delay * 0.5;
    }, []);

    // Network status detection
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => {
            console.log("Network: Online");
            setIsOffline(false);
            hasShownOfflineToast.current = false;
            reconnectAttempts.current = 0;

            // Trigger immediate reconnect
            if (globalAblyClient && globalAblyClient.connection.state !== 'connected') {
                globalAblyClient.connect();
            }
        };

        const handleOffline = () => {
            console.log("Network: Offline");
            setIsOffline(true);

            // Show offline toast ONCE
            if (!hasShownOfflineToast.current) {
                toast.warning("You're offline. Messages will sync when reconnected.", {
                    id: "offline-status",
                    duration: Infinity,
                });
                hasShownOfflineToast.current = true;
            }
        };

        // Initial check
        if (!navigator.onLine) {
            handleOffline();
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Check if Ably is configured before initializing
    // Check if Ably is configured before initializing
    useEffect(() => {
        // If we already know the status, don't check again
        if (ablyConfigured !== null) {
            setIsConfigured(ablyConfigured);
            return;
        }

        const checkAblyStatus = async () => {
            try {
                const response = await fetch('/api/ably/auth', { method: 'GET' });

                if (response.status === 503) {
                    const data = await response.json();
                    if (data.code === 'ABLY_NOT_CONFIGURED') {
                        console.warn("Ably is not configured - real-time features disabled");
                        ablyConfigured = false;
                        setIsConfigured(false);
                        return;
                    }
                }

                if (!response.ok) {
                    // Start cautious, assume not configured if we get auth errors or 500s 
                    // to prevent notification spam
                    console.warn(`Ably check failed with status ${response.status}`);
                    ablyConfigured = false;
                    setIsConfigured(false);
                    return;
                }

                // If we get here, we got a 200 OK or similar valid response
                ablyConfigured = true;
                setIsConfigured(true);
            } catch (error) {
                // Config check failing usually means network down or similar
                // We'll defaults to false to be safe and avoid retry loops
                console.warn("Could not verify Ably status:", error);
                ablyConfigured = false;
                setIsConfigured(false);
            }
        };

        checkAblyStatus();
    }, []);

    useEffect(() => {
        // Don't initialize if offline or not configured or if we hit a circuit break
        if (isOffline || !isConfigured) {
            return;
        }

        // Initialize or recover client
        if (!globalAblyClient || ['closed', 'failed'].includes(globalAblyClient.connection.state)) {
            console.log("Initializing (or Recovering) Ably Client...");
            globalAblyClient = new Ably.Realtime({
                authUrl: "/api/ably/auth",
                autoConnect: true,
                disconnectedRetryTimeout: 15000,
                suspendedRetryTimeout: 30000,
                channelRetryTimeout: 15000,
                closeOnUnload: false, // Handle manually to prevent premature closure
            });
        }

        const ablyClient = globalAblyClient;
        setClient(ablyClient);

        // Connection State Handlers with exponential backoff
        const onStateChange = (stateChange: Ably.ConnectionStateChange) => {
            const newState = stateChange.current;
            setStatus(newState);
            console.log(`Ably Connection State: ${newState}`);

            // Clear any pending reconnect timers
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
                reconnectTimer.current = null;
            }

            if (newState === "connected") {
                reconnectAttempts.current = 0;
                hasShownOfflineToast.current = false;
                toast.dismiss("offline-status");
                toast.dismiss("ably-connecting");
                toast.dismiss("ably-error");

                if (stateChange.previous === "disconnected" || stateChange.previous === "suspended") {
                    toast.success("Real-time sync restored", { duration: 2000 });
                }
            }
            else if (newState === "failed" || newState === "closed") {
                console.error("Ably connection FATAL failure or closed.");
                setIsConfigured(false);
                setClient(null);
                globalAblyClient = null; // Allow recreation on next cycle

                // Only show error for failure, not intentional close
                if (newState === "failed") {
                    toast.error("Real-time service failed. Using fallback polling.");
                }
            }
            else if (newState === "suspended") {
                // Connection suspended - Ably will auto-retry in background
                // This is common on restricted networks, don't spam the user
                console.warn("Ably connection suspended - falling back to polling");

                // After 3 failed attempts, disable Ably gracefully to prevent further errors
                reconnectAttempts.current++;
                if (reconnectAttempts.current > 3) {
                    console.warn("Ably suspended too many times - disabling real-time");
                    ablyConfigured = false;
                    setIsConfigured(false);
                    setClient(null);

                    // Close the client to prevent further connection attempts
                    if (globalAblyClient) {
                        globalAblyClient.close();
                        globalAblyClient = null;
                    }
                }
            }
            else if (newState === "disconnected") {
                // Normal disconnect - Ably will auto-reconnect
                // Don't show errors for temporary disconnects
                console.log("Ably disconnected - will auto-reconnect");
            }
        };

        ablyClient.connection.on(onStateChange);

        // Global Broadcast Channel
        let globalChannel: Ably.RealtimeChannel | null = null;
        let userChannel: Ably.RealtimeChannel | null = null;

        try {
            globalChannel = ablyClient.channels.get("announcements:global");
            globalChannel.subscribe("announcement", (message) => {
                toast.info(message.data.title || "Announcement", {
                    description: message.data.content,
                });
            });

            if (userId) {
                userChannel = ablyClient.channels.get(`user-notifications:${userId}`);
                userChannel.subscribe("alert", (message) => {
                    toast(message.data.title || "New Notification", {
                        description: message.data.content,
                    });
                });
            }
        } catch (e) {
            console.warn("Channel subscription failed:", e);
        }

        return () => {
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
            }
            ablyClient.connection.off(onStateChange);
            if (globalChannel) globalChannel.unsubscribe();
            if (userChannel) userChannel.unsubscribe();
            // Note: We intentionally DO NOT close the singleton client here on unmount
            // to allow it to persist during navigation, reducing reconnects.
        };
    }, [userId, isOffline, isConfigured, getBackoffDelay]);

    // NEW: State for online users
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // NEW: State for presence data (online/idle per user)
    const [presenceData, setPresenceData] = useState<Map<string, { status: string }>>(new Map());

    // NEW: State for user activity
    const [userActivity, setUserActivity] = useState<UserActivity>({
        typing: new Map(),
        recording: new Map()
    });

    // Clean up expired Ably presence if network glitched
    useEffect(() => {
        const interval = setInterval(() => {
            // Optional: If we wanted to expire visually stuck users, we could do it here
            // But Ably's usePresence usually handles this well.
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const content = (
        <AblyContext.Provider value={{ client, status, isOffline, isConfigured }}>
            <OnlineUsersContext.Provider value={onlineUsers}>
                <PresenceDataContext.Provider value={presenceData}>
                    <UserActivityContext.Provider value={userActivity}>
                        {children}
                    </UserActivityContext.Provider>
                </PresenceDataContext.Provider>
            </OnlineUsersContext.Provider>
        </AblyContext.Provider>
    );

    // Only wrap in Ably root provider when we have a real client
    // This prevents ChannelProvider and other hooks from crashing on an empty client
    if (isConfigured && client) {
        return (
            <RootAblyProvider client={client}>
                <ChannelProvider channelName="global">
                    {userId && (
                        <>
                            <GlobalPresenceTracker userId={userId} onOnlineUsersChange={setOnlineUsers} onPresenceDataChange={setPresenceData} />
                            <GlobalActivityTracker userId={userId} onActivityChange={setUserActivity} />
                        </>
                    )}
                    {content}
                </ChannelProvider>
            </RootAblyProvider>
        );
    }

    return content;
}

// Internal component to handle presence registration
function GlobalPresenceTracker({ userId, onOnlineUsersChange, onPresenceDataChange }: {
    userId: string;
    onOnlineUsersChange: (users: Set<string>) => void;
    onPresenceDataChange: (data: Map<string, { status: string }>) => void;
}) {
    const { client } = useAbly();
    // Use manual presence management to avoid hook version mismatches
    useEffect(() => {
        if (!client) return;

        const channel = client.channels.get("global");
        let retryTimer: NodeJS.Timeout | null = null;
        let isMounted = true;

        const updateOnlineUsers = async () => {
            if (!isMounted) return;
            try {
                const members = await channel.presence.get();
                if (!isMounted) return;
                const onlineSet = new Set<string>();
                const dataMap = new Map<string, { status: string }>();
                members.forEach((member) => {
                    const memberId = member.data?.userId || member.clientId;
                    if (memberId) {
                        onlineSet.add(memberId);
                        dataMap.set(memberId, { status: member.data?.status || "online" });
                    }
                });
                onOnlineUsersChange(onlineSet);
                onPresenceDataChange(dataMap);
            } catch (e) {
                console.warn("Failed to fetch presence:", e);
            }
        };

        const enterPresence = async (attempt = 1) => {
            if (!isMounted) return;
            try {
                // Wait for channel to be attached before entering? 
                // Ably handles this, but if we time out, we retry.
                await channel.presence.enter({ userId, status: "online" });
            } catch (err: any) {
                if (!isMounted) return;
                console.warn(`Presence enter failed (attempt ${attempt}):`, err);
                if (attempt < 3) {
                    retryTimer = setTimeout(() => enterPresence(attempt + 1), 2000 * attempt);
                }
            }
        };

        // 1. Subscribe to updates
        channel.presence.subscribe(() => {
            updateOnlineUsers();
        }).then(() => {
            // Only enter presence after subscription is active (optimization)
            enterPresence();
        }).catch(err => {
            console.warn("Presence subscription failed, trying to enter anyway:", err);
            enterPresence();
        });

        // 2. Initial fetch
        updateOnlineUsers();

        return () => {
            isMounted = false;
            if (retryTimer) clearTimeout(retryTimer);
            channel.presence.leave().catch(() => { }); // Best effort leave
            channel.presence.unsubscribe();
        };
    }, [client, userId, onOnlineUsersChange, onPresenceDataChange]);
    const supabase = useRef(createClient());
    const lastSeenUpdateRef = useRef<string | null>(null);



    // Database heartbeat for fallback and last_seen tracking
    useEffect(() => {
        const updatePresenceInDB = async () => {
            const now = new Date().toISOString();
            lastSeenUpdateRef.current = now;
            await supabase.current
                .from("profiles")
                .update({
                    online_status: "online",
                    last_seen_at: now
                })
                .eq("id", userId);
        };

        const setOfflineInDB = () => {
            const now = new Date().toISOString();
            // Use sendBeacon for guaranteed delivery on page close
            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                const data = JSON.stringify({
                    userId,
                    online_status: "offline",
                    last_seen_at: now
                });
                navigator.sendBeacon('/api/presence/offline', data);
            } else {
                // Fallback for older browsers
                supabase.current
                    .from("profiles")
                    .update({
                        online_status: "offline",
                        last_seen_at: now
                    })
                    .eq("id", userId);
            }
        };

        updatePresenceInDB();
        const interval = setInterval(updatePresenceInDB, 15000); // 15s heartbeat

        // CRITICAL: Handle browser close/refresh with beforeunload
        const handleBeforeUnload = () => {
            setOfflineInDB();
        };

        // Handle visibility change (tab switch → idle, tab focus → online)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Tab focused: mark online in DB + update Ably presence
                updatePresenceInDB();
                if (client) {
                    const ch = client.channels.get("global");
                    ch.presence.update({ userId, status: "online" }).catch(() => { });
                }
            } else {
                // Tab hidden: mark idle in DB + update Ably presence
                const now = new Date().toISOString();
                supabase.current
                    .from("profiles")
                    .update({ online_status: "idle", last_seen_at: now })
                    .eq("id", userId)
                    .then(() => { });
                if (client) {
                    const ch = client.channels.get("global");
                    ch.presence.update({ userId, status: "idle" }).catch(() => { });
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Best effort cleanup on unmount (HMR, navigation, etc.)
            setOfflineInDB();
        };
    }, [userId]);

    return null;
}

// NEW: Tracker for global activity (typing, recording)
function GlobalActivityTracker({ userId, onActivityChange }: { userId: string; onActivityChange: React.Dispatch<React.SetStateAction<UserActivity>> }) {
    const { client } = useAbly();

    useEffect(() => {
        if (!client) return;

        const channel = client.channels.get("global-activity");

        // Maps to store activity state
        const typingMap = new Map<string, { targetUserId: string; timestamp: number }>();
        const recordingMap = new Map<string, { targetUserId: string; timestamp: number }>();

        const cleanupExpired = () => {
            const now = Date.now();
            let changed = false;

            // Cleanup typing (expires after 3s)
            for (const [uid, data] of typingMap.entries()) {
                if (now - data.timestamp > 3000) {
                    typingMap.delete(uid);
                    changed = true;
                }
            }

            // Cleanup recording (expires after 30s if no update)
            for (const [uid, data] of recordingMap.entries()) {
                if (now - data.timestamp > 30000) {
                    recordingMap.delete(uid);
                    changed = true;
                }
            }

            if (changed) {
                onActivityChange({
                    typing: new Map(typingMap),
                    recording: new Map(recordingMap)
                });
            }
        };

        const handleMessage = (msg: Ably.Message) => {
            const { userId: senderId, targetUserId, isTyping, isRecording } = msg.data;
            if (senderId === userId) return; // Ignore self

            const now = Date.now();
            let changed = false;

            if (msg.name === "typing") {
                if (isTyping) {
                    typingMap.set(senderId, { targetUserId, timestamp: now });
                } else {
                    typingMap.delete(senderId);
                }
                changed = true;
            } else if (msg.name === "recording") {
                if (isRecording) {
                    recordingMap.set(senderId, { targetUserId, timestamp: now });
                    // Also clear typing if recording starts
                    if (typingMap.has(senderId)) {
                        typingMap.delete(senderId);
                    }
                } else {
                    recordingMap.delete(senderId);
                }
                changed = true;
            }

            if (changed) {
                onActivityChange({
                    typing: new Map(typingMap),
                    recording: new Map(recordingMap)
                });
            }
        };

        channel.subscribe(handleMessage);
        const interval = setInterval(cleanupExpired, 1000);

        return () => {
            channel.unsubscribe();
            clearInterval(interval);
        };
    }, [client, userId, onActivityChange]);

    return null;
}

export const useAbly = () => useContext(AblyContext);
