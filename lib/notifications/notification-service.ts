import { createAdminClient } from "@/lib/supabase/server";
import * as Ably from "ably";
import { CreateNotificationParams, Notification } from "./notification-types";

// Ably client singleton for server-side publishing
let ablyAdmin: Ably.Rest | null = null;

const getAblyAdmin = () => {
    if (!ablyAdmin && process.env.ABLY_API_KEY) {
        ablyAdmin = new Ably.Rest({ key: process.env.ABLY_API_KEY });
    }
    return ablyAdmin;
};

/**
 * Core service for creating and delivering notifications.
 * Handles database insertion and real-time publishing via Ably.
 */
export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
    try {
        const supabase = await createAdminClient();

        // 1. Insert into database
        const { data: notification, error } = await supabase
            .from("notifications")
            .insert({
                user_id: params.userId,
                title: params.title,
                message: params.message,
                notification_type: params.type,
                link: params.link,
                icon: params.icon,
                sound: params.sound || getDefaultSound(params.type),
                priority: params.priority || 'normal',
                metadata: params.metadata || {},
                expires_at: params.expiresAt?.toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating notification in DB:", error);
            return null;
        }

        // 2. Publish to Ably for Real-time delivery
        const ably = getAblyAdmin();
        if (ably) {
            try {
                // Channel strategy:
                // Specific user: user-notifications:{userId}
                const channel = ably.channels.get(`user-notifications:${params.userId}`);
                await channel.publish("new-notification", notification);

                // If it's a broadcast or system notification, we might publish elsewhere
                if (params.type === 'system' || params.metadata?.broadcast) {
                    const globalChannel = ably.channels.get("announcements:global");
                    await globalChannel.publish("announcement", notification);
                }
            } catch (ablyError) {
                console.error("Ably publish failed (non-fatal):", ablyError);
            }
        }

        return notification as Notification;
    } catch (error) {
        console.error("Critical error in createNotification:", error);
        return null;
    }
}

/**
 * Bulk create notifications for multiple users (e.g., all admins).
 */
export async function createBulkNotifications(userIds: string[], params: Omit<CreateNotificationParams, 'userId'>) {
    const promises = userIds.map(userId => createNotification({ ...params, userId }));
    return Promise.all(promises);
}

/**
 * Mark a notification as read.
 */
export async function markAsRead(notificationId: string, userId: string) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("notifications")
        .update({
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq("id", notificationId)
        .eq("user_id", userId);

    return !error;
}

/**
 * Mark all user notifications as read.
 */
export async function markAllAsRead(userId: string) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("notifications")
        .update({
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq("user_id", userId)
        .eq("is_read", false);

    return !error;
}

/**
 * Helper to determine default sound based on type
 */
function getDefaultSound(type: string): string {
    switch (type) {
        case 'success':
        case 'reward':
        case 'achievement':
            return 'success';
        case 'warning':
        case 'deadline':
        case 'error':
            return 'warning';
        case 'task':
        case 'class':
            return 'task';
        case 'message':
            return 'message';
        default:
            return 'notification';
    }
}
