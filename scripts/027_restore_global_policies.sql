-- 027_restore_global_policies.sql
-- Restores critical platform policies dropped by the nuclear type-fix.
-- Adapted for Clerk TEXT IDs.
BEGIN;
-- 1. Restore PROFILES Policies (Clerk Compatible)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid()::text = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT WITH CHECK (auth.uid()::text = id);
-- Special debug/permissive policy from 018 if needed
DROP POLICY IF EXISTS "Users can edit own profile" ON public.profiles;
CREATE POLICY "Users can edit own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);
-- 2. Restore ONBOARDING Policies (Open Access)
ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.terms_acceptances;
CREATE POLICY "Allow all access" ON public.terms_acceptances FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.onboarding_progress;
CREATE POLICY "Allow all access" ON public.onboarding_progress FOR ALL USING (true) WITH CHECK (true);
-- 3. Grant Permissions
GRANT ALL ON public.profiles TO authenticated,
    service_role;
GRANT ALL ON public.terms_acceptances TO anon,
    authenticated,
    service_role;
GRANT ALL ON public.onboarding_progress TO anon,
    authenticated,
    service_role;
COMMIT;
-- IMPORTANT: YOU STILL NEED TO RUN '025_classroom_system_prompt.sql' 
-- to restore Classroom-specific features and the is_admin() function.