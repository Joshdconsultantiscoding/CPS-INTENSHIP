"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";

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
        const { error } = await supabase
            .from("profiles")
            .update(cleanedData)
            .eq("id", userId);

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

        // 4. Broadcast to Ably for Global Real-Time Sync (Sidebar, other users)
        if (process.env.ABLY_API_KEY) {
            try {
                const Ably = require('ably');
                const ably = new Ably.Rest(process.env.ABLY_API_KEY);
                // Fetch current user data to ensure we broadcast the COMPLETE state
                // This prevents "undefined undefined" names if only avatar is updated
                const { data: currentProfile } = await supabase
                    .from("profiles")
                    .select("first_name, last_name, avatar_url, role, email, full_name") // Added full_name to select
                    .eq("id", userId)
                    .single();

                if (currentProfile) {
                    // 4a. Calculate new full_name if first_name or last_name changed
                    const newFirstName = cleanedData.first_name ?? currentProfile.first_name;
                    const newLastName = cleanedData.last_name ?? currentProfile.last_name;
                    const newFullName = `${newFirstName} ${newLastName}`.trim();

                    // 4b. If full_name changed, update it in the DB
                    if (newFullName !== currentProfile.full_name) {
                        const { error: fullNameUpdateError } = await supabase
                            .from("profiles")
                            .update({ full_name: newFullName })
                            .eq("id", userId);

                        if (fullNameUpdateError) {
                            console.error("Supabase Error updating full_name:", fullNameUpdateError);
                            // Don't throw, just log, as the main update already succeeded
                        }
                    }

                    // 4c. Broadcast to Ably
                    const channel = ably.channels.get("global-updates");
                    await channel.publish("profile-updated", {
                        userId,
                        ...currentProfile,
                        ...cleanedData, // Override with any new data
                        full_name: newFullName, // Ensure broadcast uses the latest calculated full_name
                        timestamp: Date.now()
                    });
                }
            } catch (ablyError) {
                console.warn("Failed to broadcast profile update:", ablyError);
                // Don't fail the request if Ably fails
            }
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
