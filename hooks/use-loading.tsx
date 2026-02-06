"use client";

import React, { createContext, useContext, useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface LoadingContextType {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    showLoader: () => void;
    hideLoader: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

function LoadingInner({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Internal state management for the "Grace Period" and "Immediate Sync"
    useEffect(() => {
        let graceTimer: NodeJS.Timeout;
        const GRACE_PERIOD = 30; // Shorter grace period for snappiness

        if (isLoading) {
            graceTimer = setTimeout(() => {
                setShowOverlay(true);
            }, GRACE_PERIOD);

            return () => {
                if (graceTimer) clearTimeout(graceTimer);
            };
        } else {
            // Keep the overlay for a tiny bit longer to avoid flicker
            const hideTimer = setTimeout(() => {
                setShowOverlay(false);
            }, 100);
            return () => clearTimeout(hideTimer);
        }
    }, [isLoading]);

    // Auto-hide loader on path or search param change
    // We add a tiny delay here because Next.js commits the path change
    // before the new RSC page is fully hydrated.
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 150);
        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    const showLoader = () => setIsLoading(true);
    const hideLoader = () => setIsLoading(false);

    return (
        <LoadingContext.Provider value={{ isLoading: showOverlay, setIsLoading, showLoader, hideLoader }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <LoadingInner>{children}</LoadingInner>
        </Suspense>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
}
