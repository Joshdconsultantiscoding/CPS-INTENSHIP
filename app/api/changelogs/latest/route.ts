import { NextResponse } from "next/server";
import { ChangelogService } from "@/lib/changelog/changelog-service";

/**
 * GET /api/changelogs/latest
 * Fetch the single latest release note
 */
export async function GET() {
    try {
        const changelog = await ChangelogService.getLatestRelease();
        return NextResponse.json(changelog);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch latest release" }, { status: 500 });
    }
}
