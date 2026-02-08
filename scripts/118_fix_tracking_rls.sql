-- =============================================
-- 118_FIX_TRACKING_RLS.SQL
-- Ensure lesson_time_tracking is accessible for upsert
-- =============================================
-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users manage own time tracking" ON public.lesson_time_tracking;
-- Create a more robust policy
-- This allows users to SELECT and ALL (including UPSERT) their own data
-- We check for both auth.uid()::text and public.is_admin()
CREATE POLICY "Users manage own time tracking" ON public.lesson_time_tracking FOR ALL TO authenticated USING (
    user_id = auth.uid()::text
    OR public.is_admin()
) WITH CHECK (
    user_id = auth.uid()::text
    OR public.is_admin()
);
-- Ensure RLS is enabled
ALTER TABLE public.lesson_time_tracking ENABLE ROW LEVEL SECURITY;
-- Grant permissions explicitly just in case
GRANT ALL ON public.lesson_time_tracking TO authenticated;
GRANT ALL ON public.lesson_time_tracking TO service_role;