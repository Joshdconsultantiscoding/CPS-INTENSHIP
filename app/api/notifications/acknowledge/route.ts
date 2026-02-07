import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { acknowledgeNotification } from "@/lib/notifications/notification-service";

/**
 * POST /api/notifications/acknowledge
 * Acknowledge a CRITICAL notification
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { notificationId } = await req.json();

        if (!notificationId) {
            return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
        }

        const success = await acknowledgeNotification(notificationId, userId);

        return NextResponse.json({ success });
    } catch (error) {
        console.error("[API] Acknowledge notification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
