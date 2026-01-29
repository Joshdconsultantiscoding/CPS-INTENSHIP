"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Send } from "lucide-react";

interface VoiceRecorderProps {
    onRecordingComplete: (file: File) => void;
    onCancel: () => void;
}

export function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        startRecording();
        return () => {
            stopRecordingCleanup();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Failed to access microphone", err);
            onCancel();
        }
    };

    const stopRecordingCleanup = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const handleStopAndSend = () => {
        if (!mediaRecorderRef.current) return;

        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            const file = new File([blob], "voice-message.webm", { type: "audio/webm" });
            onRecordingComplete(file);
            stopRecordingCleanup();
        };

        mediaRecorderRef.current.stop();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-2">
            <div className="flex-1 flex items-center gap-3 bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-100 dark:bg-red-950/30 dark:border-red-900/50">
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
                <span className="font-mono font-medium">{formatTime(duration)}</span>
                <span className="text-xs opacity-70">Recording...</span>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                    stopRecordingCleanup();
                    onCancel();
                }}
            >
                <Trash2 className="h-5 w-5" />
            </Button>

            <Button
                size="icon"
                className="h-10 w-10 bg-primary rounded-full shadow-lg"
                onClick={handleStopAndSend}
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
    );
}
