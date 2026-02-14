import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role")?.toLowerCase();

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const supabase = await createAdminClient();

    // Construct OR query dynamically based on role
    let orQuery = `user_id.eq.${userId},target_type.eq.ALL`;

    if (role === 'admin') {
        orQuery += `,target_type.eq.ADMINS`;
    } else if (role === 'intern') {
        orQuery += `,target_type.eq.INTERNS`;
    }

    // Fallback: If no role provided, just fetch basic + user specific (or we could fetch all if we want to be loose)
    // But better to be strict if we can.
    // If we want to simulate the previous behavior which fetched EVERYTHING:
    if (!role) {
        orQuery += `,target_type.eq.ADMINS,target_type.eq.INTERNS`;
    }

    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(orQuery)
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

    // Note: Broadcast notifications (user_id=null) won't be marked as read on server without a separate read-tracking table.
    // They will reappear as unread on page refresh. This is a known limitation for now.

    return NextResponse.json({ success: true });
}
