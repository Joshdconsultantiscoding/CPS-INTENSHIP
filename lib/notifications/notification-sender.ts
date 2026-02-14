import { createAdminClient } from "@/lib/supabase/server";
import { getAblyAdmin } from "@/lib/ably-server";
import { CreateNotificationParams, Notification } from "./notification-types";

/**
 * Sends a notification to a specific user or group.
 * Persists to Supabase and broadcasts via Ably.
 */
/**
 * Broadcasts a status update (e.g. read, acknowledged) for an existing notification.
 */
export async function broadcastNotificationStatusUpdate(userId: string, data: { id: string, acknowledged?: boolean, is_read?: boolean }) {
    const ably = getAblyAdmin();
    if (!ably) return;

    try {
        const channelName = `notifications:${userId}`;
        const channel = ably.channels.get(channelName);
        await channel.publish("notification_update", data);
        console.log(`[NotificationSender] Published status update to ${channelName}:`, data);
    } catch (error) {
        console.error("[NotificationSender] Failed to broadcast status update:", error);
    }
}

export async function sendNotification(params: CreateNotificationParams) {
    const supabase = await createAdminClient();
    const ably = getAblyAdmin();

    const notificationData = {
        user_id: params.userId || null,
        title: params.title,
        message: params.message,
        notification_type: params.type,
        link: params.link,
        icon: params.icon,
        sound: params.sound,
        priority: params.priority || 'normal',
        priority_level: params.priorityLevel || 'NORMAL',
        target_type: params.targetType || (params.userId ? 'USER' : 'ALL'),
        metadata: params.metadata || {},
        repeat_interval: params.repeatInterval || 0,
        max_repeats: params.maxRepeats || 0,
        expires_at: params.expiresAt?.toISOString(),
    };

    // 1. Persist to Database
    const { data, error } = await supabase
        .from("notifications")
        .insert(notificationData)
        .select()
        .single();

    if (error) {
        console.error("[NotificationSender] Failed to persist notification:", error);
        return { success: false, error: error.message };
    }

    const notification = data as Notification;

    // 2. Broadcast via Ably
    if (ably) {
        try {
            let channelName = `notifications:${notification.user_id}`;

            // Determine channel based on target
            if (notification.target_type === 'ADMINS') {
                channelName = "notifications:admins";
            } else if (notification.target_type === 'INTERNS') {
                channelName = "notifications:interns";
            } else if (notification.target_type === 'ALL') {
                channelName = "notifications:all";
            }

            const channel = ably.channels.get(channelName);
            await channel.publish("notification", notification);
            console.log(`[NotificationSender] Published to ${channelName}`);
        } catch (ablyError) {
            console.error("[NotificationSender] Failed to publish to Ably:", ablyError);
            // Non-fatal, DB persistence succeeded
        }
    }

    return { success: true, notification };
}
