import { createAdminClient } from "@/lib/supabase/server";

// ============================================================
// FEATURE FLAGS — Multi-Tenant SaaS Extension
// Simple feature flag system that reads from api_settings table.
// This is a NEW file. Does NOT modify any existing code.
// ============================================================

// Default flags — safe values when DB is unavailable
const DEFAULT_FLAGS: Record<string, boolean> = {
    workspace_system: true,
    mentor_portal: false,
    recruiter_portal: false,
    company_portal: false,
    ai_portal: false,
    marketplace: false,
    super_admin: true,
    workspace_admin: true,
    workspace_intern: true,
};

/**
 * Get all feature flags. Returns defaults if DB is unavailable.
 */
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
    try {
        const supabase = await createAdminClient();
        const { data } = await supabase
            .from("api_settings")
            .select("setting_value")
            .eq("setting_key", "feature_flags")
            .maybeSingle();

        if (data?.setting_value && typeof data.setting_value === "object") {
            return { ...DEFAULT_FLAGS, ...(data.setting_value as Record<string, boolean>) };
        }

        return DEFAULT_FLAGS;
    } catch {
        // If DB is down, return safe defaults
        return DEFAULT_FLAGS;
    }
}

/**
 * Check if a specific feature is enabled.
 */
export async function isFeatureEnabled(feature: string): Promise<boolean> {
    try {
        const flags = await getFeatureFlags();
        return flags[feature] ?? false;
    } catch {
        return DEFAULT_FLAGS[feature] ?? false;
    }
}
