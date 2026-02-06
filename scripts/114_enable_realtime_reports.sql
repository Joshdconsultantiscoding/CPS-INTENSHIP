-- =============================================
-- DEEP FIX: ENABLE REAL-TIME FOR REPORTS & TASKS
-- =============================================
-- This script ensures the database broadcasts changes to the frontend.
BEGIN;
-- 1. Enable 'daily_reports' for Real-time
-- Set replica identity to FULL so the client gets the old and new data (useful for some syncs)
ALTER TABLE public.daily_reports REPLICA IDENTITY FULL;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.daily_reports;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
END $$;
-- 2. Enable 'tasks' for Real-time
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.tasks;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
END $$;
-- 3. Verify 'profiles' is still in there (from earlier scripts)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.profiles;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
END $$;
COMMIT;