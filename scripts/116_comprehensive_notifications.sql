-- Comprehensive Notifications System Migration
-- Enhances the existing notifications table with professional features
-- 1. Add missing columns to notifications table
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS link TEXT,
    ADD COLUMN IF NOT EXISTS icon TEXT,
    ADD COLUMN IF NOT EXISTS sound TEXT DEFAULT 'notification',
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
-- 2. Update existing type constraints or ensure they are flexible
-- We use notification_type for architectural grouping, but title/message carry the weight
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_notification_type_check CHECK (
        notification_type IN (
            'info',
            'warning',
            'success',
            'error',
            'task',
            'report',
            'message',
            'reward',
            'event',
            'class',
            'deadline',
            'achievement',
            'system'
        )
    );
-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read)
WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_dismissed ON public.notifications(user_id, is_dismissed)
WHERE is_dismissed = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
-- 4. TTL (Time To Live) Cleanup Routine
-- Note: This is a helper function; actual cleanup would be via pg_cron or edge function
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications() RETURNS void AS $$ BEGIN
DELETE FROM public.notifications
WHERE expires_at < NOW()
    OR (
        is_read = TRUE
        AND created_at < NOW() - INTERVAL '30 days'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 5. Helper function for creating a system notification for all admins
CREATE OR REPLACE FUNCTION public.notify_all_admins(
        p_title TEXT,
        p_message TEXT,
        p_type TEXT,
        p_link TEXT DEFAULT NULL,
        p_metadata JSONB DEFAULT '{}'
    ) RETURNS void AS $$
DECLARE admin_id UUID;
BEGIN FOR admin_id IN (
    SELECT id
    FROM public.profiles
    WHERE role = 'admin'
) LOOP
INSERT INTO public.notifications (
        user_id,
        title,
        message,
        notification_type,
        link,
        metadata
    )
VALUES (
        admin_id,
        p_title,
        p_message,
        p_type,
        p_link,
        p_metadata
    );
END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 6. Ensure Realtime is enabled for notifications
-- This allows Supabase Realtime as a fallback, though we use Ably primarily
ALTER publication supabase_realtime
ADD TABLE public.notifications;