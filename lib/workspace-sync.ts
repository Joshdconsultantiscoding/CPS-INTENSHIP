"use server";

import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/server";
import {
    createWorkspace,
    getWorkspacesByOwnerId,
    addWorkspaceMember,
} from "@/lib/workspace";
import type { WorkspaceType } from "@/lib/types/workspace";

// ============================================================
// WORKSPACE SYNC — Multi-Tenant SaaS Extension
// Automatically creates workspaces for new signups.
// This is a NEW file. It does NOT modify profile-sync.ts.
// ============================================================

/**
 * Ensure a workspace exists for a user (if they need one).
 *
 * SAFETY:
 * - Joshua (super admin) ALWAYS skips this — his account never gets a workspace.
 * - Interns don't create workspaces — they get invited into one.
 * - Admins, Mentors, Companies, Recruiters auto-create a workspace on first use.
 */
export async function ensureWorkspaceForUser(
    userId: string,
    email: string,
    fullName: string,
    role: string
): Promise<{
    success: boolean;
    workspaceSlug: string | null;
    error: string | null;
}> {
    try {
        // ========================================
        // CRITICAL: Joshua skip-guard
        // Super admin NEVER gets a workspace
        // ========================================
        if (email.toLowerCase() === config.adminEmail.toLowerCase()) {
            return { success: true, workspaceSlug: null, error: null };
        }

        // Interns don't create workspaces — they join existing ones
        if (role === "intern") {
            // Check if the intern already belongs to a workspace
            const supabase = await createAdminClient();
            const { data: memberships } = await supabase
                .from("workspace_members")
                .select("workspace_id, workspace:workspaces(slug)")
                .eq("user_id", userId)
                .limit(1);

            if (memberships && memberships.length > 0) {
                const ws = (memberships[0] as any)?.workspace;
                return {
                    success: true,
                    workspaceSlug: ws?.slug || null,
                    error: null,
                };
            }

            // No workspace assigned yet — that's OK for interns
            return { success: true, workspaceSlug: null, error: null };
        }

        // For admins, mentors, companies, recruiters — check if they already own a workspace
        const existingWorkspaces = await getWorkspacesByOwnerId(userId);
        if (existingWorkspaces.length > 0) {
            return {
                success: true,
                workspaceSlug: existingWorkspaces[0].slug,
                error: null,
            };
        }

        // Determine workspace type from role
        const typeMap: Record<string, WorkspaceType> = {
            admin: "admin",
            mentor: "mentor",
            company: "company",
            recruiter: "recruiter",
        };

        const workspaceType = typeMap[role.toLowerCase()];
        if (!workspaceType) {
            // Unknown role — don't create a workspace, just skip
            console.warn(
                `[WorkspaceSync] Unknown role "${role}" for user ${userId}, skipping workspace creation`
            );
            return { success: true, workspaceSlug: null, error: null };
        }

        // Create workspace
        const workspaceName = `${fullName || "My"}'s Workspace`;
        const { workspace, error } = await createWorkspace(
            workspaceName,
            workspaceType,
            userId
        );

        if (error || !workspace) {
            console.error(`[WorkspaceSync] Failed to create workspace for ${userId}:`, error);
            return { success: false, workspaceSlug: null, error };
        }

        console.log(
            `[WorkspaceSync] Created workspace "${workspace.name}" (${workspace.slug}) for user ${userId}`
        );

        return {
            success: true,
            workspaceSlug: workspace.slug,
            error: null,
        };
    } catch (err: any) {
        console.error("[WorkspaceSync] Unexpected error:", err);
        return { success: false, workspaceSlug: null, error: err.message };
    }
}
