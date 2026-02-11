// ============================================================
// INTENT UTILITIES — Portal Selection System
// Client-side helpers to store/retrieve user portal intent.
// This is a NEW file. Does NOT modify any existing code.
// ============================================================

const INTENT_KEY = "portal_intent";

export type PortalIntent =
    | "admin"
    | "mentor"
    | "company"
    | "recruiter"
    | "intern"
    | "marketplace"
    | "ai";

/**
 * Store the user's selected portal intent in localStorage.
 * Safe to call — silently fails if localStorage is unavailable.
 */
export function setIntent(intent: PortalIntent): void {
    try {
        if (typeof window !== "undefined") {
            localStorage.setItem(INTENT_KEY, intent);
        }
    } catch {
        // Silent fail — localStorage might be blocked
    }
}

/**
 * Retrieve the stored portal intent.
 * Returns null if no intent is stored or localStorage is unavailable.
 */
export function getIntent(): PortalIntent | null {
    try {
        if (typeof window !== "undefined") {
            const value = localStorage.getItem(INTENT_KEY);
            if (value) return value as PortalIntent;
        }
    } catch {
        // Silent fail
    }
    return null;
}

/**
 * Clear the stored portal intent.
 * Safe to call — silently fails if localStorage is unavailable.
 */
export function clearIntent(): void {
    try {
        if (typeof window !== "undefined") {
            localStorage.removeItem(INTENT_KEY);
        }
    } catch {
        // Silent fail
    }
}
