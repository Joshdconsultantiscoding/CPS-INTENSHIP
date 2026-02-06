-- =============================================
-- NUCLEAR FIX: UNIVERSAL CLERK ID ALIGNMENT (v3)
-- =============================================
-- This script forcefully aligns ALL tables to TEXT IDs and restores RLS.
-- This version is HYPER-DEFENSIVE against missing columns (like created_by).
BEGIN;
-- 1. FORCE TYPE CONVERSIONS
DO $$ BEGIN -- daily_reports
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_reports'
        AND column_name = 'user_id'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.daily_reports
ALTER COLUMN user_id TYPE TEXT;
END IF;
-- performance_scores
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'performance_scores'
        AND column_name = 'user_id'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.performance_scores
ALTER COLUMN user_id TYPE TEXT;
END IF;
-- ai_chats
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ai_chats'
        AND column_name = 'user_id'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.ai_chats
ALTER COLUMN user_id TYPE TEXT;
END IF;
-- calendar_events
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calendar_events'
        AND column_name = 'created_by'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.calendar_events
ALTER COLUMN created_by TYPE TEXT;
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calendar_events'
        AND column_name = 'attendees'
        AND data_type = 'ARRAY'
) THEN IF (
    SELECT udt_name
    FROM information_schema.columns
    WHERE table_name = 'calendar_events'
        AND column_name = 'attendees'
) = '_uuid' THEN
ALTER TABLE public.calendar_events
ALTER COLUMN attendees TYPE TEXT [] USING attendees::text [];
END IF;
END IF;
-- point_history
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'point_history'
        AND column_name = 'user_id'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.point_history
ALTER COLUMN user_id TYPE TEXT;
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'point_history'
        AND column_name = 'awarded_by'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.point_history
ALTER COLUMN awarded_by TYPE TEXT;
END IF;
-- tasks
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks'
        AND column_name = 'assigned_to'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.tasks
ALTER COLUMN assigned_to TYPE TEXT;
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks'
        AND column_name = 'assigned_by'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.tasks
ALTER COLUMN assigned_by TYPE TEXT;
END IF;
END $$;
-- 2. RESTORE RLS POLICIES (Hyper-Defensive)
-- DAILY REPORTS
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON public.daily_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.daily_reports;
CREATE POLICY "Users can view own reports" ON public.daily_reports FOR
SELECT USING (
        auth.uid()::text = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role IN ('admin', 'team_lead')
        )
    );
CREATE POLICY "Users can insert own reports" ON public.daily_reports FOR
INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own reports" ON public.daily_reports FOR
UPDATE USING (
        auth.uid()::text = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role IN ('admin', 'team_lead')
        )
    );
-- TASKS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Admins can manage tasks" ON public.tasks;
CREATE POLICY "View assigned tasks" ON public.tasks FOR
SELECT USING (
        auth.uid()::text = assigned_to
        OR auth.uid()::text = assigned_by
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role IN ('admin', 'team_lead')
        )
    );
CREATE POLICY "Admins can manage tasks" ON public.tasks FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
            AND role IN ('admin', 'team_lead')
    )
);
-- POINT HISTORY
ALTER TABLE public.point_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own point history" ON public.point_history;
DROP POLICY IF EXISTS "Admins can manage point history" ON public.point_history;
CREATE POLICY "Users can view own point history" ON public.point_history FOR
SELECT USING (
        auth.uid()::text = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role IN ('admin', 'team_lead')
        )
    );
CREATE POLICY "Admins can manage point history" ON public.point_history FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
            AND role IN ('admin', 'team_lead')
    )
);
-- CALENDAR EVENTS (The crashing part)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view events" ON public.calendar_events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.calendar_events;
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calendar_events'
        AND column_name = 'created_by'
) THEN EXECUTE 'CREATE POLICY "Users can view events" ON public.calendar_events FOR SELECT USING (auth.uid()::text = ANY(attendees) OR auth.uid()::text = created_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = ''admin''))';
ELSE EXECUTE 'CREATE POLICY "Users can view events" ON public.calendar_events FOR SELECT USING (auth.uid()::text = ANY(attendees) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()::text AND role = ''admin''))';
END IF;
END $$;
CREATE POLICY "Admins can manage events" ON public.calendar_events FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
            AND role IN ('admin', 'team_lead')
    )
);
-- THE REST (Standard)
ALTER TABLE public.performance_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View own performance" ON public.performance_scores;
CREATE POLICY "View own performance" ON public.performance_scores FOR
SELECT USING (
        auth.uid()::text = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role IN ('admin', 'team_lead')
        )
    );
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own AI chats" ON public.ai_chats;
CREATE POLICY "Users can view own AI chats" ON public.ai_chats FOR
SELECT USING (auth.uid()::text = user_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR
SELECT USING (auth.uid()::text = user_id);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view channels" ON public.channels;
CREATE POLICY "Users can view channels" ON public.channels FOR
SELECT USING (
        auth.uid()::text = ANY(members)
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
COMMIT;