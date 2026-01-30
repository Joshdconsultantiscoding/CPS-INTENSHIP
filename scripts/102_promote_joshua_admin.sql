-- =============================================
-- FORCE ADMIN STATUS FOR agbojoshua2005@gmail.com
-- =============================================
-- 1. Upsert the User Profile to ensure they exist and are ADMIN
-- We use ON CONFLICT to update if they already exist
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        status,
        online_status
    )
SELECT id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', 'Joshua Agbo'),
    'admin',
    'active',
    'online'
FROM auth.users
WHERE email = 'agbojoshua2005@gmail.com' ON CONFLICT (id) DO
UPDATE
SET role = 'admin',
    full_name = EXCLUDED.full_name,
    status = 'active';
-- 2. (Optional) Demote 'emma' if you want them to be an intern
-- Uncomment the next lines if 'emma' should NO LONGER be an admin
-- UPDATE public.profiles SET role = 'intern' WHERE email = 'cospronosmedia@gmail.com';
-- 3. Verify the change
SELECT email,
    role,
    full_name
FROM public.profiles
WHERE role = 'admin';