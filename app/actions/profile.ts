"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(userId: string, data: {
    first_name?: string | null;
    last_name?: string | null;
    bio?: string | null;
    department?: string | null;
    avatar_url?: string | null;
}) {
    try {
        const supabase = await createAdminClient();

        // Perform update
        const { error } = await supabase
            .from("profiles")
            .update(data)
            .eq("id", userId);

        if (error) {
            console.error("Supabase Error in updateProfile:", error);
            throw error;
        }

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard/interns");
        revalidatePath("/dashboard/messages");

        return { success: true };
    } catch (error: any) {
        console.error("Detailed error in updateProfile:", error);
        return {
            success: false,
            error: error.message || "Unknown error occurred during profile update"
        };
    }
}
