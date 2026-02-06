-- 107_performance_and_certs.sql
-- 1. ADD COLUMN FOR SECRET REFERENCE ANSWERS
ALTER TABLE public.course_questions
ADD COLUMN IF NOT EXISTS reference_answer TEXT;
-- 2. CREATE COURSE ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.course_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    context_id UUID NOT NULL,
    -- can be lesson_id, module_id, or course_id
    context_type TEXT NOT NULL CHECK (context_type IN ('course', 'module', 'lesson')),
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. CREATE COURSE COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS public.course_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);
-- 4. CREATE CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    certificate_url TEXT,
    is_uploaded BOOLEAN DEFAULT false,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);
-- 5. RLS POLICIES FOR NEW TABLES
ALTER TABLE public.course_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
-- Attempts: User sees own, Admin sees all
CREATE POLICY "Users view self attempts" ON public.course_attempts FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
CREATE POLICY "Users insert self attempts" ON public.course_attempts FOR
INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Admins view all attempts" ON public.course_attempts FOR
SELECT USING (public.is_admin());
-- Completions: User sees own, Admin sees all
CREATE POLICY "Users view self completions" ON public.course_completions FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
CREATE POLICY "Admins manage completions" ON public.course_completions FOR ALL USING (public.is_admin());
-- Certificates: User sees own, Admin manages
CREATE POLICY "Users view self certificates" ON public.certificates FOR
SELECT USING (
        auth.uid()::text = user_id
        OR public.is_admin()
    );
CREATE POLICY "Admins manage certificates" ON public.certificates FOR ALL USING (public.is_admin());