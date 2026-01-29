"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePresence(userId: string | null) {
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        if (!userId) return;

        const supabase = supabaseRef.current;

        // Function to update status to online
        const updateStatus = async () => {
            try {
                await supabase
                    .from("profiles")
                    .update({
                        online_status: "online",
                        last_seen_at: new Date().toISOString(),
                        last_active_at: new Date().toISOString()
                    })
                    .eq("id", userId)
                    .then(() => { }, (error) => console.error("Error updating presence:", error));
            } catch (e) {
                console.error("Error updating presence:", e);
            }
        };

        // Initial update
        updateStatus();

        // Heartbeat every 30 seconds
        const interval = setInterval(updateStatus, 30000);

        // Presence channel for realtime tracking
        const channel = supabase.channel("global_presence");

        channel
            .on("presence", { event: "sync" }, () => {
                // We can track other users here if needed globally
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        user_id: userId,
                        online_at: new Date().toISOString()
                    });
                }
            });

        // Cleanup: set offline on unmount
        return () => {
            clearInterval(interval);
            channel.unsubscribe();

            // Attempt to set offline (best effort)
            supabase
                .from("profiles")
                .update({ online_status: "offline", last_seen_at: new Date().toISOString() })
                .eq("id", userId)
                .then(() => { }, () => { });
        };
    }, [userId]);
}
