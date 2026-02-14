"use server";

import { getAuthUser } from "@/lib/auth";
import { AppealsService } from "@/lib/services/appeals-service";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { sendNotification, broadcastNotificationStatusUpdate } from "@/lib/notifications/notification-sender";

export async function submitAppealAction(reason: string, type: 'suspension' | 'route_block' = 'suspension', targetRoute?: string) {
    try {
        const user = await getAuthUser();
        // Allow suspended/blocked users to submit appeals

        const result = await AppealsService.createAppeal(user.id, user.email || "", reason, type, targetRoute);
        if (result.success) {
            revalidatePath("/suspended");
            if (targetRoute) revalidatePath(targetRoute);

            // Notify Admins
            await sendNotification({
                title: type === 'suspension' ? "New Suspension Appeal" : "New Route Block Appeal",
                message: type === 'suspension'
                    ? `${user.full_name} has submitted a suspension appeal.`
                    : `${user.full_name} is appealing access to ${targetRoute}.`,
                type: "warning",
                targetType: "ADMINS",
                link: "/dashboard/appeals",
                priorityLevel: "IMPORTANT",
                metadata: {
                    appealId: user.id,
                    type,
                    targetRoute
                }
            });
        }
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function reviewAppealAction(appealId: string, status: 'approved' | 'rejected' | 'ignored', notes?: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const result = await AppealsService.reviewAppeal(appealId, user.id, status, notes);
        if (result.success) {
            // Fetch appeal to get user_id for notification
            const appeal = await AppealsService.getAppealById(appealId);

            if (appeal) {
                const supabase = await createAdminClient();

                if (status === 'approved') {
                    // 1. Auto-acknowledge any pending "Account Suspended" (CRITICAL) notifications
                    // so the user doesn't see the red modal after being restored.

                    // First fetch them so we know which IDs to broadcast
                    const { data: criticalNotifications } = await supabase
                        .from("notifications")
                        .select("id")
                        .eq("user_id", appeal.user_id)
                        .eq("priority_level", "CRITICAL")
                        .eq("acknowledged", false);

                    if (criticalNotifications && criticalNotifications.length > 0) {
                        // 1. DELETE all traces of "Account Suspended" (CRITICAL) notifications
                        // This fulfills "remove every trace" requirement.
                        const { error: delError } = await supabase
                            .from("notifications")
                            .delete()
                            .eq("user_id", appeal.user_id)
                            .eq("priority_level", "CRITICAL")
                            .eq("title", "Account Suspended")
                            .eq("acknowledged", false);

                        if (!delError) {
                            // Signal real-time dismissal for each deleted notification
                            for (const n of criticalNotifications) {
                                await broadcastNotificationStatusUpdate(appeal.user_id, {
                                    id: n.id,
                                    acknowledged: true
                                });
                            }
                        }
                    }

                    // 2. Send "Appeal Approved" notification
                    await sendNotification({
                        userId: appeal.user_id,
                        title: "Appeal Approved",
                        message: "Your appeal has been approved. You can now log in.",
                        type: "success",
                        link: "/dashboard",
                        priorityLevel: "IMPORTANT",
                        sound: "success"
                    });
                } else if (status === 'rejected') {
                    await sendNotification({
                        userId: appeal.user_id,
                        title: "Appeal Rejected",
                        message: "Your appeal was rejected. Please contact support for further assistance.",
                        type: "error",
                        link: "/suspended",
                        priorityLevel: "IMPORTANT",
                        sound: "warning"
                    });
                }
            }

            revalidatePath("/dashboard/admin/appeals");
            revalidatePath("/dashboard/interns");
        }
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
