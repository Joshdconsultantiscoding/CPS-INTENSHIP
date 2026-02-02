-- 029_deep_classroom_management.sql
-- Extensions for Deep Classroom Management (Phase 11)
-- 1. EXTEND CLASSES TABLE
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS icon_url TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'locked'));
-- 2. CREATE CLASS-SPECIFIC COURSE ASSIGNMENTS
-- This allows assigning courses to specific classes only
CREATE TABLE IF NOT EXISTS public.class_courses (
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    deadline TIMESTAMPTZ,
    PRIMARY KEY (class_id, course_id)
);
-- 3. RLS POLICIES FOR CLASS_COURSES
ALTER TABLE public.class_courses ENABLE ROW LEVEL SECURITY;
-- Admins can do everything
CREATE POLICY "Admins manage class courses" ON public.class_courses FOR ALL TO authenticated USING (public.is_admin());
-- Interns can view courses assigned to their classes
CREATE POLICY "Interns view assigned class courses" ON public.class_courses FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.class_enrollments
            WHERE class_id = public.class_courses.class_id
                AND user_id = auth.uid()::text
        )
    );
-- 4. UPDATE INTERN ACCESS LOGIC
-- Interns should see courses in Marketplace IF:
-- - Course is global
-- - OR Course is selectively assigned to THEM (individually)
-- - OR Course is assigned to a CLASS they are in
CREATE OR REPLACE VIEW public.intern_course_access AS
SELECT DISTINCT c.*
FROM public.courses c
    LEFT JOIN public.course_assignments ca ON c.id = ca.course_id
    LEFT JOIN public.class_courses cc ON c.id = cc.course_id
    LEFT JOIN public.class_enrollments ce ON cc.class_id = ce.class_id
WHERE c.is_published = true
    AND (
        c.assignment_type = 'global'
        OR ca.user_id = auth.uid()::text
        OR ce.user_id = auth.uid()::text
    );