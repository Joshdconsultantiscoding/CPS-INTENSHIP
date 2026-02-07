import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/profiles/update-version
 * Update user's last_seen_version in Supabase
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { version } = await req.json();
        if (!version) return NextResponse.json({ error: "Missing version" }, { status: 400 });

        const supabase = await createAdminClient();
        const { error } = await supabase
            .from("profiles")
            .update({ last_seen_version: version })
            .eq("id", userId);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
