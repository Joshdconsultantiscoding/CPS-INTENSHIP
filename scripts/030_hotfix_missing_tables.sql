-- 030_hotfix_missing_tables.sql
-- Fixes missing course_assignments table and missing progress status
-- 1. CREATE COURSE ASSIGNMENTS TABLE
-- This was referenced in scripts 028 and 029 but never actually created.
CREATE TABLE IF NOT EXISTS public.course_assignments (
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (course_id, user_id)
);
-- 2. ENABLE RLS FOR COURSE ASSIGNMENTS
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
-- Admins can do everything
CREATE POLICY "Admins manage course assignments" ON public.course_assignments FOR ALL TO authenticated USING (public.is_admin());
-- Users can view their own course assignments
CREATE POLICY "Users view own course assignments" ON public.course_assignments FOR
SELECT TO authenticated USING (auth.uid()::text = user_id);
-- 3. UPDATE COURSE PROGRESS SCHEMA
-- Add 'status' column which is filtered for in analytics views
ALTER TABLE public.course_progress
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('in-progress', 'completed'));
-- 4. RE-VALIDATE VIEW (In case it failed previously)
CREATE OR REPLACE VIEW public.intern_course_access AS
SELECT DISTINCT c.*
FROM public.courses c
    LEFT JOIN public.course_assignments ca ON c.id = ca.course_id
    LEFT JOIN public.class_courses cc ON c.id = cc.course_id
    LEFT JOIN public.class_enrollments ce ON cc.class_id = ce.class_id
WHERE (
        c.is_published = true
        OR public.is_admin()
    )
    AND (
        c.assignment_type = 'global'
        OR ca.user_id = auth.uid()::text
        OR ce.user_id = auth.uid()::text
    );