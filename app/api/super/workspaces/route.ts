import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { config } from "@/lib/config";
import { toggleWorkspaceActive, deleteWorkspace } from "@/lib/workspace";

// ============================================================
// SUPER ADMIN WORKSPACE API — /api/super/workspaces
// This is a NEW API route. Does NOT modify any existing APIs.
// ============================================================

/**
 * Verify the caller is the super admin (Joshua).
 */
async function verifySuperAdmin(): Promise<boolean> {
    try {
        const { userId } = await auth();
        if (!userId) return false;

        const user = await currentUser();
        if (!user) return false;

        const email = user.emailAddresses[0]?.emailAddress?.toLowerCase() || "";
        return email === config.adminEmail.toLowerCase();
    } catch {
        return false;
    }
}

/**
 * PATCH — Toggle workspace active/disabled
 */
export async function PATCH(request: NextRequest) {
    try {
        const isSuperAdmin = await verifySuperAdmin();
        if (!isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { workspaceId, isActive } = body;

        if (!workspaceId || typeof isActive !== "boolean") {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const result = await toggleWorkspaceActive(workspaceId, isActive);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[SuperAdmin API] PATCH error:", error);
        return NextResponse.json(
            { error: error.message || "Internal error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE — Delete a workspace
 */
export async function DELETE(request: NextRequest) {
    try {
        const isSuperAdmin = await verifySuperAdmin();
        if (!isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { workspaceId } = body;

        if (!workspaceId) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const result = await deleteWorkspace(workspaceId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[SuperAdmin API] DELETE error:", error);
        return NextResponse.json(
            { error: error.message || "Internal error" },
            { status: 500 }
        );
    }
}
