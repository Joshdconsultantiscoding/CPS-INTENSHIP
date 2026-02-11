import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-side access guard for route-level access checking.
 * Used in individual page Server Components to validate access before rendering.
 */
export async function checkAccess(userId: string, currentPath: string): Promise<{
    allowed: boolean;
    status: string;
    reason?: string;
}> {
    const supabase = await createAdminClient();

    const { data } = await supabase
        .from("profiles")
        .select("account_status, suspended_reason, blocked_routes")
        .eq("id", userId)
        .maybeSingle();

    if (!data) {
        return { allowed: true, status: "active" };
    }

    const status = data.account_status || "active";

    // Suspended users can only access /dashboard (to see suspend message)
    if (status === "suspended") {
        if (currentPath !== "/dashboard") {
            return {
                allowed: false,
                status: "suspended",
                reason: data.suspended_reason || "Your account has been suspended.",
            };
        }
        return { allowed: true, status: "suspended", reason: data.suspended_reason };
    }

    // Deleted users should be redirected entirely
    if (status === "deleted") {
        return {
            allowed: false,
            status: "deleted",
            reason: "Your account has been deactivated. Please contact support.",
        };
    }

    // Check blocked routes
    const blockedRoutes: string[] = data.blocked_routes || [];
    if (blockedRoutes.length > 0) {
        const isBlocked = blockedRoutes.some((route: string) =>
            currentPath.startsWith(route)
        );
        if (isBlocked) {
            return {
                allowed: false,
                status: "blocked",
                reason: "You do not have access to this section.",
            };
        }
    }

    return { allowed: true, status: "active" };
}

/**
 * Enforce access — redirect if not allowed.
 * For use inside Server Components at the top of the render function.
 */
export async function enforceAccess(userId: string, currentPath: string) {
    const access = await checkAccess(userId, currentPath);

    if (!access.allowed) {
        if (access.status === "deleted") {
            redirect("/sign-in");
        }
        redirect(`/dashboard?restricted=true&reason=${encodeURIComponent(access.reason || "")}`);
    }

    return access;
}
