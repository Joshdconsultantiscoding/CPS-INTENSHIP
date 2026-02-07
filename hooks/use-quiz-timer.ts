"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { autoSubmitTimedOut, reportAntiCheatViolation } from "@/actions/quiz";

interface UseQuizTimerOptions {
    attemptId: string;
    timeLimitSeconds: number;
    strictMode: boolean;
    fullscreenRequired: boolean;
    detectTabSwitch: boolean;
    onTimeout: () => void;
    onViolation?: (type: string, count: number) => void;
}

interface QuizTimerState {
    remainingSeconds: number;
    isRunning: boolean;
    isPaused: boolean;
    violations: {
        tabSwitches: number;
        fullscreenExits: number;
        idleTime: number;
    };
}

export function useQuizTimer({
    attemptId,
    timeLimitSeconds,
    strictMode,
    fullscreenRequired,
    detectTabSwitch,
    onTimeout,
    onViolation
}: UseQuizTimerOptions) {
    const [state, setState] = useState<QuizTimerState>({
        remainingSeconds: timeLimitSeconds,
        isRunning: timeLimitSeconds > 0,
        isPaused: false,
        violations: {
            tabSwitches: 0,
            fullscreenExits: 0,
            idleTime: 0
        }
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const isFullscreenRef = useRef<boolean>(false);

    // Countdown timer
    useEffect(() => {
        if (!state.isRunning || state.isPaused || timeLimitSeconds <= 0) {
            return;
        }

        timerRef.current = setInterval(() => {
            setState(prev => {
                const newRemaining = prev.remainingSeconds - 1;

                if (newRemaining <= 0) {
                    // Time's up - auto submit
                    autoSubmitTimedOut(attemptId);
                    onTimeout();
                    return { ...prev, remainingSeconds: 0, isRunning: false };
                }

                return { ...prev, remainingSeconds: newRemaining };
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [state.isRunning, state.isPaused, attemptId, onTimeout, timeLimitSeconds]);

    // Tab visibility detection
    useEffect(() => {
        if (!detectTabSwitch && !strictMode) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Tab switched away
                setState(prev => {
                    const newCount = prev.violations.tabSwitches + 1;
                    onViolation?.("tab_switch", newCount);
                    reportAntiCheatViolation(attemptId, "tab_switch");
                    return {
                        ...prev,
                        isPaused: strictMode,
                        violations: { ...prev.violations, tabSwitches: newCount }
                    };
                });
            } else {
                // Tab became visible again
                if (strictMode) {
                    setState(prev => ({ ...prev, isPaused: false }));
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [attemptId, detectTabSwitch, strictMode, onViolation]);

    // Fullscreen detection
    useEffect(() => {
        if (!fullscreenRequired) return;

        const handleFullscreenChange = () => {
            const isFullscreen = !!document.fullscreenElement;

            if (isFullscreenRef.current && !isFullscreen) {
                // Exited fullscreen
                setState(prev => {
                    const newCount = prev.violations.fullscreenExits + 1;
                    onViolation?.("fullscreen_exit", newCount);
                    reportAntiCheatViolation(attemptId, "fullscreen_exit");
                    return {
                        ...prev,
                        isPaused: true,
                        violations: { ...prev.violations, fullscreenExits: newCount }
                    };
                });
            }

            isFullscreenRef.current = isFullscreen;
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [attemptId, fullscreenRequired, onViolation]);

    // Idle detection
    useEffect(() => {
        if (!strictMode) return;

        const IDLE_THRESHOLD = 60000; // 1 minute

        const resetIdleTimer = () => {
            lastActivityRef.current = Date.now();
            if (state.isPaused) {
                setState(prev => ({ ...prev, isPaused: false }));
            }
        };

        const checkIdle = () => {
            const idleTime = Date.now() - lastActivityRef.current;
            if (idleTime > IDLE_THRESHOLD) {
                setState(prev => ({
                    ...prev,
                    isPaused: true,
                    violations: {
                        ...prev.violations,
                        idleTime: prev.violations.idleTime + Math.floor(idleTime / 1000)
                    }
                }));
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
    }, [strictMode, state.isPaused]);

    // Prevent refresh/close
    useEffect(() => {
        if (!strictMode) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "You have an ongoing quiz. Are you sure you want to leave?";
            return e.returnValue;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [strictMode]);

    // Request fullscreen
    const requestFullscreen = useCallback(async () => {
        try {
            await document.documentElement.requestFullscreen();
            isFullscreenRef.current = true;
            setState(prev => ({ ...prev, isPaused: false }));
        } catch (error) {
            console.warn("Fullscreen request failed:", error);
        }
    }, []);

    // Exit fullscreen
    const exitFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.warn("Exit fullscreen failed:", error);
        }
    }, []);

    // Pause timer manually
    const pauseTimer = useCallback(() => {
        setState(prev => ({ ...prev, isPaused: true }));
    }, []);

    // Resume timer
    const resumeTimer = useCallback(() => {
        setState(prev => ({ ...prev, isPaused: false }));
    }, []);

    // Format time as MM:SS
    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }, []);

    return {
        remainingSeconds: state.remainingSeconds,
        formattedTime: formatTime(state.remainingSeconds),
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        violations: state.violations,
        isTimeLimited: timeLimitSeconds > 0,
        isLowTime: state.remainingSeconds <= 60 && state.remainingSeconds > 0,
        isCriticalTime: state.remainingSeconds <= 30 && state.remainingSeconds > 0,
        requestFullscreen,
        exitFullscreen,
        pauseTimer,
        resumeTimer
    };
}
