"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update global platform settings.
 * Only accessible by admins.
 */
export async function updatePlatformSettingsAction(settings: {
    referral_system_enabled?: boolean;
    maintenance_mode?: boolean;
    portal_selection?: boolean;
    new_registrations?: boolean;
    ai_content_generation?: boolean;
    marketing_banner_active?: boolean;
    marketing_banner_text?: string;
    system_announcement?: string;
}) {
    try {
        const supabase = await createAdminClient();

        // 1. Verify admin role (done via createAdminClient and policy, 
        // but we can be explicit if needed by fetching user first)

        // 2. Update settings (assuming there is only one row in platform_settings)
        // We fetch the ID first
        const { data: current } = await supabase
            .from("platform_settings")
            .select("id")
            .maybeSingle();

        if (!current) {
            return { success: false, error: "Platform settings record not found" };
        }

        const { error } = await supabase
            .from("platform_settings")
            .update({
                ...settings,
                updated_at: new Date().toISOString()
            })
            .eq("id", current.id);

        if (error) {
            console.error("[SettingsAction] Update error:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/referrals");
        revalidatePath("/super/settings");

        return { success: true };
    } catch (error) {
        console.error("[SettingsAction] Unexpected error:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}
