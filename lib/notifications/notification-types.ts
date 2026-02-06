export type NotificationType =
    | 'info'
    | 'warning'
    | 'success'
    | 'error'
    | 'task'
    | 'report'
    | 'message'
    | 'reward'
    | 'event'
    | 'class'
    | 'deadline'
    | 'achievement'
    | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    notification_type: NotificationType;
    link?: string;
    icon?: string;
    sound?: string;
    priority: NotificationPriority;
    is_read: boolean;
    is_dismissed: boolean;
    metadata: Record<string, any>;
    created_at: string;
    read_at?: string;
    expires_at?: string;
}

export interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    icon?: string;
    sound?: string;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
    expiresAt?: Date;
}
