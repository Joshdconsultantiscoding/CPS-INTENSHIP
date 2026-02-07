import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { incrementRepeatCount } from "@/lib/notifications/notification-service";

/**
 * POST /api/notifications/retry
 * Increment repeat count for IMPORTANT notification
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

        const newCount = await incrementRepeatCount(notificationId);

        return NextResponse.json({ success: true, repeatCount: newCount });
    } catch (error) {
        console.error("[API] Retry notification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
