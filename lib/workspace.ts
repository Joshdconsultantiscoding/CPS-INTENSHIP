"use server";

import { createAdminClient } from "@/lib/supabase/server";
import type {
    Workspace,
    WorkspaceMember,
    WorkspaceType,
    WorkspaceMemberRole,
} from "@/lib/types/workspace";

// ============================================================
// WORKSPACE UTILITIES — Multi-Tenant SaaS Extension
// These are NEW functions. They do NOT modify any existing code.
// ============================================================

/**
 * Generate a URL-safe slug from a name.
 * Appends a short random suffix to ensure uniqueness.
 */
function generateSlug(name: string): string {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .substring(0, 40);

    const suffix = Math.random().toString(36).substring(2, 6);
    return `${base}-${suffix}`;
}

/**
 * Create a new workspace and assign the owner as a member.
 */
export async function createWorkspace(
    name: string,
    type: WorkspaceType,
    ownerId: string
): Promise<{ workspace: Workspace | null; error: string | null }> {
    try {
        const supabase = await createAdminClient();
        const slug = generateSlug(name);

        // 1. Insert workspace
        const { data: workspace, error: wsError } = await supabase
            .from("workspaces")
            .insert({
                name,
                slug,
                type,
                owner_id: ownerId,
                is_active: true,
                settings: {},
            })
            .select()
            .single();

        if (wsError || !workspace) {
            console.error("[Workspace] Creation failed:", wsError);
            return { workspace: null, error: wsError?.message || "Unknown error" };
        }

        // 2. Add owner as a member
        const { error: memberError } = await supabase
            .from("workspace_members")
            .insert({
                workspace_id: workspace.id,
                user_id: ownerId,
                role: "owner" as WorkspaceMemberRole,
            });

        if (memberError) {
            console.error("[Workspace] Owner membership failed:", memberError);
            // Workspace was created but membership failed — still return workspace
        }

        return { workspace: workspace as Workspace, error: null };
    } catch (err: any) {
        console.error("[Workspace] Unexpected error:", err);
        return { workspace: null, error: err.message };
    }
}

/**
 * Get a workspace by its slug.
 */
export async function getWorkspaceBySlug(
    slug: string
): Promise<Workspace | null> {
    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("workspaces")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", true)
            .single();

        if (error || !data) return null;
        return data as Workspace;
    } catch {
        return null;
    }
}

/**
 * Get all workspaces owned by a specific user.
 */
export async function getWorkspacesByOwnerId(
    ownerId: string
): Promise<Workspace[]> {
    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("workspaces")
            .select("*")
            .eq("owner_id", ownerId)
            .order("created_at", { ascending: false });

        if (error || !data) return [];
        return data as Workspace[];
    } catch {
        return [];
    }
}

/**
 * Get all workspace memberships for a user.
 */
export async function getWorkspaceMemberships(
    userId: string
): Promise<(WorkspaceMember & { workspace: Workspace })[]> {
    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("workspace_members")
            .select("*, workspace:workspaces(*)")
            .eq("user_id", userId);

        if (error || !data) return [];

        // Filter out inactive workspaces
        return (data as any[]).filter(
            (m) => m.workspace && m.workspace.is_active
        );
    } catch {
        return [];
    }
}

/**
 * Add a member to a workspace.
 */
export async function addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceMemberRole = "member"
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase.from("workspace_members").insert({
            workspace_id: workspaceId,
            user_id: userId,
            role,
        });

        if (error) {
            // Duplicate membership is not an error
            if (error.code === "23505") return { success: true, error: null };
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Get all workspaces (Super Admin only).
 */
export async function getAllWorkspaces(): Promise<Workspace[]> {
    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("workspaces")
            .select("*")
            .order("created_at", { ascending: false });

        if (error || !data) return [];
        return data as Workspace[];
    } catch {
        return [];
    }
}

/**
 * Toggle workspace active status.
 */
export async function toggleWorkspaceActive(
    workspaceId: string,
    isActive: boolean
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from("workspaces")
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq("id", workspaceId);

        if (error) return { success: false, error: error.message };
        return { success: true, error: null };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Delete a workspace and all its members (CASCADE).
 */
export async function deleteWorkspace(
    workspaceId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase
            .from("workspaces")
            .delete()
            .eq("id", workspaceId);

        if (error) return { success: false, error: error.message };
        return { success: true, error: null };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
