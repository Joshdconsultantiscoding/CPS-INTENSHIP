-- 026_decouple_profiles_auth.sql
-- Decouple profiles table from Supabase Auth to support Clerk User IDs
BEGIN;
-- 1. Drop Foreign Key Constraint if exists (Constraint name matches standard Supabase starter)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
-- 2. Alter ID column to TEXT (Clerk IDs are strings like 'user_2xyz...')
-- Note: If it was UUID, this might need casting.
ALTER TABLE public.profiles
ALTER COLUMN id TYPE TEXT;
-- 3. Ensure role column exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'role'
) THEN
ALTER TABLE public.profiles
ADD COLUMN role TEXT DEFAULT 'intern';
END IF;
END $$;
COMMIT;