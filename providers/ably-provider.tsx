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

        if (!globalAblyClient) {
            console.log("Initializing Singleton Ably Client...");
            globalAblyClient = new Ably.Realtime({
                authUrl: "/api/ably/auth",
                autoConnect: true,
                disconnectedRetryTimeout: 10000,
                suspendedRetryTimeout: 30000,
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
            else if (newState === "failed" || newState === "suspended") {
                // CIRCUIT BREAKER: If we hit failed/suspended, it often means key/network issues
                // We should stop trying to avoid the infinite loop error the user sees
                console.warn(`Ably connection ${newState}. Disabling real-time.`);

                // Explicitly close to stop internal retries
                ablyClient.close();
                globalAblyClient = null;

                setIsConfigured(false); // Disable for this session
                setClient(null);

                toast.error("Real-time unavailable. Detailed live updates disabled.", {
                    id: "ably-error",
                    duration: 5000
                });
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

    const content = (
        <AblyContext.Provider value={{ client, status, isOffline, isConfigured }}>
            {children}
        </AblyContext.Provider>
    );

    // Only wrap in Ably root provider when we have a real client
    // This prevents ChannelProvider and other hooks from crashing on an empty client
    if (isConfigured && client) {
        return (
            <RootAblyProvider client={client}>
                <ChannelProvider channelName="global">
                    {userId && <GlobalPresenceTracker userId={userId} />}
                    {content}
                </ChannelProvider>
            </RootAblyProvider>
        );
    }

    return content;
}

// Internal component to handle presence registration
function GlobalPresenceTracker({ userId }: { userId: string }) {
    // This joins the 'global' presence channel automatically
    const { updateStatus } = usePresence({ channelName: "global", data: { userId } });
    const supabase = useRef(createClient());

    // Optional: Synchronize Ably presence state to Supabase profiles occasionally 
    // for offline access, but we'll primarily trust the Ably state for 'Online' dots.
    useEffect(() => {
        const updatePrescenceInDB = async () => {
            await supabase.current
                .from("profiles")
                .update({
                    online_status: "online",
                    last_seen_at: new Date().toISOString()
                })
                .eq("id", userId);
        };

        updatePrescenceInDB();
        const interval = setInterval(updatePrescenceInDB, 60000); // 1-minute database heartbeat

        return () => {
            clearInterval(interval);
            // Best effort offline update
            supabase.current
                .from("profiles")
                .update({
                    online_status: "offline",
                    last_seen_at: new Date().toISOString()
                })
                .eq("id", userId);
        };
    }, [userId]);

    return null;
}

export const useAbly = () => useContext(AblyContext);
