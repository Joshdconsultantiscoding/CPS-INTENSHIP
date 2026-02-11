import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/server";
import { createWorkspace } from "@/lib/workspace";

// ============================================================
// SUPER ADMIN — ADMINS API — /api/super/admins
// CRUD for admin management with auto workspace provisioning
// This is a NEW API route. Does NOT modify any existing APIs.
// ============================================================

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
 * GET — List all admins with workspace info
 */
export async function GET() {
    try {
        const isSuperAdmin = await verifySuperAdmin();
        if (!isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("admins")
            .select("*, workspace:workspaces(*)")
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ admins: data || [] });
    } catch (error: any) {
        console.error("[SuperAdmin Admins API] GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST — Create a new admin with auto workspace provisioning
 *
 * Body: { fullName, email, companyName }
 *
 * Flow:
 * 1. Generate slug from companyName or fullName
 * 2. Create workspace (type: admin)
 * 3. Insert admin record
 * 4. Create profile record if needed
 * 5. Add workspace membership
 * 6. Log the action
 */
export async function POST(request: NextRequest) {
    try {
        const isSuperAdmin = await verifySuperAdmin();
        if (!isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { fullName, email, companyName } = body;

        if (!fullName || !email) {
            return NextResponse.json(
                { error: "fullName and email are required" },
                { status: 400 }
            );
        }

        const supabase = await createAdminClient();

        // Check if admin with this email already exists
        const { data: existing } = await supabase
            .from("admins")
            .select("id")
            .eq("email", email.toLowerCase())
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: "An admin with this email already exists" },
                { status: 409 }
            );
        }

        // Generate unique slug
        const slugBase = companyName || fullName;
        const slug = generateSlug(slugBase);

        // Create workspace
        const workspaceName = companyName
            ? `${companyName}`
            : `${fullName}'s Workspace`;

        // Use a placeholder user_id — will be updated when admin logs in via Clerk
        const placeholderUserId = `pending_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const { workspace, error: wsError } = await createWorkspace(
            workspaceName,
            "admin",
            placeholderUserId
        );

        if (wsError || !workspace) {
            return NextResponse.json(
                { error: `Workspace creation failed: ${wsError}` },
                { status: 500 }
            );
        }

        // Insert admin record
        const { data: admin, error: adminError } = await supabase
            .from("admins")
            .insert({
                user_id: placeholderUserId,
                workspace_id: workspace.id,
                slug: workspace.slug,
                email: email.toLowerCase(),
                full_name: fullName,
                company_name: companyName || null,
                is_active: true,
            })
            .select()
            .single();

        if (adminError) {
            // Cleanup: delete the workspace if admin insert Failed
            await supabase.from("workspaces").delete().eq("id", workspace.id);
            return NextResponse.json(
                { error: `Admin creation failed: ${adminError.message}` },
                { status: 500 }
            );
        }

        // Log the action
        await supabase.from("system_logs").insert({
            action: "admin_created",
            actor: config.adminEmail,
            target_type: "admin",
            target_id: admin.id,
            metadata: {
                fullName,
                email,
                companyName,
                slug: workspace.slug,
                workspaceId: workspace.id,
            },
        });

        return NextResponse.json({
            success: true,
            admin: { ...admin, workspace },
        });
    } catch (error: any) {
        console.error("[SuperAdmin Admins API] POST error:", error);
        return NextResponse.json(
            { error: error.message || "Internal error" },
            { status: 500 }
        );
    }
}

/**
 * PATCH — Toggle admin active/inactive
 * Body: { adminId, isActive }
 */
export async function PATCH(request: NextRequest) {
    try {
        const isSuperAdmin = await verifySuperAdmin();
        if (!isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { adminId, isActive } = body;

        if (!adminId || typeof isActive !== "boolean") {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Update admin
        const { error: adminError } = await supabase
            .from("admins")
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq("id", adminId);

        if (adminError) {
            return NextResponse.json({ error: adminError.message }, { status: 500 });
        }

        // Also toggle workspace
        const { data: admin } = await supabase
            .from("admins")
            .select("workspace_id")
            .eq("id", adminId)
            .single();

        if (admin?.workspace_id) {
            await supabase
                .from("workspaces")
                .update({ is_active: isActive, updated_at: new Date().toISOString() })
                .eq("id", admin.workspace_id);
        }

        // Log
        await supabase.from("system_logs").insert({
            action: isActive ? "admin_activated" : "admin_deactivated",
            actor: config.adminEmail,
            target_type: "admin",
            target_id: adminId,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[SuperAdmin Admins API] PATCH error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE — Remove admin and their workspace
 * Body: { adminId }
 */
export async function DELETE(request: NextRequest) {
    try {
        const isSuperAdmin = await verifySuperAdmin();
        if (!isSuperAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { adminId } = body;

        if (!adminId) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Get admin's workspace
        const { data: admin } = await supabase
            .from("admins")
            .select("workspace_id, email, full_name")
            .eq("id", adminId)
            .single();

        // Delete admin record
        const { error: deleteError } = await supabase
            .from("admins")
            .delete()
            .eq("id", adminId);

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // Delete workspace if exists
        if (admin?.workspace_id) {
            await supabase.from("workspaces").delete().eq("id", admin.workspace_id);
        }

        // Log
        await supabase.from("system_logs").insert({
            action: "admin_deleted",
            actor: config.adminEmail,
            target_type: "admin",
            target_id: adminId,
            metadata: { email: admin?.email, fullName: admin?.full_name },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[SuperAdmin Admins API] DELETE error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
