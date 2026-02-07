"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { publishGlobalUpdate } from "@/lib/ably-server";

export async function updateProfile(userId: string, data: {
    first_name?: string | null;
    last_name?: string | null;
    bio?: string | null;
    department?: string | null;
    avatar_url?: string | null;
}) {
    try {
        const supabase = await createAdminClient();

        // 1. Sanitize data: Remove undefined keys to prevent "column not found" errors
        // Supabase client sometimes treats 'undefined' as a column that doesn't exist
        const cleanedData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );

        // 2. Perform update
        // 2. Perform upsert (create if missing, update if exists)
        // This fixes issues where a user exists in auth (Clerk) but not in DB (profiles)
        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: userId,
                ...cleanedData,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: "id",
                ignoreDuplicates: false
            });

        if (error) {
            console.error("Supabase Error in updateProfile:", error);
            throw error;
        }

        // 3. Revalidate Paths - include root layout for Sidebar avatar
        revalidatePath("/", "layout");
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard/interns");
        revalidatePath("/dashboard/messages");
        revalidatePath("/dashboard/tasks"); // Fix for stale dropdowns
        revalidatePath("/dashboard/reports"); // Proactive fix

        // Deep Fix: Broadcast to Ably for Global Real-Time Sync (Sidebar, other users)
        // Using centralized utility for consistency
        try {
            // Fetch current user data to ensure we broadcast the COMPLETE state
            const { data: currentProfile } = await supabase
                .from("profiles")
                .select("first_name, last_name, avatar_url, role, email, full_name")
                .eq("id", userId)
                .single();

            if (currentProfile) {
                const newFirstName = cleanedData.first_name ?? currentProfile.first_name;
                const newLastName = cleanedData.last_name ?? currentProfile.last_name;
                const newFullName = `${newFirstName} ${newLastName}`.trim();

                // If full_name changed, update it in the DB
                if (newFullName !== currentProfile.full_name) {
                    await supabase
                        .from("profiles")
                        .update({ full_name: newFullName })
                        .eq("id", userId);
                }

                await publishGlobalUpdate("profile-updated", {
                    userId,
                    ...currentProfile,
                    ...cleanedData,
                    full_name: newFullName,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.warn("Failed to broadcast profile update:", error);
        }

        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("Detailed error in updateProfile:", error);
        return {
            success: false,
            error: error.message || "Unknown error occurred during profile update"
        };
    }
}
