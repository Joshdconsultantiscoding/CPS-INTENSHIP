"use client";

import { useCallback, useRef } from "react";

/**
 * WhatsApp-style notification sounds using Web Audio API.
 * No external files needed — generates tones procedurally.
 */
export function useNotificationSound() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const lastPlayedRef = useRef<number>(0);

    const getContext = useCallback(() => {
        if (!audioContextRef.current || audioContextRef.current.state === "closed") {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        // Resume if suspended (browser autoplay policy)
        if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume().catch(() => { });
        }
        return audioContextRef.current;
    }, []);

    /** Short "pop" sound for sent messages (WhatsApp-style) */
    const playSentSound = useCallback(() => {
        try {
            const now = Date.now();
            if (now - lastPlayedRef.current < 300) return; // debounce
            lastPlayedRef.current = now;

            const ctx = getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            // Silent fail — audio not available
        }
    }, [getContext]);

    /** Two-tone chime for received messages (WhatsApp-style) */
    const playReceivedSound = useCallback(() => {
        try {
            const now = Date.now();
            if (now - lastPlayedRef.current < 300) return; // debounce
            lastPlayedRef.current = now;

            const ctx = getContext();

            // First tone
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(600, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);
            gain1.gain.setValueAtTime(0.12, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.08);

            // Second tone (slightly delayed, higher pitch)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(900, ctx.currentTime + 0.09);
            osc2.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.15);
            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.09);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime + 0.09);
            osc2.stop(ctx.currentTime + 0.18);
        } catch (e) {
            // Silent fail
        }
    }, [getContext]);

    return { playSentSound, playReceivedSound };
}
