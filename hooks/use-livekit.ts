"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Simplified LiveKit hook — TOKEN-ONLY.
 * This hook fetches a LiveKit JWT token for a given room.
 * The actual WebRTC connection is managed by <LiveKitRoom> in the CallModal.
 */
export function useLiveKit() {
    const [token, setToken] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const isConnectingRef = useRef(false);

    const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

    const connect = useCallback(async (room: string, username: string) => {
        if (isConnectingRef.current) {
            console.log("[LiveKit] Already fetching token, skipping...");
            return;
        }

        // If we already have a token for the SAME room, reuse it
        if (token && roomName === room) {
            console.log("[LiveKit] Reusing existing token for room:", room);
            return;
        }

        isConnectingRef.current = true;
        setIsConnecting(true);
        setError(null);

        try {
            console.log("[LiveKit] Fetching token for room:", room);
            const resp = await fetch(`/api/livekit/token?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`);
            const data = await resp.json();

            if (!resp.ok || data.error) {
                throw new Error(data.error || `Token fetch failed (${resp.status})`);
            }

            console.log("[LiveKit] Token acquired for room:", room);
            setToken(data.token);
            setRoomName(room);
        } catch (e: any) {
            console.error("[LiveKit] Token fetch failed:", e);
            setError(e);
            setToken(null);
            setRoomName(null);
            throw e;
        } finally {
            setIsConnecting(false);
            isConnectingRef.current = false;
        }
    }, [token, roomName]);

    const disconnect = useCallback(() => {
        console.log("[LiveKit] Clearing token and room state");
        setToken(null);
        setRoomName(null);
        setError(null);
    }, []);

    return {
        token,
        roomName,
        serverUrl,
        connect,
        disconnect,
        isConnecting,
        error,
    };
}
