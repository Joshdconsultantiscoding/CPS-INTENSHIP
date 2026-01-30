-- =============================================
-- ULTRA-DEFENSIVE MIGRATION: CLERK ID COMPATIBILITY (v5)
-- =============================================
-- This script is designed to handle any missing tables or columns
-- while converting ID types to TEXT for Clerk compatibility.
BEGIN;
-- 1. DROP ALL RLS POLICIES (Public Schema)
DO $$
DECLARE pol record;
BEGIN FOR pol IN (
    SELECT policyname,
        tablename,
        schemaname
    FROM pg_policies
    WHERE schemaname = 'public'
) LOOP EXECUTE format(
    'DROP POLICY IF EXISTS %I ON %I.%I',
    pol.policyname,
    pol.schemaname,
    pol.tablename
);
END LOOP;
END $$;
-- 2. DROP ALL FOREIGN KEYS referencing Profiles
DO $$
DECLARE fk record;
BEGIN FOR fk IN (
    SELECT tc.table_name,
        tc.constraint_name
    FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
) LOOP EXECUTE format(
    'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
    fk.table_name,
    fk.constraint_name
);
END LOOP;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Skipping some foreign key drops: %',
SQLERRM;
END $$;
-- 3. PERFORM THE TYPE CONVERSION (Column by Column with existence checks)
-- Helper Function for Altering Columns safely
DO $$ BEGIN -- PROFILES.id
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'id'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.profiles
ALTER COLUMN id TYPE TEXT;
END IF;
-- TASKS.assigned_to
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks'
        AND column_name = 'assigned_to'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.tasks
ALTER COLUMN assigned_to TYPE TEXT;
END IF;
-- TASKS.assigned_by
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks'
        AND column_name = 'assigned_by'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.tasks
ALTER COLUMN assigned_by TYPE TEXT;
END IF;
-- REPORTS.user_id
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_reports'
        AND column_name = 'user_id'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.daily_reports
ALTER COLUMN user_id TYPE TEXT;
END IF;
-- REPORTS.reviewed_by
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_reports'
        AND column_name = 'reviewed_by'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.daily_reports
ALTER COLUMN reviewed_by TYPE TEXT;
END IF;
-- REWARDS.user_id (The one that crashed v4)
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rewards'
        AND column_name = 'user_id'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.rewards
ALTER COLUMN user_id TYPE TEXT;
END IF;
-- REWARDS.awarded_by
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'rewards'
        AND column_name = 'awarded_by'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.rewards
ALTER COLUMN awarded_by TYPE TEXT;
END IF;
-- MESSAGES.sender_id
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'messages'
        AND column_name = 'sender_id'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.messages
ALTER COLUMN sender_id TYPE TEXT;
END IF;
-- MESSAGES.recipient_id
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'messages'
        AND column_name = 'recipient_id'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.messages
ALTER COLUMN recipient_id TYPE TEXT;
END IF;
-- ACTIVITY_LOGS.user_id
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'activity_logs'
        AND column_name = 'user_id'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.activity_logs
ALTER COLUMN user_id TYPE TEXT;
END IF;
-- NOTIFICATIONS.user_id
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'notifications'
        AND column_name = 'user_id'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.notifications
ALTER COLUMN user_id TYPE TEXT;
END IF;
-- CHANNELS.created_by
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'channels'
        AND column_name = 'created_by'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.channels
ALTER COLUMN created_by TYPE TEXT;
END IF;
-- CHANNELS.members
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'channels'
        AND column_name = 'members'
        AND table_schema = 'public'
) THEN
ALTER TABLE public.channels
ALTER COLUMN members TYPE TEXT [];
END IF;
END $$;
-- 4. RESTORE CORE FOREIGN KEYS (Only if they exist)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE tablename = 'tasks'
        AND schemaname = 'public'
) THEN
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);
END IF;
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE tablename = 'daily_reports'
        AND schemaname = 'public'
) THEN
ALTER TABLE public.daily_reports
ADD CONSTRAINT daily_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
END IF;
END $$;
-- 5. RECREATE ESSENTIAL RLS POLICIES
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE tablename = 'profiles'
        AND schemaname = 'public'
) THEN
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Profiles are viewable" ON public.profiles FOR
SELECT USING (true);
CREATE POLICY "Users can edit own profile" ON public.profiles FOR
UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT WITH CHECK (auth.uid()::text = id);
END IF;
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE tablename = 'tasks'
        AND schemaname = 'public'
) THEN CREATE POLICY "View assigned tasks" ON public.tasks FOR
SELECT USING (
        auth.uid()::text = assigned_to
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
END IF;
IF EXISTS (
    SELECT 1
    FROM pg_tables
    WHERE tablename = 'activity_logs'
        AND schemaname = 'public'
) THEN CREATE POLICY "View own activity" ON public.activity_logs FOR
SELECT USING (
        auth.uid()::text = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
END IF;
END $$;
COMMIT;