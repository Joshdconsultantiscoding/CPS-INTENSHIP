"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Room, RoomEvent, VideoPresets } from "livekit-client";

export function useLiveKit() {
    const [room, setRoom] = useState<Room | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const isConnectingRef = useRef(false);
    const roomRef = useRef<Room | null>(null);

    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    const cleanup = useCallback(async () => {
        if (roomRef.current) {
            console.log("[LiveKit] Cleaning up room session:", roomRef.current.name);
            roomRef.current.removeAllListeners();
            try {
                await roomRef.current.disconnect();
            } catch (e) {
                console.warn("[LiveKit] Disconnect warning:", e);
            }
            roomRef.current = null;
        }
        setRoom(null);
        setToken(null);
    }, []);

    const connect = useCallback(async (roomName: string, username: string) => {
        if (isConnectingRef.current) {
            console.log("[LiveKit] Already connecting, skipping...");
            return roomRef.current;
        }

        // If we already have a room and it's THE SAME room, keep it
        if (roomRef.current && roomRef.current.name === roomName && roomRef.current.state === "connected") {
            return roomRef.current;
        }

        isConnectingRef.current = true;
        setIsConnecting(true);
        setError(null);

        try {
            await cleanup();

            if (!wsUrl) throw new Error("NEXT_PUBLIC_LIVEKIT_URL is missing");

            const resp = await fetch(`/api/livekit/token?room=${roomName}&username=${username}`);
            const data = await resp.json();
            if (data.error) throw new Error(data.error);

            console.log("[LiveKit] Joining room:", roomName);
            const newRoom = new Room({
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: {
                    resolution: VideoPresets.h720.resolution,
                },
                publishDefaults: {
                    dtx: true,
                    simulcast: true,
                },
                stopLocalTrackOnUnpublish: true,
                disconnectOnPageLeave: true,
            });

            // Set up listeners for deep debugging
            newRoom.on(RoomEvent.Disconnected, () => {
                console.log("[LiveKit] Room disconnected:", roomName);
                if (roomRef.current === newRoom) {
                    setRoom(null);
                    setToken(null);
                    roomRef.current = null;
                }
            });

            newRoom.on(RoomEvent.ParticipantConnected, (p) => {
                console.log("[LiveKit] Peer joined:", p.identity, "SID:", p.sid);
            });

            newRoom.on(RoomEvent.TrackSubscribed, (track, pub, p) => {
                console.log(`[LiveKit] Subscribed to ${pub.source} from ${p.identity}`);
            });

            await newRoom.connect(wsUrl, data.token);
            console.log("[LiveKit] Connection established for:", newRoom.localParticipant.identity);

            // Proactive sharing with a slight delay to ensure signaling is ready
            setTimeout(async () => {
                try {
                    if (newRoom.state === "connected" && newRoom.localParticipant) {
                        await newRoom.localParticipant.setMicrophoneEnabled(true);
                        console.log("[LiveKit] Local microphone enabled/published");
                    }
                } catch (e) {
                    console.warn("[LiveKit] Media publishing failed:", e);
                }
            }, 500);

            roomRef.current = newRoom;
            setRoom(newRoom);
            setToken(data.token);

            return newRoom;
        } catch (e: any) {
            console.error("[LiveKit] Failed to join room:", e);
            setError(e);
            await cleanup();
            throw e;
        } finally {
            setIsConnecting(false);
            isConnectingRef.current = false;
        }
    }, [wsUrl, cleanup]);

    const disconnect = useCallback(async () => {
        await cleanup();
    }, [cleanup]);

    useEffect(() => {
        return () => {
            if (roomRef.current) {
                roomRef.current.disconnect();
            }
        };
    }, []);

    return {
        room,
        token,
        connect,
        disconnect,
        isConnecting,
        error
    };
}
