import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/server";

// ============================================================
// SUPER ADMIN — MENTORS API — /api/super/mentors
// CRUD for mentor management
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
            .from("mentors")
            .select("*, workspace:workspaces(*)")
            .order("created_at", { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ mentors: data || [] });
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
            .from("mentors")
            .select("id")
            .eq("email", email.toLowerCase())
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: "Mentor with this email already exists" }, { status: 409 });
        }

        const { data: mentor, error } = await supabase
            .from("mentors")
            .insert({
                user_id: `mentor_${Date.now()}`,
                full_name: fullName,
                email: email.toLowerCase(),
                skills: skills || [],
                is_active: true,
            })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        await supabase.from("system_logs").insert({
            action: "mentor_created",
            actor: config.adminEmail,
            target_type: "mentor",
            target_id: mentor.id,
            metadata: { fullName, email },
        });

        return NextResponse.json({ success: true, mentor });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        if (!(await verifySuperAdmin())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const body = await request.json();
        const { mentorId, isActive, workspaceId } = body;

        if (!mentorId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

        const supabase = await createAdminClient();
        const updates: Record<string, any> = { updated_at: new Date().toISOString() };

        if (typeof isActive === "boolean") updates.is_active = isActive;
        if (workspaceId !== undefined) updates.workspace_id = workspaceId;

        const { error } = await supabase.from("mentors").update(updates).eq("id", mentorId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
        const { mentorId } = body;

        if (!mentorId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

        const supabase = await createAdminClient();
        const { error } = await supabase.from("mentors").delete().eq("id", mentorId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
