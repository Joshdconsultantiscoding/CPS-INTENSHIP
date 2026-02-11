import { getAuthUser } from "@/lib/auth";
import { getWorkspaceMemberships } from "@/lib/workspace";
import { ensureWorkspaceForUser } from "@/lib/workspace-sync";
import { config } from "@/lib/config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ============================================================
// PORTAL ROUTER V2 — Intent-aware auto-redirect
// This is a NEW route that extends portal-router with intent
// support. The original /portal-router is NOT modified.
// ============================================================

export default async function PortalRouterV2Page() {
    try {
        const user = await getAuthUser();
        const email = user.email?.toLowerCase() || "";

        // ========================================
        // CRITICAL: Joshua → existing dashboard
        // ========================================
        if (email === config.adminEmail.toLowerCase()) {
            redirect("/dashboard");
        }

        // Check existing workspace memberships first
        const memberships = await getWorkspaceMemberships(user.id);

        if (memberships.length > 0) {
            const primary = memberships[0];
            const ws = primary.workspace;

            if (ws) {
                if (primary.role === "owner" || primary.role === "admin") {
                    redirect(`/w/${ws.slug}/admin`);
                }
                if (primary.role === "intern") {
                    redirect(`/w/${ws.slug}/intern`);
                }
                // Any other role — go to workspace admin as fallback
                redirect(`/w/${ws.slug}/admin`);
            }
        }

        // No workspace — check intent cookie
        const cookieStore = await cookies();
        const intent = cookieStore.get("portal_intent")?.value;

        if (intent && intent !== "marketplace" && intent !== "ai") {
            // Attempt to auto-create workspace based on intent
            const result = await ensureWorkspaceForUser(
                user.id,
                email,
                user.full_name,
                intent
            );

            // Clear the intent cookie after use
            cookieStore.delete("portal_intent");

            if (result.success && result.workspaceSlug) {
                // Workspace created — redirect to it
                if (intent === "intern") {
                    redirect(`/w/${result.workspaceSlug}/intern`);
                } else {
                    redirect(`/w/${result.workspaceSlug}/admin`);
                }
            }
        }

        // Route based on user profile role
        if (user.role === "admin") {
            redirect("/dashboard");
        }

        // Default fallback → existing dashboard
        redirect("/dashboard");
    } catch (error: any) {
        // If it's a redirect, let it through
        if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;

        // Any other error → safe fallback to dashboard
        console.error("[PortalRouterV2] Error:", error);
        redirect("/dashboard");
    }
}
