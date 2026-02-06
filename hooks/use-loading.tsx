"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface LoadingContextType {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    showLoader: () => void;
    hideLoader: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const startTimeRef = React.useRef<number | null>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Internal state management for the "Grace Period" and "Pulse Sync"
    useEffect(() => {
        let graceTimer: NodeJS.Timeout;
        const MIN_DISPLAY_TIME = 2000;
        const GRACE_PERIOD = 80;

        if (isLoading) {
            // 1. Grace Period: Only show loader if it's still loading after 80ms
            graceTimer = setTimeout(() => {
                setShowOverlay(true);
                startTimeRef.current = Date.now();
                // We REMOVED the MAX_DISPLAY_TIME hard-dismiss to prevent "bounce back"
            }, GRACE_PERIOD);

            return () => {
                if (graceTimer) clearTimeout(graceTimer);
            };
        } else {
            // 2. Min Display Sync: When isLoading becomes false, check if we've shown for 2s
            if (showOverlay && startTimeRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

                if (remaining > 0) {
                    const timer = setTimeout(() => {
                        setShowOverlay(false);
                        startTimeRef.current = null;
                    }, remaining);
                    return () => clearTimeout(timer);
                } else {
                    setShowOverlay(false);
                    startTimeRef.current = null;
                }
            } else {
                setShowOverlay(false);
                startTimeRef.current = null;
            }
        }
    }, [isLoading, showOverlay]);

    // Auto-hide loader on path or search param change (navigation completed)
    useEffect(() => {
        setIsLoading(false);
        // We let the internal sync logic handle the hide with a delay if needed
    }, [pathname, searchParams]);

    const showLoader = () => setIsLoading(true);
    const hideLoader = () => setIsLoading(false);

    return (
        <LoadingContext.Provider value={{ isLoading: showOverlay, setIsLoading, showLoader, hideLoader }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
}
