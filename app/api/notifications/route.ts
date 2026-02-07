import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const supabase = await createAdminClient();

    // Fetch notifications where user_id matches OR it's a broadcast to all/interns/admins
    // Note: We'll refine this later with receipts if needed, but for history visibility this works.
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${userId},target_type.eq.ALL,target_type.eq.INTERNS,target_type.eq.ADMINS`)
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function PATCH(request: Request) {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("notifications")
        .update({
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq("user_id", userId)
        .eq("is_read", false);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
