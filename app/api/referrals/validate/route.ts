import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/referrals/validate?code=XXXXXXXX
 * Public endpoint to validate a referral code (used during signup).
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json(
                { valid: false, error: "No code provided" },
                { status: 400 }
            );
        }

        const supabase = await createAdminClient();
        const { data } = await supabase
            .from("referral_codes")
            .select("user_id, code")
            .eq("code", code.toUpperCase())
            .maybeSingle();

        if (!data) {
            return NextResponse.json({ valid: false, error: "Invalid referral code" });
        }

        // Get referrer name for display
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", data.user_id)
            .single();

        return NextResponse.json({
            valid: true,
            referrer: {
                name: profile?.full_name || "A CPS Intern",
                avatar: profile?.avatar_url,
            },
        });
    } catch (error) {
        console.error("[/api/referrals/validate] Error:", error);
        return NextResponse.json(
            { valid: false, error: "Server error" },
            { status: 500 }
        );
    }
}
