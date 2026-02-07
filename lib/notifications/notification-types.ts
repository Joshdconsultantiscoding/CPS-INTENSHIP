// Notification Types with Persistent/Retry Support

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

// NEW: Priority levels for persistent notifications
export type PriorityLevel = 'NORMAL' | 'IMPORTANT' | 'CRITICAL';

// NEW: Target types for notification delivery
export type TargetType = 'USER' | 'GROUP' | 'ALL';

export interface Notification {
    id: string;
    user_id: string | null;
    title: string;
    message: string;
    notification_type: NotificationType;
    link?: string;
    icon?: string;
    sound?: string;
    priority: NotificationPriority;
    priority_level: PriorityLevel;
    target_type: TargetType;
    is_read: boolean;
    is_dismissed: boolean;
    metadata: Record<string, any>;
    created_at: string;
    read_at?: string;
    expires_at?: string;
    // Retry fields
    repeat_interval: number; // minutes
    max_repeats: number;
    repeat_count: number;
    last_shown_at?: string;
    // Critical acknowledgment
    acknowledged: boolean;
    acknowledged_at?: string;
}

export interface CreateNotificationParams {
    userId?: string | null; // null for ALL/GROUP targets
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    icon?: string;
    sound?: string;
    priority?: NotificationPriority;
    priorityLevel?: PriorityLevel;
    targetType?: TargetType;
    targetGroupId?: string;
    repeatInterval?: number; // minutes
    maxRepeats?: number;
    metadata?: Record<string, any>;
    expiresAt?: Date;
}

// Sound mappings for priority levels
export const PRIORITY_SOUNDS: Record<PriorityLevel, string> = {
    NORMAL: 'notification',
    IMPORTANT: 'warning',
    CRITICAL: 'alarm'
};

// Toast colors for priority levels
export const PRIORITY_COLORS: Record<PriorityLevel, { bg: string; border: string; text: string }> = {
    NORMAL: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
    IMPORTANT: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' },
    CRITICAL: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' }
};
