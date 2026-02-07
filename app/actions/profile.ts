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
        const cleanedData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );

        // 2. Fetch User Email from Clerk to satisfy NOT NULL constraint on Upsert
        // This is a "Deep Fix" for users who signed up but don't have a DB record yet
        const { currentUser } = await import("@clerk/nextjs/server");
        const clerkUser = await currentUser();
        const email = clerkUser?.emailAddresses[0]?.emailAddress;

        if (!email) {
            return {
                success: false,
                error: "User email not found in session. Please sign in again."
            };
        }

        // 3. Perform upsert (create if missing, update if exists)
        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: userId,
                email: email.toLowerCase(),
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

        // 4. Revalidate Paths - include root layout for Sidebar avatar
        revalidatePath("/", "layout");
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard/interns");
        revalidatePath("/dashboard/messages");
        revalidatePath("/dashboard/tasks"); // Fix for stale dropdowns
        revalidatePath("/dashboard/reports"); // Proactive fix

        // 5. Deep Fix: Broadcast to Ably for Global Real-Time Sync (Sidebar, other users)
        try {
            // Fetch current user data to ensure we broadcast the COMPLETE state
            const { data: currentProfile } = await supabase
                .from("profiles")
                .select("first_name, last_name, avatar_url, role, email, full_name")
                .eq("id", userId)
                .single();

            if (currentProfile) {
                const newFirstName = (cleanedData.first_name as string) ?? currentProfile.first_name;
                const newLastName = (cleanedData.last_name as string) ?? currentProfile.last_name;
                const newFullName = `${newFirstName || ""} ${newLastName || ""}`.trim();

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
        } catch (updateError) {
            console.warn("Failed to broadcast profile update:", updateError);
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
