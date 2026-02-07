import { createAdminClient } from "@/lib/supabase/server";
import * as Ably from "ably";
import { CreateNotificationParams, Notification, PriorityLevel, PRIORITY_SOUNDS } from "./notification-types";

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
 * Supports USER, GROUP, and ALL targeting with persistence and retry logic.
 */
export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
    try {
        const supabase = await createAdminClient();
        const priorityLevel = params.priorityLevel || 'NORMAL';
        const targetType = params.targetType || 'USER';

        // 1. Insert into database
        const { data: notification, error } = await supabase
            .from("notifications")
            .insert({
                user_id: params.userId || null,
                title: params.title,
                message: params.message,
                notification_type: params.type,
                link: params.link,
                icon: params.icon,
                sound: params.sound || PRIORITY_SOUNDS[priorityLevel],
                priority: params.priority || 'normal',
                priority_level: priorityLevel,
                target_type: targetType,
                target_group_id: params.targetGroupId || null,
                repeat_interval: params.repeatInterval || 0,
                max_repeats: params.maxRepeats || 0,
                repeat_count: 0,
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
        await publishNotification(notification, targetType, params.userId, params.targetGroupId);

        return notification as Notification;
    } catch (error) {
        console.error("Critical error in createNotification:", error);
        return null;
    }
}

/**
 * Publish notification to appropriate Ably channels based on target type.
 */
async function publishNotification(
    notification: any,
    targetType: string,
    userId?: string | null,
    groupId?: string | null
) {
    const ably = getAblyAdmin();
    if (!ably) return;

    try {
        switch (targetType) {
            case 'USER':
                if (userId) {
                    const userChannel = ably.channels.get(`notifications:${userId}`);
                    await userChannel.publish("notification", notification);
                }
                break;

            case 'GROUP':
                if (groupId) {
                    const groupChannel = ably.channels.get(`notifications:group:${groupId}`);
                    await groupChannel.publish("notification", notification);
                }
                break;

            case 'ALL':
                const allChannel = ably.channels.get("notifications:all");
                await allChannel.publish("notification", notification);
                break;

            case 'INTERNS':
                const internsChannel = ably.channels.get("notifications:interns");
                await internsChannel.publish("notification", notification);
                break;

            case 'ADMINS':
                const adminsChannel = ably.channels.get("notifications:admins");
                await adminsChannel.publish("notification", notification);
                break;
        }

        console.log(`[NotificationService] Published ${notification.priority_level} notification to ${targetType}`);
    } catch (ablyError) {
        console.error("Ably publish failed (non-fatal):", ablyError);
    }
}

/**
 * Bulk create notifications for multiple users.
 */
export async function createBulkNotifications(userIds: string[], params: Omit<CreateNotificationParams, 'userId'>) {
    const promises = userIds.map(userId => createNotification({ ...params, userId }));
    return Promise.all(promises);
}

/**
 * Send notification to ALL users (broadcast).
 */
export async function broadcastNotification(params: Omit<CreateNotificationParams, 'userId' | 'targetType'>) {
    return createNotification({
        ...params,
        userId: null,
        targetType: 'ALL'
    });
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
        .or(`user_id.eq.${userId},target_type.eq.ALL`);

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
        .or(`user_id.eq.${userId},target_type.eq.ALL`)
        .eq("is_read", false);

    return !error;
}

/**
 * Acknowledge a CRITICAL notification (allows user to dismiss it).
 */
export async function acknowledgeNotification(notificationId: string, userId: string) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("notifications")
        .update({
            acknowledged: true,
            acknowledged_at: new Date().toISOString(),
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq("id", notificationId)
        .or(`user_id.eq.${userId},target_type.eq.ALL`)
        .eq("priority_level", "CRITICAL");

    return !error;
}

/**
 * Increment repeat count for IMPORTANT notifications (called by retry engine).
 */
export async function incrementRepeatCount(notificationId: string): Promise<number> {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("notifications")
        .update({
            last_shown_at: new Date().toISOString()
        })
        .eq("id", notificationId)
        .select("repeat_count")
        .single();

    if (error) {
        console.error("Error incrementing repeat count:", error);
        return 0;
    }

    // Use RPC for atomic increment
    const { data: newCount } = await supabase.rpc("increment_notification_repeat", {
        p_notification_id: notificationId
    });

    return newCount || 0;
}

/**
 * Get pending notifications for a user (called on login for offline recovery).
 */
export async function getPendingNotifications(userId: string): Promise<Notification[]> {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${userId},target_type.eq.ALL`)
        .eq("is_read", false)
        .eq("is_dismissed", false)
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("priority_level", { ascending: true }) // CRITICAL first
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching pending notifications:", error);
        return [];
    }

    return (data || []) as Notification[];
}

/**
 * Get IMPORTANT notifications that need retry.
 */
export async function getNotificationsNeedingRetry(userId: string): Promise<Notification[]> {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${userId},target_type.eq.ALL`)
        .eq("priority_level", "IMPORTANT")
        .eq("is_read", false)
        .eq("is_read", false);

    if (error) {
        console.error("Error fetching retry notifications:", error);
        return [];
    }

    // Filter where repeat_count < max_repeats
    return (data || []).filter((n: any) => n.repeat_count < n.max_repeats) as Notification[];
}
