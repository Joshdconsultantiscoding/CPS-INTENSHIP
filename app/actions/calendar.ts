"use server";

import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateEventInput {
    title: string;
    description?: string;
    eventType: string;
    startTime: string;
    endTime?: string;
    location?: string;
    isPublic?: boolean;
}

export async function createEventAction(input: CreateEventInput) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // 1. Ensure Profile Exists (Robust Sync)
        const { data: existingByEmail } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", user.email || "")
            .maybeSingle();

        if (existingByEmail && existingByEmail.id !== user.id) {
            // If profile exists with this email but different ID, update the ID to match current Clerk user
            const { error: updateIdError } = await supabase
                .from("profiles")
                .update({ id: user.id, updated_at: new Date().toISOString() })
                .eq("email", user.email || "");

            if (updateIdError) {
                console.warn("[Calendar] Could not update profile ID by email (likely FK constraint):", updateIdError);
                // Fallback: try upserting by ID anyway, or just ignore if it's a minor sync
            }
        }

        const { error: upsertError } = await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email || "",
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            role: user.role,
            updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

        if (upsertError && !upsertError.message.includes("duplicate key")) {
            console.error("[Calendar] Profile Upsert Failed:", upsertError);
            return {
                success: false,
                error: `Profile sync failed: ${upsertError.message}`
            };
        }

        // 2. Create Event
        const { data, error } = await supabase
            .from("calendar_events")
            .insert({
                user_id: user.id, // Live DB uses user_id
                title: input.title,
                description: input.description,
                event_type: input.eventType,
                start_time: input.startTime,
                end_time: input.endTime || null,
                location: input.location || null,
                is_public: input.isPublic || false,
            })
            .select()
            .single();

        if (error) {
            // Check if it's the specific "column does not exist" error for is_public
            console.error("[Calendar] Create Event Error:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/calendar");
        return { success: true, event: data };
    } catch (error: any) {
        console.error("[Calendar] Unexpected error:", error);
        return { success: false, error: error.message };
    }
}
