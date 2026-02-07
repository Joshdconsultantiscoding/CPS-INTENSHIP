import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createNotification, broadcastNotification, createBulkNotifications } from "@/lib/notifications/notification-service";
import { PriorityLevel, TargetType, NotificationType } from "@/lib/notifications/notification-types";

/**
 * POST /api/notifications/send
 * Admin-only endpoint for sending persistent notifications
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role
        const supabase = await createAdminClient();
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await req.json();
        const {
            targetType,
            targetUserId,
            targetGroupId,
            title,
            message,
            type,
            priorityLevel,
            repeatInterval,
            maxRepeats,
            expiresAt,
            link
        } = body;

        // Validation
        if (!title || !message) {
            return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
        }

        if (!["NORMAL", "IMPORTANT", "CRITICAL"].includes(priorityLevel)) {
            return NextResponse.json({ error: "Invalid priority level" }, { status: 400 });
        }

        let notification = null;

        switch (targetType as TargetType) {
            case "USER":
                if (!targetUserId) {
                    return NextResponse.json({ error: "Target user ID required" }, { status: 400 });
                }
                notification = await createNotification({
                    userId: targetUserId,
                    title,
                    message,
                    type: type as NotificationType || "system",
                    priorityLevel: priorityLevel as PriorityLevel,
                    targetType: "USER",
                    repeatInterval: repeatInterval || 0,
                    maxRepeats: maxRepeats || 0,
                    link,
                    expiresAt: expiresAt ? new Date(expiresAt) : undefined
                });
                break;

            case "GROUP":
                // Get all users in the group/department
                const { data: groupUsers } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("department", targetGroupId);

                if (groupUsers && groupUsers.length > 0) {
                    const userIds = groupUsers.map(u => u.id);
                    await createBulkNotifications(userIds, {
                        title,
                        message,
                        type: type as NotificationType || "system",
                        priorityLevel: priorityLevel as PriorityLevel,
                        targetType: "GROUP",
                        targetGroupId,
                        repeatInterval: repeatInterval || 0,
                        maxRepeats: maxRepeats || 0,
                        link,
                        expiresAt: expiresAt ? new Date(expiresAt) : undefined
                    });
                    notification = { sent: userIds.length };
                }
                break;

            case "INTERNS":
            case "ADMINS":
                // Get all users with the specific role
                const targetRole = targetType === "INTERNS" ? "intern" : "admin";
                const { data: roleUsers } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("role", targetRole);

                if (roleUsers && roleUsers.length > 0) {
                    const userIds = roleUsers.map(u => u.id);
                    await createBulkNotifications(userIds, {
                        title,
                        message,
                        type: type as NotificationType || "system",
                        priorityLevel: priorityLevel as PriorityLevel,
                        targetType: targetType,
                        repeatInterval: repeatInterval || 0,
                        maxRepeats: maxRepeats || 0,
                        link,
                        expiresAt: expiresAt ? new Date(expiresAt) : undefined
                    });
                    notification = { sent: userIds.length };
                }
                break;

            case "ALL":
                notification = await broadcastNotification({
                    title,
                    message,
                    type: type as NotificationType || "system",
                    priorityLevel: priorityLevel as PriorityLevel,
                    repeatInterval: repeatInterval || 0,
                    maxRepeats: maxRepeats || 0,
                    link,
                    expiresAt: expiresAt ? new Date(expiresAt) : undefined
                });
                break;

            default:
                return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
        }

        if (!notification) {
            return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
        }

        return NextResponse.json({ success: true, notification });
    } catch (error) {
        console.error("[API] Send notification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
