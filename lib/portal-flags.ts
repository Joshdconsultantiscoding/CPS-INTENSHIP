// ============================================================
// PORTAL FLAGS — Portal Selection Feature Flag Helper
// This is a NEW file. Does NOT modify lib/feature-flags.ts.
// Provides a dedicated helper for portal selection features.
// ============================================================

import { isFeatureEnabled } from "@/lib/feature-flags";

/**
 * Default state: portal selection is DISABLED.
 * Set to true to enable the portal selection page.
 *
 * This can be overridden by the `portal_selection` flag
 * in the database (api_settings table).
 */
const LOCAL_DEFAULT = false;

/**
 * Check if the portal selection feature is enabled.
 *
 * Priority:
 * 1. Database flag `portal_selection` (if set)
 * 2. Local default (false)
 *
 * If the database is unreachable, defaults to false (safe).
 */
export async function isPortalSelectionEnabled(): Promise<boolean> {
    try {
        const enabled = await isFeatureEnabled("portal_selection");
        return enabled;
    } catch {
        return LOCAL_DEFAULT;
    }
}

/**
 * Check if the portal router v2 (intent-aware) is enabled.
 */
export async function isPortalRouterV2Enabled(): Promise<boolean> {
    try {
        const enabled = await isFeatureEnabled("portal_router_v2");
        return enabled;
    } catch {
        return false;
    }
}
