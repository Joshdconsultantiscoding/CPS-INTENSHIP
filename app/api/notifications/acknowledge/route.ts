import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { notificationId } = await request.json();

    if (!notificationId) {
        return NextResponse.json({ error: "Missing notificationId" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // 1. Get the notification to find user_id and title
    const { data: notification, error: fetchError } = await supabase
        .from("notifications")
        .select("user_id, title, priority_level")
        .eq("id", notificationId)
        .single();

    if (fetchError || !notification) {
        // Even if not found, return success so UI unblocks
        console.warn("Notification not found during acknowledge:", notificationId);
        return NextResponse.json({ success: true });
    }

    // 2. Mark specific notification as acknowledged
    // AND mark all other CRITICAL notifications with the SAME title for this user as acknowledged
    // This prevents "duplicate" alerts from popping up sequentially
    // We only clear duplicates if the notification IS critical.
    let query = supabase
        .from("notifications")
        .update({
            acknowledged: true,
            acknowledged_at: new Date().toISOString(),
            is_read: true,
            read_at: new Date().toISOString()
        });

    if (notification.priority_level === 'CRITICAL') {
        // Clear duplicates
        query = query
            .eq("user_id", notification.user_id)
            .eq("priority_level", "CRITICAL")
            .eq("title", notification.title)
            .eq("acknowledged", false);
    } else {
        // Just clear this one
        query = query.eq("id", notificationId);
    }

    const { error } = await query;

    if (error) {
        console.error("Failed to acknowledge notification:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Broadcast real-time update so other tabs/devices clear the modal
    if (notification.user_id) {
        await broadcastNotificationStatusUpdate(notification.user_id, {
            id: notificationId,
            acknowledged: true
        });
    }

    return NextResponse.json({ success: true });
}
