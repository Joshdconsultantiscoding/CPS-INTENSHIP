-- Fix Presence RLS and Realtime Replication
-- 1. Ensure 'profiles' is in the realtime publication
-- This is critical for postgres_changes to work
DO $$ BEGIN ALTER PUBLICATION supabase_realtime
ADD TABLE public.profiles;
EXCEPTION
WHEN duplicate_object THEN NULL;
WHEN OTHERS THEN NULL;
-- Safety net
END $$;
-- 2. Drop existing update policy to be safe and recreate it robustly
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);
-- 3. Explicitly grant update on specific columns to authenticated users
GRANT UPDATE (online_status, last_seen_at) ON public.profiles TO authenticated;
-- 4. Force an update for testing (optional, but good for verification)
-- This won't work in migration script as it runs as admin/postgres, not a specific user.
-- 5. Ensure "Users can view all profiles" is correct
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR
SELECT USING (true);