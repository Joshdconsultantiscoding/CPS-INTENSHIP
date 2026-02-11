import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceBySlug } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { WorkspaceAdminDashboard } from "@/components/workspace/workspace-admin-dashboard";

// ============================================================
// WORKSPACE ADMIN PAGE — /w/[slug]/admin
// This is a NEW route. Does NOT modify existing /dashboard.
// ============================================================

export const dynamic = "force-dynamic";

export default async function WorkspaceAdminPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    try {
        const { userId } = await auth();
        if (!userId) redirect("/auth/sign-in");

        const { slug } = await params;
        const workspace = await getWorkspaceBySlug(slug);
        if (!workspace) redirect("/portal-router");

        const supabase = await createAdminClient();

        // Verify membership and role
        const { data: membership } = await supabase
            .from("workspace_members")
            .select("*")
            .eq("workspace_id", workspace.id)
            .eq("user_id", userId)
            .single();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            redirect("/portal-router");
        }

        // Fetch workspace-scoped stats — filtered by workspace_id
        // For now, workspace-scoped tables don't exist yet, so we show zeros
        // This will be populated as workspace-scoped data tables are added
        const stats = {
            totalInterns: 0,
            totalTasks: 0,
            pendingReports: 0,
            completedTasks: 0,
        };

        // Try to count workspace members with intern role
        try {
            const { count } = await supabase
                .from("workspace_members")
                .select("id", { count: "exact", head: true })
                .eq("workspace_id", workspace.id)
                .eq("role", "intern");
            stats.totalInterns = count || 0;
        } catch {
            // Non-fatal
        }

        return (
            <WorkspaceShell
                workspaceName={workspace.name}
                workspaceSlug={workspace.slug}
                memberRole={membership.role}
            >
                <WorkspaceAdminDashboard
                    workspaceName={workspace.name}
                    workspaceSlug={workspace.slug}
                    stats={stats}
                />
            </WorkspaceShell>
        );
    } catch (error: any) {
        if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
        console.error("[WorkspaceAdminPage] Error:", error);
        redirect("/portal-router");
    }
}
