"use client";

import React, { useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

const RINGTONE_URI = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU";

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    caller: {
        name: string;
        avatar_url: string | null;
    } | null;
    isVideo: boolean;
    isIncoming?: boolean;
    localStream?: MediaStream | null;
    remoteStream?: MediaStream | null;
    onAnswer?: () => void;
    onEnd?: () => void;
    onToggleMic?: (muted: boolean) => void;
    onToggleVideo?: (videoEnabled: boolean) => void;
}

export function CallModal({
    isOpen,
    onClose,
    caller,
    isVideo,
    isIncoming = false,
    localStream,
    remoteStream,
    onAnswer,
    onEnd,
    onToggleMic,
    onToggleVideo,
}: CallModalProps) {
    const [status, setStatus] = React.useState<"calling" | "ringing" | "connected" | "ended">("calling");
    const [duration, setDuration] = React.useState(0);
    const [isMuted, setIsMuted] = React.useState(false);
    const [isVideoOff, setIsVideoOff] = React.useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStatus(isIncoming ? "ringing" : "calling");
        }
    }, [isOpen, isIncoming]);

    // Connect streams to video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isOpen]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            if (status !== "connected") setStatus("connected"); // Auto-switch to connected if remote stream flows
        }
    }, [remoteStream, isOpen]);

    // Ringtone logic
    useEffect(() => {
        if (status === "ringing" || (status === "calling" && !remoteStream)) {
            if (!audioRef.current) {
                audioRef.current = new Audio(RINGTONE_URI);
                audioRef.current.loop = true;
            }
            audioRef.current.play().catch(() => { });
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        }
        return () => {
            if (audioRef.current) audioRef.current.pause();
        };
    }, [status, remoteStream]);

    // Timer
    useEffect(() => {
        if (status === "connected") {
            timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [status]);

    const handleAnswer = () => {
        setStatus("connected");
        onAnswer?.();
    };

    const handleEnd = () => {
        onEnd?.();
        onClose();
    };

    const formatDuration = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}:${s.toString().padStart(2, "0")}`;
    };

    if (!caller) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleEnd()}>
            <DialogContent className="sm:max-w-4xl bg-slate-950 text-white border-slate-800 p-0 overflow-hidden h-[80vh] flex flex-col">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent">
                    <DialogTitle className="text-center text-lg font-semibold drop-shadow-md">
                        {status === "ringing" ? "Incoming Call..." :
                            status === "calling" ? "Calling..." :
                                formatDuration(duration)}
                    </DialogTitle>
                    <p className="text-center text-sm text-slate-200 drop-shadow-md">{caller.name}</p>
                </div>

                {/* Main View Area */}
                <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
                    {/* Remote Stream (Main) */}
                    {remoteStream ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center animate-pulse">
                            <Avatar className="h-24 w-24 mb-4 border-4 border-slate-700">
                                <AvatarImage src={caller.avatar_url || ""} />
                                <AvatarFallback>{caller.name[0]}</AvatarFallback>
                            </Avatar>
                            <p className="text-slate-400">Waiting for connection...</p>
                        </div>
                    )}

                    {/* Local Stream (PIP) */}
                    {localStream && (
                        <div className="absolute bottom-24 right-4 w-32 h-48 bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700 z-10 transition-all hover:w-48 hover:h-64">
                            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-6 bg-slate-950/90 backdrop-blur flex justify-center gap-8 items-center z-20">
                    {status === "ringing" ? (
                        <>
                            <Button size="lg" variant="destructive" className="h-14 w-14 rounded-full" onClick={handleEnd}>
                                <PhoneOff className="h-6 w-6" />
                            </Button>
                            <Button size="lg" className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600" onClick={handleAnswer}>
                                <Phone className="h-6 w-6" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant={isMuted ? "secondary" : "outline"} size="icon" className="h-12 w-12 rounded-full"
                                onClick={() => { setIsMuted(!isMuted); onToggleMic?.(!isMuted); }}>
                                {isMuted ? <MicOff /> : <Mic />}
                            </Button>
                            <Button size="lg" variant="destructive" className="h-16 w-16 rounded-full" onClick={handleEnd}>
                                <PhoneOff className="h-8 w-8" />
                            </Button>
                            {isVideo && (
                                <Button variant={isVideoOff ? "secondary" : "outline"} size="icon" className="h-12 w-12 rounded-full"
                                    onClick={() => { setIsVideoOff(!isVideoOff); onToggleVideo?.(!isVideoOff); }}>
                                    {isVideoOff ? <VideoOff /> : <Video />}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
