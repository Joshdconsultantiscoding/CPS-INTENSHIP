import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkspaceBySlug } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { WorkspaceInternDashboard } from "@/components/workspace/workspace-intern-dashboard";

// ============================================================
// WORKSPACE INTERN PAGE — /w/[slug]/intern
// This is a NEW route. Does NOT modify existing /dashboard.
// ============================================================

export const dynamic = "force-dynamic";

export default async function WorkspaceInternPage({
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

        // Verify membership
        const { data: membership } = await supabase
            .from("workspace_members")
            .select("*")
            .eq("workspace_id", workspace.id)
            .eq("user_id", userId)
            .single();

        if (!membership) redirect("/portal-router");

        // Fetch user profile
        const clerkUser = await currentUser();
        const internName = clerkUser
            ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Intern"
            : "Intern";

        // Workspace-scoped stats (placeholder — will be enriched)
        const stats = {
            totalTasks: 0,
            completedTasks: 0,
            pendingReports: 0,
            streak: 0,
        };

        return (
            <WorkspaceShell
                workspaceName={workspace.name}
                workspaceSlug={workspace.slug}
                memberRole={membership.role}
            >
                <WorkspaceInternDashboard
                    workspaceName={workspace.name}
                    internName={internName}
                    stats={stats}
                />
            </WorkspaceShell>
        );
    } catch (error: any) {
        if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
        console.error("[WorkspaceInternPage] Error:", error);
        redirect("/portal-router");
    }
}
