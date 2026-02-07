"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealTimeStatsSync({ userId }: { userId: string }) {
    const router = useRouter();
    const supabase = createClient();
    const refreshTimer = React.useRef<NodeJS.Timeout | null>(null);

    const debouncedRefresh = React.useCallback(() => {
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => {
            console.log("[RealTimeStatsSync] Refreshing dashboard data...");
            router.refresh();
        }, 5000); // 5 second debounce to prevent rapid-fire refreshes
    }, [router]);

    useEffect(() => {
        if (!userId) return;

        // 1. Listen for task changes
        const tasksChannel = supabase
            .channel(`dashboard-tasks-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tasks",
                    filter: `assigned_to=eq.${userId}`
                },
                () => debouncedRefresh()
            )
            .subscribe();

        // 2. Listen for report changes
        const reportsChannel = supabase
            .channel(`dashboard-reports-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "daily_reports",
                    filter: `user_id=eq.${userId}`
                },
                () => debouncedRefresh()
            )
            .subscribe();

        return () => {
            if (refreshTimer.current) clearTimeout(refreshTimer.current);
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(reportsChannel);
        };
    }, [userId, supabase, debouncedRefresh]);

    return null; // This is a logic-only component
}
