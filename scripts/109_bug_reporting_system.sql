-- Bug Reporting System (Robust Migration v3)
-- This script creates the table for site feedback and bug reports
-- It handles missing tables gracefully to prevent errors during first-time setup
-- 1. Create the table first so that policies can be attached to it
CREATE TABLE IF NOT EXISTS public.bug_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    screenshot_urls TEXT [] DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'fixed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Cleanup old policies if they exist (Done after table creation to avoid "relation does not exist")
DO $$ BEGIN DROP POLICY IF EXISTS "Admins can view all bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Admins can update bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Interns can insert bug reports" ON public.bug_reports;
DROP POLICY IF EXISTS "Admins can view all bug reports v2" ON public.bug_reports;
DROP POLICY IF EXISTS "Admins can update bug reports v2" ON public.bug_reports;
DROP POLICY IF EXISTS "Interns can insert bug reports v2" ON public.bug_reports;
EXCEPTION
WHEN undefined_table THEN -- Extra safety: do nothing if the table somehow doesn't exist
NULL;
END $$;
-- 3. Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
-- 4. Re-create RLS Policies
CREATE POLICY "Admins can view all bug reports v2" ON public.bug_reports FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
CREATE POLICY "Admins can update bug reports v2" ON public.bug_reports FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
CREATE POLICY "Interns can insert bug reports v2" ON public.bug_reports FOR
INSERT WITH CHECK (auth.uid()::text = user_id);
-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS update_bug_reports_updated_at ON public.bug_reports;
CREATE TRIGGER update_bug_reports_updated_at BEFORE
UPDATE ON public.bug_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();