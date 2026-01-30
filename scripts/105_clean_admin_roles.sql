-- =============================================
-- SYNC ADMIN ROLES: DEMOTE EMMA, PROTECT JOSHUA
-- =============================================
BEGIN;
-- 1. Demote Emma (The old admin) to Intern
-- This will fix the "2 Admins" count to "1 Admin"
UPDATE public.profiles
SET role = 'intern'
WHERE email = 'cospronosmedia@gmail.com';
-- 2. Identify Joshua's REAL ID from Clerk
-- (This part is tricky because we need the ID from auth.users)
-- We will update JOSHUA to be the ONLY admin by his email.
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'agbojoshua2005@gmail.com';
-- 3. Cleanup any duplicate profiles that might have been created during testing
-- Keep the one with the most information or the correct ID
-- (This is a safety measure)
-- 4. Verify Final Counts
SELECT role,
    count(*)
FROM public.profiles
GROUP BY role;
COMMIT;