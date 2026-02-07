-- =============================================
-- 117_LMS_QUIZ_SYSTEM.SQL
-- Complete LMS with Quizzes, Time Tracking, Certificates
-- =============================================
BEGIN;
-- =============================================
-- 1. EXTEND COURSES TABLE
-- =============================================
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS certificate_template_url TEXT,
    ADD COLUMN IF NOT EXISTS enable_time_tracking BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS enable_strict_mode BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70,
    ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS auto_issue_certificate BOOLEAN DEFAULT true;
-- =============================================
-- 2. EXTEND LESSONS TABLE
-- =============================================
ALTER TABLE public.course_lessons
ADD COLUMN IF NOT EXISTS required_time_seconds INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS quiz_id UUID,
    ADD COLUMN IF NOT EXISTS allow_skip BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS auto_complete_on_time BOOLEAN DEFAULT true;
-- =============================================
-- 3. EXTEND MODULES TABLE
-- =============================================
ALTER TABLE public.course_modules
ADD COLUMN IF NOT EXISTS quiz_id UUID,
    ADD COLUMN IF NOT EXISTS required_score INTEGER DEFAULT 0;
-- =============================================
-- 4. QUIZZES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    -- Attachment level
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.course_modules(id) ON DELETE
    SET NULL,
        lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE
    SET NULL,
        attachment_level TEXT DEFAULT 'lesson' CHECK (
            attachment_level IN ('course', 'module', 'lesson')
        ),
        -- Quiz settings
        time_limit_seconds INTEGER DEFAULT 0,
        -- 0 = unlimited
        passing_score INTEGER DEFAULT 70,
        attempts_allowed INTEGER DEFAULT 3,
        -- 0 = unlimited
        randomize_questions BOOLEAN DEFAULT false,
        randomize_options BOOLEAN DEFAULT false,
        show_correct_answers BOOLEAN DEFAULT true,
        show_explanations BOOLEAN DEFAULT true,
        -- Strict mode
        strict_mode BOOLEAN DEFAULT false,
        fullscreen_required BOOLEAN DEFAULT false,
        detect_tab_switch BOOLEAN DEFAULT true,
        auto_submit_on_cheat BOOLEAN DEFAULT false,
        -- Status
        is_published BOOLEAN DEFAULT false,
        created_by TEXT REFERENCES public.profiles(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- 5. QUIZ QUESTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    -- Question content
    type TEXT NOT NULL CHECK (
        type IN (
            'mcq',
            'multi_select',
            'boolean',
            'short_answer',
            'file_upload'
        )
    ),
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    -- Options (for MCQ, multi_select)
    options JSONB DEFAULT '[]'::jsonb,
    -- [{id, text, image_url}]
    correct_answers JSONB DEFAULT '[]'::jsonb,
    -- [option_ids] or ["true"/"false"] or ["text"]
    -- Scoring
    points INTEGER DEFAULT 1,
    partial_credit BOOLEAN DEFAULT false,
    -- Feedback
    explanation TEXT,
    hint TEXT,
    -- Order
    order_index INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- 6. QUIZ ATTEMPTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    time_spent_seconds INTEGER DEFAULT 0,
    -- Status
    status TEXT DEFAULT 'in_progress' CHECK (
        status IN (
            'in_progress',
            'submitted',
            'timed_out',
            'flagged'
        )
    ),
    -- Scoring
    total_points INTEGER DEFAULT 0,
    earned_points INTEGER DEFAULT 0,
    score_percentage NUMERIC(5, 2) DEFAULT 0,
    passed BOOLEAN DEFAULT false,
    -- Anti-cheat
    tab_switches INTEGER DEFAULT 0,
    idle_time_seconds INTEGER DEFAULT 0,
    fullscreen_exits INTEGER DEFAULT 0,
    flagged_reason TEXT,
    -- Metadata
    attempt_number INTEGER DEFAULT 1,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- 7. QUIZ ANSWERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    -- Answer content
    selected_options JSONB DEFAULT '[]'::jsonb,
    -- For MCQ/multi_select
    text_answer TEXT,
    -- For short_answer
    file_url TEXT,
    -- For file_upload
    -- Grading
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    auto_graded BOOLEAN DEFAULT true,
    admin_feedback TEXT,
    -- Timing
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    time_to_answer_seconds INTEGER DEFAULT 0,
    UNIQUE(attempt_id, question_id)
);
-- =============================================
-- 8. LESSON TIME TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.lesson_time_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    -- Time tracking
    first_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    total_active_seconds INTEGER DEFAULT 0,
    total_idle_seconds INTEGER DEFAULT 0,
    -- Session tracking
    current_session_start TIMESTAMPTZ,
    is_paused BOOLEAN DEFAULT false,
    pause_reason TEXT,
    -- 'tab_blur', 'idle', 'manual'
    -- Completion
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completion_percentage INTEGER DEFAULT 0,
    -- Video/content progress
    video_watched_seconds INTEGER DEFAULT 0,
    content_scroll_percentage INTEGER DEFAULT 0,
    UNIQUE(user_id, lesson_id)
);
-- =============================================
-- 9. COURSE CERTIFICATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.course_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id TEXT UNIQUE NOT NULL,
    -- Human-readable ID like "CERT-2024-ABCD"
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    -- Certificate data
    intern_name TEXT NOT NULL,
    course_title TEXT NOT NULL,
    completion_date DATE NOT NULL,
    -- Scores
    final_score NUMERIC(5, 2),
    total_time_spent_seconds INTEGER DEFAULT 0,
    -- Certificate file
    certificate_url TEXT,
    template_used TEXT DEFAULT 'default',
    -- Verification
    verification_url TEXT,
    qr_code_url TEXT,
    is_valid BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    -- Metadata
    issued_by TEXT REFERENCES public.profiles(id),
    admin_signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- 10. COURSE SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.course_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID UNIQUE REFERENCES public.courses(id) ON DELETE CASCADE,
    -- Time settings
    required_time_percentage INTEGER DEFAULT 80,
    -- % of estimated time required
    allow_skip_lessons BOOLEAN DEFAULT false,
    auto_mark_complete BOOLEAN DEFAULT true,
    auto_move_next BOOLEAN DEFAULT true,
    -- Quiz settings
    quiz_required_for_completion BOOLEAN DEFAULT true,
    retry_failed_quizzes BOOLEAN DEFAULT true,
    show_quiz_feedback BOOLEAN DEFAULT true,
    -- Lock settings
    lock_next_until_previous BOOLEAN DEFAULT true,
    lock_quiz_until_lesson BOOLEAN DEFAULT true,
    -- Certificate settings
    certificate_on_completion BOOLEAN DEFAULT true,
    min_score_for_certificate INTEGER DEFAULT 70,
    -- Strict mode
    enable_strict_mode BOOLEAN DEFAULT false,
    strict_mode_for_quizzes BOOLEAN DEFAULT true,
    strict_mode_for_lessons BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- 11. COURSE PROGRESS EXTENSION
-- =============================================
ALTER TABLE public.course_progress
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quiz_score NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS quiz_passed BOOLEAN,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started' CHECK (
        status IN (
            'not_started',
            'in_progress',
            'completed',
            'failed'
        )
    );
-- =============================================
-- 12. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_module ON public.quizzes(module_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON public.quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON public.quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_user ON public.lesson_time_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_lesson ON public.lesson_time_tracking(lesson_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.course_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON public.course_certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON public.course_certificates(certificate_id);
-- =============================================
-- 13. RLS POLICIES
-- =============================================
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_settings ENABLE ROW LEVEL SECURITY;
-- Quizzes: Admins full access, users view published
CREATE POLICY "Admins manage quizzes" ON public.quizzes FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Users view published quizzes" ON public.quizzes FOR
SELECT TO authenticated USING (is_published = true);
-- Quiz Questions: Admins manage, users view (correct_answers hidden in app layer)
CREATE POLICY "Admins manage quiz questions" ON public.quiz_questions FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Users view quiz questions" ON public.quiz_questions FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM public.quizzes q
            WHERE q.id = quiz_id
                AND q.is_published = true
        )
    );
-- Quiz Attempts: Users manage own, admins view all
CREATE POLICY "Users manage own attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (
    user_id = auth.uid()::text
    OR public.is_admin()
);
-- Quiz Answers: Users manage own, admins view all
CREATE POLICY "Users manage own answers" ON public.quiz_answers FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.quiz_attempts a
        WHERE a.id = attempt_id
            AND (
                a.user_id = auth.uid()::text
                OR public.is_admin()
            )
    )
);
-- Time Tracking: Users manage own, admins view all
CREATE POLICY "Users manage own time tracking" ON public.lesson_time_tracking FOR ALL TO authenticated USING (
    user_id = auth.uid()::text
    OR public.is_admin()
);
-- Certificates: Users view own, admins manage all
CREATE POLICY "Users view own certificates" ON public.course_certificates FOR
SELECT TO authenticated USING (
        user_id = auth.uid()::text
        OR public.is_admin()
    );
CREATE POLICY "Admins manage certificates" ON public.course_certificates FOR ALL TO authenticated USING (public.is_admin());
-- Course Settings: Admins only
CREATE POLICY "Admins manage course settings" ON public.course_settings FOR ALL TO authenticated USING (public.is_admin());
-- =============================================
-- 14. TRIGGERS
-- =============================================
CREATE TRIGGER set_updated_at_quizzes BEFORE
UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_quiz_questions BEFORE
UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_course_settings BEFORE
UPDATE ON public.course_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- =============================================
-- 15. HELPER FUNCTIONS
-- =============================================
-- Function to generate certificate ID
CREATE OR REPLACE FUNCTION public.generate_certificate_id() RETURNS TEXT AS $$
DECLARE new_id TEXT;
year_part TEXT;
random_part TEXT;
BEGIN year_part := to_char(NOW(), 'YYYY');
random_part := upper(
    substring(
        md5(random()::text)
        from 1 for 6
    )
);
new_id := 'CERT-' || year_part || '-' || random_part;
RETURN new_id;
END;
$$ LANGUAGE plpgsql;
-- Function to calculate quiz score
CREATE OR REPLACE FUNCTION public.calculate_quiz_score(p_attempt_id UUID) RETURNS TABLE(
        total_points INTEGER,
        earned_points INTEGER,
        score_percentage NUMERIC,
        passed BOOLEAN
    ) AS $$
DECLARE v_quiz_id UUID;
v_passing_score INTEGER;
BEGIN -- Get quiz info
SELECT qa.quiz_id INTO v_quiz_id
FROM public.quiz_attempts qa
WHERE qa.id = p_attempt_id;
SELECT q.passing_score INTO v_passing_score
FROM public.quizzes q
WHERE q.id = v_quiz_id;
-- Calculate scores
RETURN QUERY
SELECT COALESCE(SUM(qq.points), 0)::INTEGER as total_points,
    COALESCE(SUM(qans.points_earned), 0)::INTEGER as earned_points,
    CASE
        WHEN COALESCE(SUM(qq.points), 0) = 0 THEN 0
        ELSE ROUND(
            (
                COALESCE(SUM(qans.points_earned), 0)::NUMERIC / SUM(qq.points)::NUMERIC
            ) * 100,
            2
        )
    END as score_percentage,
    CASE
        WHEN COALESCE(SUM(qq.points), 0) = 0 THEN false
        ELSE (
            COALESCE(SUM(qans.points_earned), 0)::NUMERIC / SUM(qq.points)::NUMERIC * 100
        ) >= v_passing_score
    END as passed
FROM public.quiz_questions qq
    LEFT JOIN public.quiz_answers qans ON qans.question_id = qq.id
    AND qans.attempt_id = p_attempt_id
WHERE qq.quiz_id = v_quiz_id;
END;
$$ LANGUAGE plpgsql;
COMMIT;