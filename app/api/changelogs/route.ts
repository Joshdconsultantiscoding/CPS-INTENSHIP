import { NextResponse } from "next/server";
import { ChangelogService } from "@/lib/changelog/changelog-service";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";

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
        const user = await currentUser();
        if (!userId || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Verify admin status
        const supabase = await createAdminClient();
        const { data: profile } = await supabase
            .from("profiles")
            .select("id, role")
            .eq("user_id", userId)
            .single();

        const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase();
        const isAdminEmail = userEmail === config.adminEmail.toLowerCase();
        const hasAdminRole = profile?.role === "admin" || profile?.role === "owner";

        if (!isAdminEmail && !hasAdminRole) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const profileId = profile?.id || userId; // Fallback to userId if profile not found (unlikely but safe)

        const body = await req.json();
        const result = await ChangelogService.publishRelease(body, profileId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result.data);
    } catch (error) {
        console.error("[API] Changelog POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
