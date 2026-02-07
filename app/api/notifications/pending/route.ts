import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPendingNotifications } from "@/lib/notifications/notification-service";

/**
 * GET /api/notifications/pending
 * Fetch pending notifications for current user (offline recovery)
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notifications = await getPendingNotifications(userId);

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("[API] Pending notifications error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
