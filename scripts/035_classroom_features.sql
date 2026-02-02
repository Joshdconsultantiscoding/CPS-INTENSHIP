-- =============================================
-- 035_CLASSROOM_FEATURES.SQL
-- Schema for Class-specific Tasks, Submissions, and Courses
-- =============================================
BEGIN;
-- 1. CLASS TASKS
CREATE TABLE IF NOT EXISTS public.class_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ,
    submission_type TEXT DEFAULT 'text' CHECK (
        submission_type IN ('text', 'link', 'file', 'all')
    ),
    created_by TEXT REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. CLASS SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.class_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.class_tasks(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
    grade TEXT,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, user_id)
);
-- 3. CLASS COURSES
CREATE TABLE IF NOT EXISTS public.class_courses (
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (class_id, course_id)
);
-- 4. RLS POLICIES
-- Enable RLS
ALTER TABLE public.class_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_courses ENABLE ROW LEVEL SECURITY;
-- Drop existing policies to ensure idempotency
DO $$ BEGIN -- Class Tasks
DROP POLICY IF EXISTS "Enrolled view class tasks" ON public.class_tasks;
DROP POLICY IF EXISTS "Admins manage class tasks" ON public.class_tasks;
-- Class Submissions
DROP POLICY IF EXISTS "Users manage own submissions" ON public.class_submissions;
-- Class Courses
DROP POLICY IF EXISTS "Enrolled view class courses" ON public.class_courses;
DROP POLICY IF EXISTS "Admins manage class courses" ON public.class_courses;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Error dropping policies: %',
SQLERRM;
END $$;
-- Class Tasks: Enrolled users view, Admins manage
CREATE POLICY "Enrolled view class tasks" ON public.class_tasks FOR
SELECT TO authenticated USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.class_enrollments
            WHERE class_id = public.class_tasks.class_id
                AND user_id = auth.uid()::text
        )
    );
CREATE POLICY "Admins manage class tasks" ON public.class_tasks FOR ALL TO authenticated USING (public.is_admin());
-- Class Submissions: Users manage own, Admins view/grade all
CREATE POLICY "Users manage own submissions" ON public.class_submissions FOR ALL TO authenticated USING (
    user_id = auth.uid()::text
    OR public.is_admin()
);
-- Class Courses: Enrolled view, Admins manage
CREATE POLICY "Enrolled view class courses" ON public.class_courses FOR
SELECT TO authenticated USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.class_enrollments
            WHERE class_id = public.class_courses.class_id
                AND user_id = auth.uid()::text
        )
    );
CREATE POLICY "Admins manage class courses" ON public.class_courses FOR ALL TO authenticated USING (public.is_admin());
COMMIT;