import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/server";

// ============================================================
// SUPER ADMIN — INTERNS API — /api/super/interns
// CRUD for intern pool management + workspace assignment
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

export async function GET() {
    try {
        if (!(await verifySuperAdmin())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("intern_pool")
            .select("*, assigned_workspace:workspaces(*)")
            .order("created_at", { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ interns: data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!(await verifySuperAdmin())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const body = await request.json();
        const { fullName, email, skills } = body;

        if (!fullName || !email) {
            return NextResponse.json({ error: "fullName and email required" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        const { data: existing } = await supabase
            .from("intern_pool")
            .select("id")
            .eq("email", email.toLowerCase())
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: "Intern with this email already exists" }, { status: 409 });
        }

        const { data: intern, error } = await supabase
            .from("intern_pool")
            .insert({
                user_id: `intern_${Date.now()}`,
                full_name: fullName,
                email: email.toLowerCase(),
                skills: skills || [],
                is_active: true,
            })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        await supabase.from("system_logs").insert({
            action: "intern_added_to_pool",
            actor: config.adminEmail,
            target_type: "intern",
            target_id: intern.id,
            metadata: { fullName, email },
        });

        return NextResponse.json({ success: true, intern });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH — Update intern (toggle active, assign to workspace)
 * Body: { internId, isActive?, assignedWorkspaceId? }
 */
export async function PATCH(request: NextRequest) {
    try {
        if (!(await verifySuperAdmin())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const body = await request.json();
        const { internId, isActive, assignedWorkspaceId } = body;

        if (!internId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

        const supabase = await createAdminClient();
        const updates: Record<string, any> = { updated_at: new Date().toISOString() };

        if (typeof isActive === "boolean") updates.is_active = isActive;
        if (assignedWorkspaceId !== undefined) updates.assigned_workspace_id = assignedWorkspaceId;

        const { error } = await supabase.from("intern_pool").update(updates).eq("id", internId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // If assigning to workspace, also add workspace membership
        if (assignedWorkspaceId) {
            const { data: intern } = await supabase
                .from("intern_pool")
                .select("user_id")
                .eq("id", internId)
                .single();

            if (intern) {
                await supabase.from("workspace_members").upsert(
                    {
                        workspace_id: assignedWorkspaceId,
                        user_id: intern.user_id,
                        role: "intern",
                    },
                    { onConflict: "workspace_id,user_id" }
                );
            }

            await supabase.from("system_logs").insert({
                action: "intern_assigned",
                actor: config.adminEmail,
                target_type: "intern",
                target_id: internId,
                metadata: { assignedWorkspaceId },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        if (!(await verifySuperAdmin())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const body = await request.json();
        const { internId } = body;

        if (!internId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

        const supabase = await createAdminClient();
        const { error } = await supabase.from("intern_pool").delete().eq("id", internId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
