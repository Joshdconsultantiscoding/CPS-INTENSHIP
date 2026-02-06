-- 106_hotfix_course_schema.sql
-- HOTFIX: Add missing columns to courses table that might have been missed in 028
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS short_description TEXT,
    ADD COLUMN IF NOT EXISTS full_description JSONB,
    ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
    ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'free' CHECK (course_type IN ('free', 'paid')),
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS meta_description TEXT,
    ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
-- HOTFIX: Add missing columns to course_lessons table
ALTER TABLE public.course_lessons
ADD COLUMN IF NOT EXISTS short_description TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS completion_criteria JSONB DEFAULT '{"type": "watch"}'::jsonb;
-- HOTFIX: Add support for Module/Course level questions
ALTER TABLE public.course_questions
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    ALTER COLUMN lesson_id DROP NOT NULL;
-- Ensure only one context is set (optional but good practice, doing loosely for now to avoid migration headaches)
-- Reload schema cache just in case
NOTIFY pgrst,
'reload config';