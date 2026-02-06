"use client";

import { useSession } from "@clerk/nextjs";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function SupabaseAuthSync() {
    const { session } = useSession();

    useEffect(() => {
        if (!session) return;

        const syncSession = async () => {
            const supabase = createClient();

            // Get the Supabase-compatible JWT from Clerk
            // NOTE: This assumes you have the 'supabase' template configured in Clerk
            // If not, we fall back to standard token, but 'supabase' template is best practice.
            try {
                // Try to get Supabase-specific token if template exists
                let token;
                try {
                    token = await session.getToken({ template: "supabase" });
                } catch (templateError: any) {
                    if (templateError.message?.includes("No JWT template exists")) {
                        console.warn("Clerk 'supabase' template missing. Falling back to default token. RLS might be affected.");
                        token = await session.getToken();
                    } else {
                        throw templateError;
                    }
                }

                if (token) {
                    await supabase.auth.setSession({
                        access_token: token,
                        refresh_token: "", // Clerk handles refresh
                    });
                    console.log("Supabase session synchronized");
                }
            } catch (error) {
                console.error("Failed to sync Supabase session:", error);
            }
        };

        syncSession();

        // Re-sync every minute to keep token fresh
        const interval = setInterval(syncSession, 60000);
        return () => clearInterval(interval);
    }, [session]);

    return null;
}
