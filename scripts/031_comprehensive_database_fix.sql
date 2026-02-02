-- 031_comprehensive_database_fix.sql
-- Run this in your Supabase SQL Editor to resolve "Table not found" errors
-- 1. Ensure course_assignments table exists (Primary Link)
CREATE TABLE IF NOT EXISTS public.course_assignments (
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (course_id, user_id)
);
-- 2. Ensure course_questions table exists (The missing piece)
CREATE TABLE IF NOT EXISTS public.course_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mcq', 'boolean', 'short', 'long')),
    question_text TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answers JSONB DEFAULT '[]'::jsonb,
    explanation TEXT,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. RLS POLICIES FOR QUESTIONS
ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;
-- Admins can do everything
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Admins manage course questions'
) THEN CREATE POLICY "Admins manage course questions" ON public.course_questions FOR ALL TO authenticated USING (public.is_admin());
END IF;
END $$;
-- 4. FIX VIEW (Intern Course Access)
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
-- 5. RELOAD SCHEMA CACHE (Internal suggestion)
-- This run a simple select to poke PostgREST
SELECT *
FROM public.course_questions
LIMIT 1;