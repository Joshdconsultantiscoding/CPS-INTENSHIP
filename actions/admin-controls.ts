"use server";

import { getAuthUser } from "@/lib/auth";
import { AdminControlsService } from "@/lib/services/admin-controls-service";
import { revalidatePath } from "next/cache";

/**
 * Suspend an intern's account.
 */
export async function suspendUserAction(targetId: string, reason: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        if (targetId === user.id) {
            return { success: false, error: "You cannot suspend your own account" };
        }

        const result = await AdminControlsService.suspendUser(user.id, targetId, reason);
        if (result.success) {
            revalidatePath("/dashboard/interns");
        }
        return result;
    } catch (error: any) {
        console.error("[suspendUserAction]", error);
        return { success: false, error: error.message || "Failed to suspend user" };
    }
}

/**
 * Unsuspend (restore) an intern's account.
 */
export async function unsuspendUserAction(targetId: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        const result = await AdminControlsService.unsuspendUser(user.id, targetId);
        if (result.success) {
            revalidatePath("/dashboard/interns");
        }
        return result;
    } catch (error: any) {
        console.error("[unsuspendUserAction]", error);
        return { success: false, error: error.message || "Failed to unsuspend user" };
    }
}

/**
 * Block specific routes for an intern.
 */
export async function blockRoutesAction(targetId: string, routes: string[]) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        const result = await AdminControlsService.blockRoutes(user.id, targetId, routes);
        if (result.success) {
            revalidatePath("/dashboard/interns");
        }
        return result;
    } catch (error: any) {
        console.error("[blockRoutesAction]", error);
        return { success: false, error: error.message || "Failed to update blocked routes" };
    }
}

/**
 * Soft-delete an intern's account.
 */
export async function deleteUserAction(targetId: string, reason: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        if (targetId === user.id) {
            return { success: false, error: "You cannot delete your own account" };
        }

        const result = await AdminControlsService.softDeleteUser(user.id, targetId, reason);
        if (result.success) {
            revalidatePath("/dashboard/interns");
        }
        return result;
    } catch (error: any) {
        console.error("[deleteUserAction]", error);
        return { success: false, error: error.message || "Failed to delete user" };
    }
}

/**
 * Restore a suspended/deleted intern.
 */
export async function restoreUserAction(targetId: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        const result = await AdminControlsService.restoreUser(user.id, targetId);
        if (result.success) {
            revalidatePath("/dashboard/interns");
        }
        return result;
    } catch (error: any) {
        console.error("[restoreUserAction]", error);
        return { success: false, error: error.message || "Failed to restore user" };
    }
}

/**
 * Fetch the admin audit log.
 */
export async function getAuditLogAction(filters?: {
    adminId?: string;
    targetUserId?: string;
    action?: string;
    limit?: number;
    offset?: number;
}) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized: Admin access required", data: [], total: 0 };
        }

        const result = await AdminControlsService.getAuditLog(filters);
        return { success: true, ...result };
    } catch (error: any) {
        console.error("[getAuditLogAction]", error);
        return { success: false, error: error.message, data: [], total: 0 };
    }
}
