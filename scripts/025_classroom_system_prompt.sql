-- 025_classroom_system_prompt.sql
-- Refined Schema for Classroom & Learning System
-- Enforces: Assignment-Only Access, Text-based User IDs (Clerk), and Split Course/Class Logic
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- =============================================
-- 1. CLASSES (Private Intern Groups)
-- =============================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    instructor_id TEXT REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- 2. CLASS ENROLLMENTS (Access Control Source)
-- =============================================
CREATE TABLE IF NOT EXISTS public.class_enrollments (
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'student',
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (class_id, user_id)
);
-- =============================================
-- 3. COURSES (Learning Library)
-- =============================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    is_published BOOLEAN DEFAULT false,
    assignment_type TEXT DEFAULT 'global',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- MIGRATION: Ensure columns exist if table already exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'courses'
        AND column_name = 'assignment_type'
) THEN
ALTER TABLE public.courses
ADD COLUMN assignment_type TEXT DEFAULT 'global';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'courses'
        AND column_name = 'thumbnail_url'
) THEN
ALTER TABLE public.courses
ADD COLUMN thumbnail_url TEXT;
END IF;
END $$;
-- =============================================
-- 4. COURSE ASSIGNMENTS (For Selective Courses)
-- =============================================
CREATE TABLE IF NOT EXISTS public.course_assignments (
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (course_id, user_id)
);
-- =============================================
-- 5. COURSE CONTENT (Modules & Lessons)
-- =============================================
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- MIGRATION: Ensure columns exist if table already exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'course_lessons'
        AND column_name = 'video_url'
) THEN
ALTER TABLE public.course_lessons
ADD COLUMN video_url TEXT;
END IF;
END $$;
-- =============================================
-- 6. PROGRESS TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS public.course_progress (
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, lesson_id)
);
-- =============================================
-- 7. CLASS COMMUNICATIONS (Scoped)
-- =============================================
CREATE TABLE IF NOT EXISTS public.class_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    author_id TEXT REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.class_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    attachments TEXT [] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- RLS POLICIES (STRICT ISOLATION)
-- =============================================
-- Enable RLS on all tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;
-- Helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
            AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Drop all old policies to ensure clean slate
DO $$ BEGIN -- Classes
DROP POLICY IF EXISTS "Admins view all classes" ON public.classes;
DROP POLICY IF EXISTS "Interns view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Admins manage classes" ON public.classes;
-- Enrollments
DROP POLICY IF EXISTS "Admins manage enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Users view self enrollments" ON public.class_enrollments;
-- Courses
DROP POLICY IF EXISTS "Admins view all courses" ON public.courses;
DROP POLICY IF EXISTS "Interns view permitted courses" ON public.courses;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
-- Old policy check
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
-- Assignments
DROP POLICY IF EXISTS "Admins manage assignments" ON public.course_assignments;
DROP POLICY IF EXISTS "Users view own assignments" ON public.course_assignments;
-- Modules/Lessons
DROP POLICY IF EXISTS "View content if course permitted" ON public.course_modules;
DROP POLICY IF EXISTS "Course content viewable by everyone" ON public.course_modules;
-- Old policy check
DROP POLICY IF EXISTS "Admins manage modules" ON public.course_modules;
DROP POLICY IF EXISTS "View lessons if course permitted" ON public.course_lessons;
DROP POLICY IF EXISTS "Course lessons viewable by everyone" ON public.course_lessons;
-- Old policy check
DROP POLICY IF EXISTS "Admins manage lessons" ON public.course_lessons;
-- Progress
DROP POLICY IF EXISTS "Users manage own progress" ON public.course_progress;
-- Announcements
DROP POLICY IF EXISTS "View announcements if enrolled" ON public.class_announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON public.class_announcements;
-- Messages
DROP POLICY IF EXISTS "Read messages if enrolled" ON public.class_messages;
DROP POLICY IF EXISTS "Class messages viewable by enrolled users only" ON public.class_messages;
-- Old policy
DROP POLICY IF EXISTS "Send messages if enrolled" ON public.class_messages;
DROP POLICY IF EXISTS "Enrolled users can insert messages" ON public.class_messages;
-- Old policy
END $$;
-- Helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
            AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 1. CLASSES POLICIES
-- Admins see all. Interns see only what they are enrolled in.
CREATE POLICY "Admins view all classes" ON public.classes FOR
SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Interns view enrolled classes" ON public.classes FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.class_enrollments
            WHERE class_id = public.classes.id
                AND user_id = auth.uid()::text
        )
    );
CREATE POLICY "Admins manage classes" ON public.classes FOR ALL TO authenticated USING (public.is_admin());
-- 2. ENROLLMENT POLICIES
CREATE POLICY "Admins manage enrollments" ON public.class_enrollments FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Users view self enrollments" ON public.class_enrollments FOR
SELECT TO authenticated USING (user_id = auth.uid()::text);
-- 3. COURSES POLICIES
-- Admins see all. Interns see: Not Published (Hidden), Published & Global (Visible), Published & Selective (Visible only if assigned)
CREATE POLICY "Admins view all courses" ON public.courses FOR
SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Interns view permitted courses" ON public.courses FOR
SELECT TO authenticated USING (
        is_published = true
        AND (
            assignment_type = 'global'
            OR EXISTS (
                SELECT 1
                FROM public.course_assignments
                WHERE course_id = public.courses.id
                    AND user_id = auth.uid()::text
            )
        )
    );
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated USING (public.is_admin());
-- 4. COURSE ASSIGNMENTS POLICIES
CREATE POLICY "Admins manage assignments" ON public.course_assignments FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Users view own assignments" ON public.course_assignments FOR
SELECT TO authenticated USING (user_id = auth.uid()::text);
-- 5. CONTENT POLICIES (Modules/Lessons)
-- Inherit visibility from the course they belong to
CREATE POLICY "View content if course permitted" ON public.course_modules FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.courses
            WHERE id = public.course_modules.course_id
                AND (
                    public.is_admin()
                    OR (
                        is_published = true
                        AND (
                            assignment_type = 'global'
                            OR EXISTS (
                                SELECT 1
                                FROM public.course_assignments
                                WHERE course_id = public.courses.id
                                    AND user_id = auth.uid()::text
                            )
                        )
                    )
                )
        )
    );
CREATE POLICY "View lessons if course permitted" ON public.course_lessons FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.course_modules
                JOIN public.courses ON public.courses.id = public.course_modules.course_id
            WHERE public.course_modules.id = public.course_lessons.module_id
                AND (
                    public.is_admin()
                    OR (
                        is_published = true
                        AND (
                            assignment_type = 'global'
                            OR EXISTS (
                                SELECT 1
                                FROM public.course_assignments
                                WHERE course_id = public.courses.id
                                    AND user_id = auth.uid()::text
                            )
                        )
                    )
                )
        )
    );
-- Manage content (Admin only)
CREATE POLICY "Admins manage modules" ON public.course_modules FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins manage lessons" ON public.course_lessons FOR ALL TO authenticated USING (public.is_admin());
-- 6. PROGRESS POLICIES
CREATE POLICY "Users manage own progress" ON public.course_progress FOR ALL TO authenticated USING (user_id = auth.uid()::text);
-- 7. ANNOUNCEMENTS & MESSAGES POLICIES
-- Viewable ONLY if enrolled (or Admin)
CREATE POLICY "View announcements if enrolled" ON public.class_announcements FOR
SELECT TO authenticated USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.class_enrollments
            WHERE class_id = public.class_announcements.class_id
                AND user_id = auth.uid()::text
        )
    );
CREATE POLICY "Admins manage announcements" ON public.class_announcements FOR ALL TO authenticated USING (public.is_admin());
-- Enrolled users can READ messages
CREATE POLICY "Read messages if enrolled" ON public.class_messages FOR
SELECT TO authenticated USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.class_enrollments
            WHERE class_id = public.class_messages.class_id
                AND user_id = auth.uid()::text
        )
    );
-- Enrolled users can SEND messages
CREATE POLICY "Send messages if enrolled" ON public.class_messages FOR
INSERT TO authenticated WITH CHECK (
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.class_enrollments
            WHERE class_id = public.class_messages.class_id
                AND user_id = auth.uid()::text
        )
    );
-- TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_classes_updated ON public.classes;
CREATE TRIGGER on_classes_updated BEFORE
UPDATE ON public.classes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
DROP TRIGGER IF EXISTS on_courses_updated ON public.courses;
CREATE TRIGGER on_courses_updated BEFORE
UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();