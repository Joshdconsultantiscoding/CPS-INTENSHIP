"use server";

import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ensureProfileSync } from "@/lib/profile-sync";

export interface CreateEventInput {
    title: string;
    description?: string;
    eventType: string;
    startTime: string;
    endTime?: string;
    location?: string;
    isPublic?: boolean;
    attendees?: string[];
}

export async function createEventAction(input: CreateEventInput) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // 1. Ensure Profile Exists Safely (Don't overwrite custom avatars)
        const syncResult = await ensureProfileSync(user, supabase);

        if (syncResult.error && !syncResult.error.includes("duplicate key")) {
            console.error("[Calendar] Profile Sync Failed:", syncResult.error);
            // We continue anyway if it's a non-fatal sync error, 
            // but log it for diagnosis.
        }

        // 2. Create Event
        const { data, error } = await supabase
            .from("calendar_events")
            .insert({
                user_id: user.id,
                title: input.title,
                description: input.description,
                event_type: input.eventType,
                start_time: input.startTime,
                end_time: input.endTime || null,
                location: input.location || null,
                is_public: input.isPublic || false,
                attendees: input.attendees || [],
            })
            .select()
            .single();

        if (error) {
            console.error("[Calendar] Create Event Error:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/calendar");
        return { success: true, event: data };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[Calendar] Unexpected error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteEventAction(eventId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();
        const isAdmin = user.role === "admin";

        // Fetch event to check ownership
        const { data: event, error: fetchError } = await supabase
            .from("calendar_events")
            .select("user_id")
            .eq("id", eventId)
            .single();

        if (fetchError || !event) {
            return { success: false, error: "Event not found" };
        }

        if (!isAdmin && event.user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { error: deleteError } = await supabase
            .from("calendar_events")
            .delete()
            .eq("id", eventId);

        if (deleteError) {
            return { success: false, error: deleteError.message };
        }

        revalidatePath("/dashboard/calendar");
        revalidatePath("/dashboard/events");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export type UpdateEventInput = Partial<CreateEventInput> & { id: string };

export async function updateEventAction(input: UpdateEventInput) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();
        const isAdmin = user.role === "admin";

        // Fetch event to check ownership
        const { data: event, error: fetchError } = await supabase
            .from("calendar_events")
            .select("user_id")
            .eq("id", input.id)
            .single();

        if (fetchError || !event) {
            return { success: false, error: "Event not found" };
        }

        if (!isAdmin && event.user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const updateData: any = {};
        if (input.title) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.eventType) updateData.event_type = input.eventType;
        if (input.startTime) updateData.start_time = input.startTime;
        if (input.endTime !== undefined) updateData.end_time = input.endTime; // Allow setting null
        if (input.location !== undefined) updateData.location = input.location;
        if (input.isPublic !== undefined) updateData.is_public = input.isPublic;
        if (input.attendees) updateData.attendees = input.attendees;

        const { error } = await supabase
            .from("calendar_events")
            .update(updateData)
            .eq("id", input.id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/calendar");
        revalidatePath("/dashboard/events");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
