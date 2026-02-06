"use client";

import { useEffect } from "react";
import { useLoading } from "@/hooks/use-loading";

/**
 * DashboardLoading component
 * This replaces the default grey skeletons with the cinematic global loader
 * during route transitions.
 */
export default function DashboardLoading() {
    const { setIsLoading } = useLoading();

    useEffect(() => {
        // Show cinematic loader when Next.js navigation starts
        setIsLoading(true);

        // Cleanup: Ensuring loader hides when this component unmounts
        // (meaning the target page has loaded)
        return () => {
            // We use a small delay in the provider's own useEffect for better transition
            // but we can also explicitly signal here.
            // However, the provider already handles path changes.
        };
    }, [setIsLoading]);

    // Return null so the global LoadingOverlay in the root layout takes center stage
    return null;
}
