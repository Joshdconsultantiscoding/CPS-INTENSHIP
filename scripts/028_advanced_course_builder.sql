-- 028_advanced_course_builder.sql
-- Extensions for Advanced Course Builder (Feature 6)
-- 1. EXTEND COURSES TABLE
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS short_description TEXT,
    ADD COLUMN IF NOT EXISTS full_description JSONB,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
    ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'free' CHECK (course_type IN ('free', 'paid')),
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT,
    ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
-- Migration: Sync is_published with status
UPDATE public.courses
SET status = 'published'
WHERE is_published = true
    AND status = 'draft';
-- 2. EXTEND LESSONS TABLE
ALTER TABLE public.course_lessons
ADD COLUMN IF NOT EXISTS short_description TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS completion_criteria JSONB DEFAULT '{"type": "watch"}'::jsonb;
-- 3. CREATE QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.course_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mcq', 'boolean', 'short', 'long')),
    question_text TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    -- Array of strings for MCQ
    correct_answers JSONB DEFAULT '[]'::jsonb,
    -- Array of strings
    explanation TEXT,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. RLS POLICIES FOR QUESTIONS
ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;
-- Admins can do everything
CREATE POLICY "Admins manage course questions" ON public.course_questions FOR ALL TO authenticated USING (public.is_admin());
-- Interns can view questions for lessons they have access to
CREATE POLICY "Interns view course questions" ON public.course_questions FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.course_lessons l
                JOIN public.course_modules m ON l.module_id = m.id
                JOIN public.courses c ON m.course_id = c.id
            WHERE l.id = public.course_questions.lesson_id
                AND (
                    c.is_published = true
                    AND (
                        c.assignment_type = 'global'
                        OR EXISTS (
                            SELECT 1
                            FROM public.course_assignments ca
                            WHERE ca.course_id = c.id
                                AND ca.user_id = auth.uid()::text
                        )
                    )
                )
        )
    );
-- 5. TRIGGER FOR UPDATED_AT
CREATE TRIGGER set_updated_at_course_questions BEFORE
UPDATE ON public.course_questions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- 6. ANALYTICS VIEW (Placeholder for now)
CREATE OR REPLACE VIEW public.course_analytics_overview AS
SELECT c.id as course_id,
    c.title,
    COUNT(DISTINCT ca.user_id) as total_enrollments,
    (
        SELECT COUNT(*)
        FROM public.course_progress cp
            JOIN public.course_lessons l ON cp.lesson_id = l.id
            JOIN public.course_modules m ON l.module_id = m.id
        WHERE m.course_id = c.id
            AND cp.status = 'completed'
    ) as total_lesson_completions
FROM public.courses c
    LEFT JOIN public.course_assignments ca ON c.id = ca.course_id
GROUP BY c.id,
    c.title;