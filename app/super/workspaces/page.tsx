import { getAllWorkspaces } from "@/lib/workspace";
import { SuperAdminShell } from "@/components/super/super-admin-shell";
import { WorkspaceTable } from "@/components/super/workspace-table";

// ============================================================
// SUPER ADMIN WORKSPACES PAGE — /super/workspaces
// This is a NEW route. Does NOT modify any existing routes.
// ============================================================

export default async function SuperAdminWorkspacesPage() {
    const workspaces = await getAllWorkspaces();

    return (
        <SuperAdminShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Workspace Management
                    </h1>
                    <p className="text-gray-400 mt-1">
                        View, enable/disable, and manage all workspaces on the platform.
                    </p>
                </div>

                <div className="bg-gray-900 border border-white/5 rounded-xl p-6">
                    <WorkspaceTable workspaces={workspaces} />
                </div>
            </div>
        </SuperAdminShell>
    );
}
