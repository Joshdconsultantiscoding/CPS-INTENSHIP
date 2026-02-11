"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Video,
    VideoOff,
    Volume2,
    UserPlus,
    Grid3X3,
    ScreenShare,
    Loader2,
    MessageSquare,
    Clock,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useTracks,
    useConnectionState,
    useLocalParticipant,
    useParticipants,
    VideoTrack,
} from "@livekit/components-react";
import { ConnectionState, Track, Participant } from "livekit-client";
import { cn } from "@/lib/utils";

const INCOMING_RINGTONE_URI = "https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3";
const OUTGOING_RINGTONE_URI = "https://assets.mixkit.co/active_storage/sfx/1353/1353-preview.mp3";

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    caller: {
        id: string;
        name: string;
        avatar_url?: string;
    } | null;
    isIncoming?: boolean;
    isVideo?: boolean;
    token?: string | null;
    serverUrl?: string;
    onAnswer?: () => void;
    onEnd?: (duration: number, wasConnected: boolean) => void;
    onReject?: () => void;
    onMessage?: () => void;
}

export function CallModal({
    isOpen,
    onClose,
    caller,
    isIncoming = false,
    isVideo = false,
    token,
    serverUrl,
    onAnswer,
    onEnd,
    onReject,
    onMessage
}: CallModalProps) {
    // Simple status: ringing (incoming, no answer yet), connecting, connected, ended
    const [phase, setPhase] = useState<"ringing" | "connecting" | "connected" | "ended">("connecting");
    const [duration, setDuration] = useState(0);
    const [hasAnswered, setHasAnswered] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const durationRef = useRef(0);

    // Keep duration ref in sync
    useEffect(() => { durationRef.current = duration; }, [duration]);

    // Reset on open/close
    useEffect(() => {
        if (isOpen) {
            setPhase(isIncoming ? "ringing" : "connecting");
            setDuration(0);
            setHasAnswered(false);
            durationRef.current = 0;
        } else {
            setPhase("connecting");
            setDuration(0);
            setHasAnswered(false);
            stopAudio();
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isIncoming]);

    // --- Ringtone ---
    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const shouldPlayIncoming = phase === "ringing" && isIncoming;
        const shouldPlayOutgoing = phase === "connecting" && !isIncoming;

        if (shouldPlayIncoming || shouldPlayOutgoing) {
            const uri = isIncoming ? INCOMING_RINGTONE_URI : OUTGOING_RINGTONE_URI;

            // Don't restart if already playing the right audio
            if (audioRef.current && audioRef.current.src === uri && !audioRef.current.paused) return;

            stopAudio();
            const audio = new Audio(uri);
            audio.loop = true;
            audioRef.current = audio;
            audio.play().catch(e => {
                if (e.name !== "AbortError") console.warn("[CallModal] Ringtone play failed:", e);
            });
        } else {
            stopAudio();
        }

        return () => { stopAudio(); };
    }, [phase, isOpen, isIncoming, stopAudio]);

    // --- Call Timer ---
    useEffect(() => {
        if (phase === "connected") {
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase]);

    // --- Handlers ---
    const handleAnswer = useCallback(() => {
        stopAudio();
        setHasAnswered(true);
        setPhase("connecting");
        onAnswer?.();
    }, [onAnswer, stopAudio]);

    const handleEndCall = useCallback(() => {
        stopAudio();
        const wasConnected = phase === "connected";
        const finalDuration = durationRef.current;
        setPhase("ended");
        onEnd?.(finalDuration, wasConnected);
    }, [phase, onEnd, stopAudio]);

    const handleReject = useCallback(() => {
        stopAudio();
        setPhase("ended");
        onReject?.();
    }, [onReject, stopAudio]);

    const formatDuration = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!caller) return null;

    // Should we render LiveKitRoom? Only when we have a token and it's not the initial ringing phase
    const shouldConnectRoom = !!token && !!serverUrl && phase !== "ringing" && phase !== "ended";
    // For incoming calls: only connect after user has answered
    const shouldRenderLiveKit = isIncoming ? (shouldConnectRoom && hasAnswered) : shouldConnectRoom;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                if (phase === "ended") onClose();
                else if (phase !== "connected") handleEndCall();
            }
        }}>
            <DialogContent className="sm:max-w-4xl w-full h-full sm:h-[650px] p-0 border-0 bg-[#0b141a] text-white shadow-2xl sm:rounded-[32px] overflow-hidden flex flex-col transition-all duration-500">
                <VisuallyHidden>
                    <DialogTitle>Call with {caller.name}</DialogTitle>
                </VisuallyHidden>

                {/* 1. RINGING VIEW (Incoming, before answer) */}
                {phase === "ringing" && isIncoming && (
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        <RippleBackground />
                        <div className="z-10 flex flex-col items-center gap-8 mt-[-40px]">
                            <div className="relative">
                                <RippleCircles />
                                <Avatar className="h-32 w-32 sm:h-36 sm:w-36 border-4 border-[#1f2c33] shadow-2xl relative z-20">
                                    <AvatarImage src={caller.avatar_url || ""} />
                                    <AvatarFallback className="bg-[#1f2c33] text-5xl">{caller.name[0]}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-medium tracking-tight text-white">{caller.name}</h2>
                                <p className="text-[#00a884] text-sm font-semibold uppercase tracking-[0.2em] animate-pulse">
                                    {isVideo ? "Incoming Video Call" : "Incoming Voice Call"}
                                </p>
                            </div>
                            <div className="flex gap-12 sm:gap-20 mt-4 opacity-70">
                                <button className="flex flex-col items-center gap-2 group" onClick={onMessage}>
                                    <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                                        <MessageSquare className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider font-bold">Messages</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 group">
                                    <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider font-bold">Reminder</span>
                                </button>
                            </div>
                        </div>

                        <div className="absolute bottom-12 sm:bottom-16 inset-x-0 flex justify-center gap-12 sm:gap-16 z-20">
                            <Button
                                size="icon"
                                variant="destructive"
                                className="h-20 w-20 rounded-full shadow-2xl hover:scale-105 transition-transform"
                                onClick={handleReject}
                            >
                                <PhoneOff className="h-8 w-8 fill-white" />
                            </Button>
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#00a884] rounded-full animate-ping opacity-30" />
                                <Button
                                    size="icon"
                                    className="h-20 w-20 rounded-full bg-[#00a884] hover:bg-[#008f72] shadow-2xl relative z-10 hover:scale-105 transition-transform"
                                    onClick={handleAnswer}
                                >
                                    <Phone className="h-8 w-8 fill-white" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ACTIVE CALL (LiveKitRoom manages connection) */}
                {shouldRenderLiveKit && (
                    <LiveKitRoom
                        video={isVideo}
                        audio={true}
                        token={token!}
                        serverUrl={serverUrl}
                        onConnected={() => {
                            console.log("[CallModal] LiveKitRoom connected");
                        }}
                        onDisconnected={() => {
                            console.log("[CallModal] LiveKitRoom disconnected");
                            if (phase !== "ended") {
                                setPhase("ended");
                            }
                        }}
                        onError={(err) => {
                            console.error("[CallModal] LiveKitRoom error:", err);
                        }}
                        className="flex-1 relative flex flex-col"
                    >
                        <RoomAudioRenderer />
                        <ActiveCallContent
                            caller={caller}
                            isVideo={isVideo}
                            isIncoming={isIncoming}
                            phase={phase}
                            setPhase={setPhase}
                            duration={duration}
                            formatDuration={formatDuration}
                            onEnd={handleEndCall}
                        />
                    </LiveKitRoom>
                )}

                {/* 3. OUTGOING CALL OVERLAY (no token yet / connecting) */}
                {!shouldRenderLiveKit && phase === "connecting" && !isIncoming && (
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        <RippleBackground />
                        <div className="z-10 flex flex-col items-center gap-8 mt-[-40px]">
                            <div className="relative">
                                <RippleCircles />
                                <Avatar className="h-32 w-32 sm:h-36 sm:w-36 border-4 border-[#1f2c33] shadow-2xl relative z-20">
                                    <AvatarImage src={caller.avatar_url || ""} />
                                    <AvatarFallback className="bg-[#1f2c33] text-5xl">{caller.name[0]}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-medium tracking-tight text-white">{caller.name}</h2>
                                <p className="text-[#00a884] text-sm font-semibold uppercase tracking-[0.2em] animate-pulse">Calling</p>
                            </div>
                        </div>
                        <div className="absolute bottom-12 sm:bottom-16 inset-x-0 flex justify-center z-20">
                            <Button
                                size="icon"
                                variant="destructive"
                                className="h-20 w-20 rounded-full shadow-2xl hover:scale-105 transition-transform"
                                onClick={handleEndCall}
                            >
                                <PhoneOff className="h-8 w-8 fill-white" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* 4. ENDED STATE */}
                {phase === "ended" && (
                    <div className="flex-1 flex flex-col items-center justify-center relative bg-[#0b141a] animate-in fade-in duration-300">
                        <div className="z-10 flex flex-col items-center gap-8">
                            <Avatar className="h-28 w-28 border border-white/5 grayscale opacity-80">
                                <AvatarImage src={caller.avatar_url || ""} />
                                <AvatarFallback className="bg-slate-800 text-3xl">{caller.name[0]}</AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-medium text-slate-300">Call ended</h2>
                            {duration > 0 && (
                                <p className="text-sm text-slate-500">{formatDuration(duration)}</p>
                            )}
                            <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-4">
                                <Button
                                    className="flex flex-col h-24 gap-2 bg-[#1f2c33] hover:bg-[#2a3942] border border-white/5 rounded-xl transition-all"
                                    onClick={onMessage}
                                >
                                    <MessageSquare className="h-6 w-6 text-[#00a884]" />
                                    <span className="text-xs font-medium text-slate-300">Message</span>
                                </Button>
                                <Button
                                    className="flex flex-col h-24 gap-2 bg-[#1f2c33] hover:bg-[#2a3942] border border-white/5 rounded-xl transition-all"
                                    onClick={onClose}
                                >
                                    <Phone className="h-6 w-6 text-[#00a884]" />
                                    <span className="text-xs font-medium text-slate-300">Call Again</span>
                                </Button>
                            </div>
                        </div>
                        <Button variant="ghost" className="mt-8 text-slate-500 hover:text-white" onClick={onClose}>Dismiss</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ==========================================================
// ACTIVE CALL CONTENT (rendered inside LiveKitRoom context)
// ==========================================================
function ActiveCallContent({
    caller,
    isVideo,
    isIncoming,
    phase,
    setPhase,
    duration,
    formatDuration,
    onEnd,
}: {
    caller: { id: string; name: string; avatar_url?: string };
    isVideo: boolean;
    isIncoming: boolean;
    phase: string;
    setPhase: (p: "ringing" | "connecting" | "connected" | "ended") => void;
    duration: number;
    formatDuration: (s: number) => string;
    onEnd: () => void;
}) {
    const connectionState = useConnectionState();
    const participants = useParticipants();
    const remoteParticipants = participants.filter(p => !p.isLocal);

    // Drive phase from actual LiveKit connection state
    useEffect(() => {
        if (connectionState === ConnectionState.Connected) {
            // For outgoing calls: wait for remote participant before marking "connected"
            if (!isIncoming && remoteParticipants.length === 0) {
                // Stay in "connecting" until someone joins
                return;
            }
            if (phase !== "connected") {
                setPhase("connected");
            }
        }
    }, [connectionState, remoteParticipants.length, isIncoming, phase, setPhase]);

    // For outgoing: when remote participant joins, transition to connected
    useEffect(() => {
        if (!isIncoming && remoteParticipants.length > 0 && connectionState === ConnectionState.Connected) {
            if (phase !== "connected") {
                setPhase("connected");
            }
        }
    }, [remoteParticipants.length, isIncoming, connectionState, phase, setPhase]);

    // For incoming: mark connected immediately once LiveKit is connected
    useEffect(() => {
        if (isIncoming && connectionState === ConnectionState.Connected && phase !== "connected") {
            setPhase("connected");
        }
    }, [isIncoming, connectionState, phase, setPhase]);

    // Reconnecting overlay
    const isReconnecting = connectionState === ConnectionState.Reconnecting;

    return (
        <div className="flex-1 flex flex-col relative">
            {/* Reconnecting Overlay */}
            {isReconnecting && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping" />
                        <Loader2 className="h-12 w-12 text-yellow-500 animate-spin relative z-10" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-wide">Reconnecting...</h3>
                    <p className="text-sm text-white/50">Please wait while we restore your connection</p>
                </div>
            )}

            {phase === "connected" ? (
                isVideo ? (
                    <VideoCallView caller={caller} onEnd={onEnd} duration={formatDuration(duration)} />
                ) : (
                    <VoiceCallView
                        caller={caller}
                        duration={formatDuration(duration)}
                        onEnd={onEnd}
                    />
                )
            ) : (
                /* Still connecting / waiting for remote participant */
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    <RippleBackground />
                    <div className="z-10 flex flex-col items-center gap-8 mt-[-40px]">
                        <div className="relative">
                            <RippleCircles />
                            <Avatar className="h-32 w-32 sm:h-36 sm:w-36 border-4 border-[#1f2c33] shadow-2xl relative z-20">
                                <AvatarImage src={caller.avatar_url || ""} />
                                <AvatarFallback className="bg-[#1f2c33] text-5xl">{caller.name[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-medium tracking-tight text-white">{caller.name}</h2>
                            <p className="text-[#00a884] text-sm font-semibold uppercase tracking-[0.2em] animate-pulse">
                                {connectionState === ConnectionState.Connecting ? "Connecting..." : "Waiting for answer..."}
                            </p>
                        </div>
                    </div>
                    <div className="absolute bottom-12 sm:bottom-16 inset-x-0 flex justify-center z-20">
                        <Button
                            size="icon"
                            variant="destructive"
                            className="h-20 w-20 rounded-full shadow-2xl hover:scale-105 transition-transform"
                            onClick={onEnd}
                        >
                            <PhoneOff className="h-8 w-8 fill-white" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUBCOMPONENTS ---

function VisuallyHidden({ children }: { children: React.ReactNode }) {
    return (
        <span className="absolute w-px h-px p-0 -m-px overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0">
            {children}
        </span>
    );
}

function RippleBackground() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[#0b141a]" />
            <div className="absolute inset-0 bg-radial-[at_50%_40%] from-blue-900/10 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.02] bg-size-[400px]" />
        </div>
    );
}

function RippleCircles() {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none overflow-visible">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="absolute inset-0 border border-[#00a884]/20 rounded-full animate-ripple w-full h-full"
                    style={{ animationDelay: `${i * 1.5}s` }}
                />
            ))}
        </div>
    );
}

function VoiceCallView({ caller, duration, onEnd }: { caller: any; duration: string; onEnd: () => void }) {
    const localParticipant = useLocalParticipant();

    return (
        <div className="flex-1 flex flex-col items-center justify-between py-12 px-8 bg-linear-to-b from-[#0b141a] to-[#121b22]">
            <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-pulse" />
                    <span className="text-sm font-mono tracking-widest text-[#00a884] tabular-nums">{duration}</span>
                </div>
                <div>
                    <h2 className="text-3xl font-medium tracking-tight text-white mb-1">{caller.name}</h2>
                    <div className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/30">Secure Voice Call</div>
                </div>
            </div>

            <div className="relative">
                <div className="absolute -inset-12 bg-[#00a884]/5 rounded-full blur-3xl animate-pulse" />
                <Avatar className="h-48 w-48 border-[6px] border-[#1f2c33] shadow-[0_0_60px_rgba(0,0,0,0.5)] transition-transform duration-700 hover:scale-105">
                    <AvatarImage src={caller.avatar_url || ""} />
                    <AvatarFallback className="bg-[#1f2c33] text-6xl text-white/10">{caller.name[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-[#00a884] p-3 rounded-full shadow-lg border-4 border-[#121b22]">
                    <Mic className="h-5 w-5 text-white" />
                </div>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-10">
                <div className="bg-white/5 backdrop-blur-2xl px-6 py-5 rounded-[40px] border border-white/10 flex items-center justify-between shadow-2xl">
                    <ControlIcon
                        icon={localParticipant.isMicrophoneEnabled ? <Mic /> : <MicOff />}
                        active={localParticipant.isMicrophoneEnabled}
                        onClick={() => localParticipant.localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled)}
                    />
                    <ControlIcon icon={<Volume2 />} active />

                    <button
                        onClick={onEnd}
                        className="h-16 w-16 rounded-full bg-[#ea4335] hover:bg-[#d93025] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg shadow-[#ea4335]/20"
                    >
                        <PhoneOff className="h-7 w-7 text-white fill-white" />
                    </button>

                    <ControlIcon icon={<UserPlus />} />
                    <button className="h-12 w-12 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors">
                        <Grid3X3 className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ControlIcon({ icon, active, onClick, disabled }: { icon: React.ReactNode; active?: boolean; onClick?: () => void; disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95",
                active ? "bg-white text-black shadow-lg" : "bg-white/10 text-white hover:bg-white/20",
                disabled && "opacity-20 cursor-not-allowed"
            )}
        >
            {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5" })}
        </button>
    );
}

function VideoCallView({ caller, onEnd, duration }: { caller: any; onEnd: () => void; duration: string }) {
    const participants = useParticipants();
    const localParticipant = useLocalParticipant();
    const displayParticipants = [...participants].sort((a, b) => a.isLocal ? 1 : -1);

    return (
        <div className="flex-1 relative flex flex-col bg-black overflow-hidden group/call">
            {/* Top Info Bar */}
            <div className="absolute top-8 inset-x-0 flex justify-center z-50 pointer-events-none opacity-0 group-hover/call:opacity-100 transition-opacity">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-2 rounded-full flex items-center gap-3 shadow-2xl">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[11px] text-white font-mono font-bold tracking-[0.2em]">{duration}</span>
                    </div>
                    <div className="w-px h-3 bg-white/20" />
                    <span className="text-[10px] text-[#00a884] font-bold uppercase tracking-widest px-1">HD Live</span>
                </div>
            </div>

            {/* Video Display */}
            <div className="flex-1 flex flex-col gap-2 p-2">
                {displayParticipants.length > 0 ? (
                    displayParticipants.slice(0, 2).map((p) => (
                        <ParticipantTile key={p.identity} participant={p} />
                    ))
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/10 gap-4">
                        <VideoOff className="h-16 w-16" />
                        <p className="text-sm font-medium tracking-widest uppercase opacity-50">Initializing Stream...</p>
                    </div>
                )}
            </div>

            {/* Bottom Control Pod */}
            <div className="absolute bottom-10 inset-x-0 flex justify-center px-6 z-50">
                <div className="bg-black/80 backdrop-blur-[20px] px-8 py-5 rounded-[50px] border border-white/10 flex items-center gap-6 shadow-2xl max-w-full overflow-hidden">
                    <ControlIcon
                        icon={localParticipant.isCameraEnabled ? <Video /> : <VideoOff />}
                        active={localParticipant.isCameraEnabled}
                        onClick={() => localParticipant.localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled)}
                    />
                    <ControlIcon
                        icon={localParticipant.isMicrophoneEnabled ? <Mic /> : <MicOff />}
                        active={localParticipant.isMicrophoneEnabled}
                        onClick={() => localParticipant.localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled)}
                    />

                    <button
                        onClick={onEnd}
                        className="h-16 w-16 rounded-full bg-[#ea4335] hover:bg-[#d93025] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl shadow-red-500/20"
                    >
                        <PhoneOff className="h-8 w-8 text-white fill-white" />
                    </button>

                    <ControlIcon
                        icon={<ScreenShare />}
                        active={localParticipant.isScreenShareEnabled}
                        onClick={() => localParticipant.localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled)}
                    />
                    <ControlIcon icon={<UserPlus />} />
                </div>
            </div>
        </div>
    );
}

function ParticipantTile({ participant }: { participant: Participant }) {
    const isMuted = !participant.isMicrophoneEnabled;
    const isCamOff = !participant.isCameraEnabled;
    const name = participant.name || participant.identity || "Unknown";

    const tracks = useTracks([{ source: Track.Source.Camera, participant }], { onlySubscribed: false });
    const trackRef = tracks[0];

    return (
        <div className="flex-1 relative bg-[#0b141a] rounded-[24px] overflow-hidden border border-white/5 shadow-inner">
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                <Avatar className="h-24 w-24 opacity-[0.05]">
                    <AvatarFallback className="bg-gray-800 text-4xl">{name[0]}</AvatarFallback>
                </Avatar>
            </div>

            {trackRef ? (
                <VideoTrack trackRef={trackRef} className="w-full h-full object-cover relative z-10" />
            ) : (
                <div className="w-full h-full flex items-center justify-center relative z-10">
                    <VideoOff className="h-12 w-12 text-white/10" />
                </div>
            )}

            <div className="absolute bottom-4 left-4 z-20 bg-white px-3 py-1.5 rounded-[4px] shadow-2xl">
                <span className="text-black text-xs font-bold tracking-tight">{name}</span>
            </div>

            <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                {isMuted && (
                    <div className="bg-[#ea4335] p-2 rounded-full shadow-lg border border-white/10 backdrop-blur-sm">
                        <MicOff className="h-3.5 w-3.5 text-white" />
                    </div>
                )}
                {isCamOff && (
                    <div className="bg-gray-900/80 p-2 rounded-full shadow-lg border border-white/10 backdrop-blur-sm">
                        <VideoOff className="h-3.5 w-3.5 text-white" />
                    </div>
                )}
            </div>
        </div>
    );
}
