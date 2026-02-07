import { NextResponse } from "next/server";
import { ChangelogService } from "@/lib/changelog/changelog-service";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/changelogs
 * Fetch all release notes
 */
export async function GET() {
    try {
        const changelogs = await ChangelogService.getChangelogs();
        return NextResponse.json(changelogs);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch changelogs" }, { status: 500 });
    }
}

/**
 * POST /api/changelogs
 * Create a new release (Admin only)
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Verify admin status
        const supabase = await createAdminClient();
        const { data: profile } = await supabase
            .from("profiles")
            .select("id, role")
            .eq("user_id", userId)
            .single();

        if (!profile || (profile.role !== "admin" && profile.role !== "owner")) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const result = await ChangelogService.publishRelease(body, profile.id);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result.data);
    } catch (error) {
        console.error("[API] Changelog POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
