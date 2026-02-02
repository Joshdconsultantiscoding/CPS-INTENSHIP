-- 032_fix_messaging_rls.sql
-- Restore RLS policies for messages and channels after the text ID migration
BEGIN;
-- 1. MESSAGES TABLE
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- Drop any existing partial policies
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;
-- RLS: Select (View)
-- Users can see messages where they are sender, recipient, or if it's a channel they are in
CREATE POLICY "Users can view messages" ON public.messages FOR
SELECT USING (
        auth.uid()::text = sender_id
        OR auth.uid()::text = recipient_id
        OR (
            channel_id IS NOT NULL
            AND channel_id IN (
                SELECT id
                FROM public.channels
                WHERE auth.uid()::text = ANY(members)
            )
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
-- RLS: Insert (Send)
CREATE POLICY "Users can insert messages" ON public.messages FOR
INSERT WITH CHECK (auth.uid()::text = sender_id);
-- RLS: Update (Mark Read)
CREATE POLICY "Users can update messages" ON public.messages FOR
UPDATE USING (
        auth.uid()::text = sender_id
        OR auth.uid()::text = recipient_id
    );
-- 2. CHANNELS TABLE
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view channels" ON public.channels;
DROP POLICY IF EXISTS "Admins can manage channels" ON public.channels;
-- RLS: Select (View)
CREATE POLICY "Users can view channels" ON public.channels FOR
SELECT USING (
        auth.uid()::text = ANY(members)
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
-- RLS: Admin Manage
CREATE POLICY "Admins can manage channels" ON public.channels FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
            AND role = 'admin'
    )
);
COMMIT;