import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/server";

// ============================================================
// SUPER ADMIN — COMPANIES API — /api/super/companies
// CRUD for company management
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
            .from("companies")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ companies: data || [] });
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
        const { companyName, email, industry, website } = body;

        if (!companyName || !email) {
            return NextResponse.json({ error: "companyName and email required" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        const { data: existing } = await supabase
            .from("companies")
            .select("id")
            .eq("email", email.toLowerCase())
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: "Company with this email already exists" }, { status: 409 });
        }

        const { data: company, error } = await supabase
            .from("companies")
            .insert({
                user_id: `company_${Date.now()}`,
                company_name: companyName,
                email: email.toLowerCase(),
                industry: industry || null,
                website: website || null,
                is_active: true,
            })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        await supabase.from("system_logs").insert({
            action: "company_created",
            actor: config.adminEmail,
            target_type: "company",
            target_id: company.id,
            metadata: { companyName, email },
        });

        return NextResponse.json({ success: true, company });
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
        const { companyId, isActive } = body;

        if (!companyId || typeof isActive !== "boolean") {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const supabase = await createAdminClient();
        const { error } = await supabase
            .from("companies")
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq("id", companyId);

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
        const { companyId } = body;

        if (!companyId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

        const supabase = await createAdminClient();
        const { error } = await supabase.from("companies").delete().eq("id", companyId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
