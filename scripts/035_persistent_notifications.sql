-- Persistent Notifications System Migration
-- Adds NORMAL, IMPORTANT, CRITICAL levels with retry logic and offline recovery
-- 1. Add new columns for persistent notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'NORMAL' CHECK (
        priority_level IN ('NORMAL', 'IMPORTANT', 'CRITICAL')
    ),
    ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'USER' CHECK (target_type IN ('USER', 'GROUP', 'ALL')),
    ADD COLUMN IF NOT EXISTS target_group_id UUID REFERENCES public.profiles(id) ON DELETE
SET NULL,
    ADD COLUMN IF NOT EXISTS repeat_interval INTEGER DEFAULT 0,
    -- minutes between retries
ADD COLUMN IF NOT EXISTS max_repeats INTEGER DEFAULT 0,
    -- max retry count
ADD COLUMN IF NOT EXISTS repeat_count INTEGER DEFAULT 0,
    -- current retry count
ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE,
    -- for critical notifications
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_shown_at TIMESTAMPTZ;
-- 2. Create index for unacknowledged critical notifications
CREATE INDEX IF NOT EXISTS idx_notifications_critical_unack ON public.notifications(user_id, priority_level, acknowledged)
WHERE priority_level = 'CRITICAL'
    AND acknowledged = FALSE;
-- 3. Create index for important notifications needing retry
CREATE INDEX IF NOT EXISTS idx_notifications_important_retry ON public.notifications(
    user_id,
    priority_level,
    is_read,
    repeat_count,
    max_repeats
)
WHERE priority_level = 'IMPORTANT'
    AND is_read = FALSE;
-- 4. Function to get pending notifications for a user (called on login)
CREATE OR REPLACE FUNCTION public.get_pending_notifications(p_user_id UUID) RETURNS SETOF public.notifications AS $$ BEGIN RETURN QUERY
SELECT *
FROM public.notifications n
WHERE (
        -- User-specific notifications
        (n.user_id = p_user_id)
        OR -- Broadcast to all
        (
            n.target_type = 'ALL'
            AND (
                n.user_id IS NULL
                OR n.user_id = p_user_id
            )
        )
    )
    AND n.is_read = FALSE
    AND n.is_dismissed = FALSE
    AND (
        n.expires_at IS NULL
        OR n.expires_at > NOW()
    )
ORDER BY CASE
        n.priority_level
        WHEN 'CRITICAL' THEN 1
        WHEN 'IMPORTANT' THEN 2
        ELSE 3
    END,
    n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 5. Function to acknowledge a critical notification
CREATE OR REPLACE FUNCTION public.acknowledge_notification(p_notification_id UUID, p_user_id UUID) RETURNS BOOLEAN AS $$
DECLARE v_success BOOLEAN := FALSE;
BEGIN
UPDATE public.notifications
SET acknowledged = TRUE,
    acknowledged_at = NOW(),
    is_read = TRUE,
    read_at = NOW()
WHERE id = p_notification_id
    AND (
        user_id = p_user_id
        OR target_type = 'ALL'
    )
    AND priority_level = 'CRITICAL';
GET DIAGNOSTICS v_success = ROW_COUNT;
RETURN v_success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 6. Function to increment repeat count for IMPORTANT notifications
CREATE OR REPLACE FUNCTION public.increment_notification_repeat(p_notification_id UUID) RETURNS INTEGER AS $$
DECLARE v_new_count INTEGER;
BEGIN
UPDATE public.notifications
SET repeat_count = repeat_count + 1,
    last_shown_at = NOW()
WHERE id = p_notification_id
    AND priority_level = 'IMPORTANT'
RETURNING repeat_count INTO v_new_count;
RETURN COALESCE(v_new_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 7. Create broadcast notifications table for ALL type (tracks who has seen it)
CREATE TABLE IF NOT EXISTS public.notification_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    acknowledged BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notification_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_notification_receipts_user ON public.notification_receipts(user_id, is_read);
-- 8. Enable RLS on notification_receipts
ALTER TABLE public.notification_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own receipts" ON public.notification_receipts FOR
SELECT TO authenticated USING (user_id = auth.uid()::uuid);
CREATE POLICY "System can insert receipts" ON public.notification_receipts FOR
INSERT TO authenticated WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "Users can update own receipts" ON public.notification_receipts FOR
UPDATE TO authenticated USING (user_id = auth.uid()::uuid);