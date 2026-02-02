-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    instructor_id TEXT REFERENCES public.profiles(id),
    meeting_link TEXT,
    schedule TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
-- 2. Class Enrollments (Assignment-based)
CREATE TABLE IF NOT EXISTS public.class_enrollments (
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'assistant', 'mentor')),
    PRIMARY KEY (class_id, user_id)
);
-- 3. Course Marketplace
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    instructor_id TEXT REFERENCES public.profiles(id),
    thumbnail_url TEXT,
    level TEXT CHECK (
        level IN ('beginner', 'intermediate', 'advanced')
    ),
    duration_minutes INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 4. Course Modules
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 5. Course Lessons
CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    -- Markdown content
    video_url TEXT,
    -- YouTube/Vimeo/Loom URL
    duration_minutes INTEGER DEFAULT 0,
    is_preview BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 6. Course Progress Tracking
CREATE TABLE IF NOT EXISTS public.course_progress (
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    -- Denormalized for easier querying
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, lesson_id)
);
-- 7. Class Messages (Scoped Chat)
CREATE TABLE IF NOT EXISTS public.class_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments TEXT [] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS POLICIES ----------------------------------------------------------
-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_messages ENABLE ROW LEVEL SECURITY;
-- Classes Policies
CREATE POLICY "Classes are viewable by everyone (for directory) or restricted" ON public.classes FOR
SELECT USING (true);
-- Interns see all classes exists, but access is restricted via enrollments for content
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (
    (
        select role
        from public.profiles
        where id = auth.uid()::text
    ) = 'admin'
);
-- Enrollments Policies
CREATE POLICY "Users can view their own enrollments" ON public.class_enrollments FOR
SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Admins can manage enrollments" ON public.class_enrollments FOR ALL USING (
    (
        select role
        from public.profiles
        where id = auth.uid()::text
    ) = 'admin'
);
-- Courses Policies (Marketplace)
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR
SELECT USING (
        is_published = true
        OR (
            select role
            from public.profiles
            where id = auth.uid()::text
        ) = 'admin'
    );
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL USING (
    (
        select role
        from public.profiles
        where id = auth.uid()::text
    ) = 'admin'
);
-- Course Content Policies
CREATE POLICY "Course content viewable by everyone (for now, or restrict to enrolled)" ON public.course_modules FOR
SELECT USING (true);
CREATE POLICY "Course lessons viewable by everyone" ON public.course_lessons FOR
SELECT USING (true);
-- Progress Policies
CREATE POLICY "Users manage their own progress" ON public.course_progress FOR ALL USING (auth.uid()::text = user_id);
-- Message Policies (STRICT)
CREATE POLICY "Class messages viewable by enrolled users only" ON public.class_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.class_enrollments
            WHERE class_id = public.class_messages.class_id
                AND user_id = auth.uid()::text
        )
        OR (
            select role
            from public.profiles
            where id = auth.uid()::text
        ) = 'admin'
    );
CREATE POLICY "Enrolled users can insert messages" ON public.class_messages FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.class_enrollments
            WHERE class_id = public.class_messages.class_id
                AND user_id = auth.uid()::text
        )
        OR (
            select role
            from public.profiles
            where id = auth.uid()::text
        ) = 'admin'
    );
-- TRIGGERS for updated_at
create function public.handle_updated_at() returns trigger as $$ begin new.updated_at = now();
return new;
end;
$$ language plpgsql;
create trigger on_classes_updated before
update on public.classes for each row execute procedure public.handle_updated_at();
create trigger on_courses_updated before
update on public.courses for each row execute procedure public.handle_updated_at();