"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
    ],
};

interface WebRTCState {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isCallActive: boolean;
    connectionState: RTCPeerConnectionState;
}

export function useWebRTC(currentUser: { id: string }) {
    const [state, setState] = useState<WebRTCState>({
        localStream: null,
        remoteStream: null,
        isCallActive: false,
        connectionState: "new",
    });

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const updateChannel = (channel: RealtimeChannel | null) => {
        channelRef.current = channel;
    };

    const createPeerConnection = useCallback(() => {
        if (peerConnection.current) return peerConnection.current;

        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && channelRef.current) {
                channelRef.current.send({
                    type: "broadcast",
                    event: "signal",
                    payload: { candidate: event.candidate },
                });
            }
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setState((prev) => ({ ...prev, remoteStream: event.streams[0] }));
            }
        };

        pc.onconnectionstatechange = () => {
            setState((prev) => ({ ...prev, connectionState: pc.connectionState }));
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                endCall();
            }
        };

        peerConnection.current = pc;
        return pc;
    }, []);

    const startLocalStream = async (video: boolean) => {
        try {
            if (localStreamRef.current) return localStreamRef.current;

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: video,
            });
            localStreamRef.current = stream;
            setState((prev) => ({ ...prev, localStream: stream }));
            return stream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            toast.error("Could not access camera/microphone");
            throw error;
        }
    };

    const startCall = async (video: boolean) => {
        const pc = createPeerConnection();
        const stream = await startLocalStream(video);

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (channelRef.current) {
            await channelRef.current.send({
                type: "broadcast",
                event: "signal",
                payload: { offer },
            });
        }

        setState((prev) => ({ ...prev, isCallActive: true }));
    };

    const answerCall = async (video: boolean, offer: RTCSessionDescriptionInit) => {
        const pc = createPeerConnection();
        const stream = await startLocalStream(video);

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (channelRef.current) {
            await channelRef.current.send({
                type: "broadcast",
                event: "signal",
                payload: { answer },
            });
        }

        setState((prev) => ({ ...prev, isCallActive: true }));
    };

    const handleSignal = async (payload: any) => {
        const pc = peerConnection.current;
        if (!pc) return;

        try {
            if (payload.offer) {
                // Offer is handled by calling answerCall, not here
            } else if (payload.answer) {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            } else if (payload.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
        } catch (e) {
            console.error("Signaling error:", e);
        }
    };

    const endCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setState({
            localStream: null,
            remoteStream: null,
            isCallActive: false,
            connectionState: "new",
        });
    };

    const toggleMic = (enabled: boolean) => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => track.enabled = enabled);
        }
    }

    const toggleVideo = (enabled: boolean) => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => track.enabled = enabled);
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => endCall();
    }, []);

    return {
        ...state,
        startCall,
        answerCall,
        endCall,
        handleSignal,
        updateChannel,
        toggleMic,
        toggleVideo
    };
}
