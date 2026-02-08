"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    startLessonTracking,
    pauseLessonTracking,
    resumeLessonTracking,
    syncActiveTime,
    updateLessonProgress
} from "@/actions/time-tracking";

interface UseLessonTimeOptions {
    lessonId: string;
    courseId: string;
    requiredTimeSeconds: number;
    autoSyncIntervalMs?: number;
    onTimeRequirementMet?: () => void;
}

interface LessonTimeState {
    totalActiveSeconds: number;
    sessionSeconds: number;
    isTracking: boolean;
    isPaused: boolean;
    pauseReason: string | null;
    requirementMet: boolean;
    progress: number;
}

export function useLessonTime({
    lessonId,
    courseId,
    requiredTimeSeconds,
    autoSyncIntervalMs = 30000, // Sync every 30 seconds
    onTimeRequirementMet
}: UseLessonTimeOptions) {
    const [state, setState] = useState<LessonTimeState>({
        totalActiveSeconds: 0,
        sessionSeconds: 0,
        isTracking: false,
        isPaused: false,
        pauseReason: null,
        requirementMet: false,
        progress: 0
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const syncRef = useRef<NodeJS.Timeout | null>(null);
    const lastSyncRef = useRef<number>(0);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());

    // Refs for stable value tracking (prevents closure issues)
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Track session start time for accurate counting
    const sessionStartTimeRef = useRef<number | null>(null);

    // Start tracking on mount
    useEffect(() => {
        let isMounted = true;
        const initTracking = async () => {
            console.log(`[useLessonTime] Initializing tracking for lesson: ${lessonId}`);
            try {
                const result = await startLessonTracking(lessonId, courseId);
                if (!isMounted) return;

                if (result.success) {
                    const totalActive = result.tracking?.total_active_seconds || 0;
                    console.log(`[useLessonTime] Tracking initialized. Total active: ${totalActive}s, Required: ${requiredTimeSeconds}s`);

                    const progress = requiredTimeSeconds > 0
                        ? Math.min(100, Math.round((totalActive / requiredTimeSeconds) * 100))
                        : 100;

                    sessionStartTimeRef.current = Date.now();

                    setState(prev => ({
                        ...prev,
                        totalActiveSeconds: totalActive,
                        isTracking: true,
                        isPaused: false, // Ensure not paused initially
                        requirementMet: totalActive >= requiredTimeSeconds,
                        progress
                    }));
                } else {
                    console.error("[useLessonTime] Failed to start tracking:", result.error);
                }
            } catch (error) {
                console.error("[useLessonTime] Exception in initTracking:", error);
            }
        };

        if (lessonId && courseId) {
            initTracking();
        }

        return () => {
            isMounted = false;
            // Cleanup - sync on unmount
            const currentState = stateRef.current;
            if (currentState.sessionSeconds > 0) {
                console.log(`[useLessonTime] Unmounting. Syncing ${currentState.sessionSeconds}s for lesson: ${lessonId}`);
                syncActiveTime(lessonId, currentState.sessionSeconds, 0);
            }
        };
    }, [lessonId, courseId, requiredTimeSeconds]);

    // Active timer
    useEffect(() => {
        if (!state.isTracking || state.isPaused || !sessionStartTimeRef.current) {
            return;
        }

        // Use a start-time based approach for high accuracy
        const baseTotalActive = state.totalActiveSeconds;
        const baseSession = state.sessionSeconds;
        const startTime = Date.now();

        timerRef.current = setInterval(() => {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);

            if (elapsedSeconds <= 0) return;

            console.log(`[useLessonTime] TICK: lesson=${lessonId}, elapsed=${elapsedSeconds}s, total=${baseTotalActive + elapsedSeconds}s`);

            setState(prev => {
                const newSession = baseSession + elapsedSeconds;
                const newTotal = baseTotalActive + elapsedSeconds;

                // Only update if values actually changed to prevent excessive re-renders
                if (newTotal === prev.totalActiveSeconds) return prev;

                const progress = requiredTimeSeconds > 0
                    ? Math.min(100, Math.round((newTotal / requiredTimeSeconds) * 100))
                    : 100;
                const requirementMet = newTotal >= requiredTimeSeconds;

                // Fire callback when requirement is met for the first time
                if (requirementMet && !prev.requirementMet) {
                    onTimeRequirementMet?.();
                }

                return {
                    ...prev,
                    sessionSeconds: newSession,
                    totalActiveSeconds: newTotal,
                    requirementMet,
                    progress
                };
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [state.isTracking, state.isPaused, requiredTimeSeconds, onTimeRequirementMet, state.totalActiveSeconds, state.sessionSeconds]);

    // Auto-sync to server
    useEffect(() => {
        if (!state.isTracking) return;

        syncRef.current = setInterval(async () => {
            const secondsSinceLastSync = state.sessionSeconds - lastSyncRef.current;
            if (secondsSinceLastSync > 0) {
                await syncActiveTime(lessonId, secondsSinceLastSync, 0);
                lastSyncRef.current = state.sessionSeconds;
            }
        }, autoSyncIntervalMs);

        return () => {
            if (syncRef.current) {
                clearInterval(syncRef.current);
            }
        };
    }, [lessonId, state.isTracking, autoSyncIntervalMs, state.sessionSeconds]);

    // Tab visibility - pause on blur
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                // Pause tracking
                setState(prev => ({ ...prev, isPaused: true, pauseReason: "tab_blur" }));
                await pauseLessonTracking(lessonId, "tab_blur");
            } else {
                // Resume tracking
                setState(prev => ({ ...prev, isPaused: false, pauseReason: null }));
                await resumeLessonTracking(lessonId);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [lessonId]);

    // Idle detection - pause after 2 minutes of inactivity
    useEffect(() => {
        const IDLE_THRESHOLD = 120000; // 2 minutes

        const resetIdleTimer = () => {
            lastActivityRef.current = Date.now();
            if (state.isPaused && state.pauseReason === "idle") {
                setState(prev => ({ ...prev, isPaused: false, pauseReason: null }));
                resumeLessonTracking(lessonId);
            }
        };

        const checkIdle = async () => {
            const idleTime = Date.now() - lastActivityRef.current;
            if (idleTime > IDLE_THRESHOLD && !state.isPaused) {
                setState(prev => ({ ...prev, isPaused: true, pauseReason: "idle" }));
                await pauseLessonTracking(lessonId, "idle");
            }
        };

        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
        events.forEach(event => {
            document.addEventListener(event, resetIdleTimer, { passive: true });
        });

        idleTimerRef.current = setInterval(checkIdle, 10000);

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, resetIdleTimer);
            });
            if (idleTimerRef.current) {
                clearInterval(idleTimerRef.current);
            }
        };
    }, [lessonId, state.isPaused, state.pauseReason]);

    // Manual pause
    const pause = useCallback(async () => {
        setState(prev => ({ ...prev, isPaused: true, pauseReason: "manual" }));
        await pauseLessonTracking(lessonId, "manual");
    }, [lessonId]);

    // Manual resume
    const resume = useCallback(async () => {
        setState(prev => ({ ...prev, isPaused: false, pauseReason: null }));
        await resumeLessonTracking(lessonId);
    }, [lessonId]);

    // Update video progress
    const updateVideoProgress = useCallback(async (watchedSeconds: number) => {
        await updateLessonProgress(lessonId, { video_watched_seconds: watchedSeconds });
    }, [lessonId]);

    // Update scroll progress
    const updateScrollProgress = useCallback(async (percentage: number) => {
        await updateLessonProgress(lessonId, { content_scroll_percentage: percentage });
    }, [lessonId]);

    // Format time
    const formatTime = useCallback((seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m ${secs}s`;
        } else if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    }, []);

    return {
        totalActiveSeconds: state.totalActiveSeconds,
        formattedTime: formatTime(state.totalActiveSeconds),
        sessionSeconds: state.sessionSeconds,
        isTracking: state.isTracking,
        isPaused: state.isPaused,
        pauseReason: state.pauseReason,
        requirementMet: state.requirementMet,
        progress: state.progress,
        requiredTimeSeconds,
        remainingSeconds: Math.max(0, requiredTimeSeconds - state.totalActiveSeconds),
        formattedRemaining: formatTime(Math.max(0, requiredTimeSeconds - state.totalActiveSeconds)),
        pause,
        resume,
        updateVideoProgress,
        updateScrollProgress
    };
}
