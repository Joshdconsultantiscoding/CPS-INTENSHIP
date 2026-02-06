-- fix_profile_schema_cache.sql
BEGIN;
-- 1. Ensure columns exist (Idempotent)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'intern';
-- 2. Force PostgREST Schema Cache Reload
-- This is crucial for "Could not find column in schema cache" errors
NOTIFY pgrst,
'reload schema';
COMMIT;