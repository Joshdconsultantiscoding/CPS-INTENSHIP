// ============================================================
// WORKSPACE TYPES — Multi-Tenant SaaS Extension
// These are NEW types. They do NOT modify any existing types.
// ============================================================

export type WorkspaceType = "admin" | "mentor" | "company" | "recruiter" | "ai";

export type WorkspaceMemberRole = "owner" | "admin" | "member" | "intern";

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    type: WorkspaceType;
    owner_id: string;
    is_active: boolean;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: WorkspaceMemberRole;
    joined_at: string;
    // Joined fields
    workspace?: Workspace;
}

export interface WorkspaceWithMembers extends Workspace {
    members: WorkspaceMember[];
    member_count?: number;
}

export interface WorkspaceContext {
    workspace: Workspace;
    currentMember: WorkspaceMember;
}
