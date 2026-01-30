-- =============================================
-- FINAL FIX: UNIQUE CONSTRAINTS & ADMIN PROMOTION
-- =============================================
BEGIN;
-- 1. Ensure the Email column is UNIQUE (so ON CONFLICT works)
-- If it's already unique, this might error, but we'll try to add it.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_email_key'
) THEN
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_key UNIQUE (email);
END IF;
END $$;
-- 2. NOW perform the Admin Promotion
-- This will work because the constraint on 'email' now exists.
INSERT INTO public.profiles (id, email, full_name, role, status)
VALUES (
        'admin_init_id',
        -- Temporary ID
        'agbojoshua2005@gmail.com',
        'Joshua Agbo',
        'admin',
        'active'
    ) ON CONFLICT (email) DO
UPDATE
SET role = 'admin',
    status = 'active',
    full_name = EXCLUDED.full_name;
-- 3. Verify
SELECT id,
    email,
    role,
    full_name
FROM public.profiles
WHERE email = 'agbojoshua2005@gmail.com';
COMMIT;