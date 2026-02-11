import { createAdminClient } from "@/lib/supabase/server";

export interface AuditLogEntry {
    id: string;
    admin_id: string;
    target_user_id: string;
    action: string;
    reason: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface AuditLogFilters {
    adminId?: string;
    targetUserId?: string;
    action?: string;
    limit?: number;
    offset?: number;
}

/**
 * AdminControlsService — User lifecycle management for admins.
 */
export class AdminControlsService {
    /**
     * Suspend a user account.
     */
    static async suspendUser(
        adminId: string,
        targetId: string,
        reason: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("profiles")
            .update({
                account_status: "suspended",
                suspended_at: new Date().toISOString(),
                suspended_reason: reason,
            })
            .eq("id", targetId);

        if (error) {
            console.error("[AdminControls] suspendUser error:", error);
            return { success: false, error: error.message };
        }

        await this.logAction(adminId, targetId, "suspend", reason);
        return { success: true };
    }

    /**
     * Unsuspend (restore) a suspended user.
     */
    static async unsuspendUser(
        adminId: string,
        targetId: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("profiles")
            .update({
                account_status: "active",
                suspended_at: null,
                suspended_reason: null,
            })
            .eq("id", targetId);

        if (error) {
            console.error("[AdminControls] unsuspendUser error:", error);
            return { success: false, error: error.message };
        }

        await this.logAction(adminId, targetId, "unsuspend", null);
        return { success: true };
    }

    /**
     * Block specific routes for a user.
     */
    static async blockRoutes(
        adminId: string,
        targetId: string,
        routes: string[]
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("profiles")
            .update({
                account_status: routes.length > 0 ? "blocked" : "active",
                blocked_routes: routes,
            })
            .eq("id", targetId);

        if (error) {
            console.error("[AdminControls] blockRoutes error:", error);
            return { success: false, error: error.message };
        }

        const action = routes.length > 0 ? "block" : "unblock";
        await this.logAction(adminId, targetId, action, null, { routes });
        return { success: true };
    }

    /**
     * Soft-delete a user (mark as deleted).
     */
    static async softDeleteUser(
        adminId: string,
        targetId: string,
        reason: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("profiles")
            .update({
                account_status: "deleted",
                deleted_at: new Date().toISOString(),
                suspended_reason: reason,
            })
            .eq("id", targetId);

        if (error) {
            console.error("[AdminControls] softDeleteUser error:", error);
            return { success: false, error: error.message };
        }

        await this.logAction(adminId, targetId, "delete", reason, { type: "soft" });
        return { success: true };
    }

    /**
     * Restore a soft-deleted user.
     */
    static async restoreUser(
        adminId: string,
        targetId: string
    ): Promise<{ success: boolean; error?: string }> {
        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("profiles")
            .update({
                account_status: "active",
                deleted_at: null,
                suspended_at: null,
                suspended_reason: null,
                blocked_routes: [],
            })
            .eq("id", targetId);

        if (error) {
            console.error("[AdminControls] restoreUser error:", error);
            return { success: false, error: error.message };
        }

        await this.logAction(adminId, targetId, "restore", null);
        return { success: true };
    }

    /**
     * Get the account status of a user.
     */
    static async getAccountStatus(
        userId: string
    ): Promise<{
        status: string;
        suspendedAt?: string;
        suspendedReason?: string;
        blockedRoutes?: string[];
    } | null> {
        const supabase = await createAdminClient();

        const { data } = await supabase
            .from("profiles")
            .select("account_status, suspended_at, suspended_reason, blocked_routes")
            .eq("id", userId)
            .maybeSingle();

        if (!data) return null;

        return {
            status: data.account_status || "active",
            suspendedAt: data.suspended_at,
            suspendedReason: data.suspended_reason,
            blockedRoutes: data.blocked_routes || [],
        };
    }

    /**
     * Get paginated audit log.
     */
    static async getAuditLog(
        filters: AuditLogFilters = {}
    ): Promise<{ data: AuditLogEntry[]; total: number }> {
        const supabase = await createAdminClient();
        const { limit = 50, offset = 0 } = filters;

        let query = supabase
            .from("admin_audit_log")
            .select("*", { count: "exact" });

        if (filters.adminId) query = query.eq("admin_id", filters.adminId);
        if (filters.targetUserId) query = query.eq("target_user_id", filters.targetUserId);
        if (filters.action) query = query.eq("action", filters.action);

        const { data, count, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error("[AdminControls] getAuditLog error:", error);
            return { data: [], total: 0 };
        }

        return { data: data || [], total: count || 0 };
    }

    /**
     * Log an admin action for audit trail.
     */
    private static async logAction(
        adminId: string,
        targetUserId: string,
        action: string,
        reason: string | null,
        metadata: Record<string, unknown> = {}
    ): Promise<void> {
        const supabase = await createAdminClient();

        const { error } = await supabase.from("admin_audit_log").insert({
            admin_id: adminId,
            target_user_id: targetUserId,
            action,
            reason,
            metadata,
        });

        if (error) {
            console.error("[AdminControls] Failed to log audit action:", error);
        }
    }
}
