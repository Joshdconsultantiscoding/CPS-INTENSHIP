"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealTimeStatsSync() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // 1. Listen for task changes (affects pending/completed counts)
        const tasksChannel = supabase
            .channel("dashboard-tasks-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tasks" },
                () => {
                    console.log("Tasks changed, refreshing dashboard...");
                    router.refresh();
                }
            )
            .subscribe();

        // 2. Listen for report changes (affects pending reports count)
        const reportsChannel = supabase
            .channel("dashboard-reports-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "daily_reports" },
                () => {
                    console.log("Reports changed, refreshing dashboard...");
                    router.refresh();
                }
            )
            .subscribe();

        // 3. Listen for profile changes (only for current user to avoid heartbeat loops)
        const profilesChannel = supabase
            .channel("dashboard-profiles-realtime")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "profiles",
                    filter: `id=eq.${supabase.auth.getUser()}` // This is a placeholder, I need the actual user ID
                },
                () => {
                    // ...
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(reportsChannel);
            supabase.removeChannel(profilesChannel);
        };
    }, [router, supabase]);

    return null; // This is a logic-only component
}
