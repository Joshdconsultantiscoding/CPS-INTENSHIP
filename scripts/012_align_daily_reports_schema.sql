-- Align Daily Reports Schema with Frontend requirements
-- This script adds missing columns and standardizes names
-- Standardize hours column first to avoid conflicts
DO $$ BEGIN -- Case 1: time_spent_hours exists but hours_worked doesn't -> Rename
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_reports'
        AND column_name = 'time_spent_hours'
)
AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_reports'
        AND column_name = 'hours_worked'
) THEN
ALTER TABLE public.daily_reports
    RENAME COLUMN time_spent_hours TO hours_worked;
-- Case 2: both exist -> Migrate data and drop the old one
ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_reports'
        AND column_name = 'time_spent_hours'
)
AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_reports'
        AND column_name = 'hours_worked'
) THEN
UPDATE public.daily_reports
SET hours_worked = COALESCE(hours_worked, time_spent_hours);
ALTER TABLE public.daily_reports DROP COLUMN time_spent_hours;
END IF;
END $$;
-- 1. CLEANUP: Remove old columns
ALTER TABLE public.daily_reports DROP COLUMN IF EXISTS tasks_assigned,
    DROP COLUMN IF EXISTS tasks_completed;
-- 2. SCHEMA: Ensure all columns exist with proper types and defaults
ALTER TABLE public.daily_reports
ADD COLUMN IF NOT EXISTS tasks_completed TEXT [] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS tasks_in_progress TEXT [] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS blockers TEXT,
    ADD COLUMN IF NOT EXISTS learnings TEXT,
    ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT 'neutral',
    ADD COLUMN IF NOT EXISTS hours_worked NUMERIC(5, 2) DEFAULT 8,
    ADD COLUMN IF NOT EXISTS admin_rating INTEGER,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.daily_reports
ALTER COLUMN status
SET DEFAULT 'draft';
-- Policies update for Daily Reports
DROP POLICY IF EXISTS "Users can view own reports" ON public.daily_reports;
CREATE POLICY "Users can view own reports" ON public.daily_reports FOR
SELECT TO authenticated USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
DROP POLICY IF EXISTS "Users can insert own reports" ON public.daily_reports;
CREATE POLICY "Users can insert own reports" ON public.daily_reports FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own reports" ON public.daily_reports;
CREATE POLICY "Users can update own reports" ON public.daily_reports FOR
UPDATE TO authenticated USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );