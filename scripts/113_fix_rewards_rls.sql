-- =============================================
-- FIX REWARDS RLS POLICIES (v6 - Server Actions Support)
-- =============================================
-- Strategy: Writes happen via Server Actions using Admin Client (bypassing RLS).
-- RLS is kept simple: All authenticated users can Read, Admins can Read/Write if needed, but primarily for safety.
-- 1. DATA TYPE FIX: Ensure achievements.user_id is TEXT (matches profiles.id)
DO $$ BEGIN
ALTER TABLE public.achievements
ALTER COLUMN user_id TYPE TEXT;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Could not alter achievements.user_id to TEXT: %',
SQLERRM;
END $$;
-- 2. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;
DROP POLICY IF EXISTS "Anyone can view rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can create rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can update rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can delete rewards" ON public.rewards;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users can claim rewards" ON public.achievements;
DROP POLICY IF EXISTS "Admins can view all achievements" ON public.achievements;
-- 3. REWARDS TABLE (Catalog)
-- Everyone authenticated can read
CREATE POLICY "authenticated_read_rewards" ON public.rewards FOR
SELECT TO authenticated USING (true);
-- Admin write protection (as a backup to Server Actions)
CREATE POLICY "admin_all_rewards" ON public.rewards FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE (
                email = (
                    select auth.jwt()->>'email'
                )
                OR id = (
                    select auth.jwt()->>'sub'
                )
            )
            AND role = 'admin'
    )
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE (
                email = (
                    select auth.jwt()->>'email'
                )
                OR id = (
                    select auth.jwt()->>'sub'
                )
            )
            AND role = 'admin'
    )
);
-- 4. ACHIEVEMENTS TABLE (User Claims)
-- Everyone authenticated can read their own
CREATE POLICY "authenticated_read_own_achievements" ON public.achievements FOR
SELECT TO authenticated USING (
        user_id = (
            select auth.jwt()->>'sub'
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE (
                    email = (
                        select auth.jwt()->>'email'
                    )
                    OR id = (
                        select auth.jwt()->>'sub'
                    )
                )
                AND role = 'admin'
        )
    );
-- Users can insert their own claims (matches Clerk ID in profile)
CREATE POLICY "authenticated_insert_own_achievements" ON public.achievements FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            select auth.jwt()->>'sub'
        )
    );
-- =============================================
-- ENSURE RLS IS ENABLED
-- =============================================
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;