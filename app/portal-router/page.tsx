import { getAuthUser } from "@/lib/auth";
import { getWorkspaceMemberships } from "@/lib/workspace";
import { config } from "@/lib/config";
import { redirect } from "next/navigation";

// ============================================================
// PORTAL ROUTER — Auto-redirect users to their correct portal
// This is a NEW route. It does NOT modify any existing routes.
// ============================================================

export default async function PortalRouterPage() {
    try {
        const user = await getAuthUser();
        const email = user.email?.toLowerCase() || "";

        // ========================================
        // CRITICAL: Joshua → existing dashboard
        // ========================================
        if (email === config.adminEmail.toLowerCase()) {
            redirect("/dashboard");
        }

        // Check workspace memberships
        const memberships = await getWorkspaceMemberships(user.id);

        if (memberships.length > 0) {
            const primary = memberships[0];
            const ws = primary.workspace;

            if (ws) {
                // Route based on member role in the workspace
                if (primary.role === "owner" || primary.role === "admin") {
                    redirect(`/w/${ws.slug}/admin`);
                }
                if (primary.role === "intern") {
                    redirect(`/w/${ws.slug}/intern`);
                }
            }
        }

        // Route based on user profile role for non-workspace portals
        if (user.role === "admin") {
            // New admin without a workspace yet → fallback to dashboard
            redirect("/dashboard");
        }

        // Default fallback → existing dashboard
        redirect("/dashboard");
    } catch (error: any) {
        // If it's a redirect, let it through
        if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;

        // Any other error → safe fallback to dashboard
        console.error("[PortalRouter] Error:", error);
        redirect("/dashboard");
    }
}
