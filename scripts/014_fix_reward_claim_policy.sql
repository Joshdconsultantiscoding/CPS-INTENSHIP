-- FIX: Allow interns to claim rewards
-- The previous policy only allowed admins/team leads to grant achievements
-- 1. Correct policies for the 'achievements' table (junction)
DROP POLICY IF EXISTS "System can grant achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can claim rewards" ON public.achievements;
CREATE POLICY "Users can claim rewards" ON public.achievements FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- 2. Ensure users can see their own achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
CREATE POLICY "Users can view own achievements" ON public.achievements FOR
SELECT TO authenticated USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
-- 3. Also fix point_history (the ledger) just in case
-- The frontend doesn't push to point_history yet, the trigger does it (SECURITY DEFINER)
-- But if we ever want to allow direct insertion or viewing:
ALTER TABLE IF EXISTS public.point_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own point history" ON public.point_history;
CREATE POLICY "Users can view own point history" ON public.point_history FOR
SELECT TO authenticated USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );