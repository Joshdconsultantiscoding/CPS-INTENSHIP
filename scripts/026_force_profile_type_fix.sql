-- 026_force_profile_type_fix.sql
-- AGGRESSIVE FIX: Drops ALL policies and dependencies to facilitate profiles.id type conversion.
DO $$
DECLARE r RECORD;
BEGIN -- 1. Drop ALL policies in the public schema for ALL tables
-- This is the "Nuclear Option" to ensure the column type change is not blocked.
FOR r IN (
    SELECT policyname,
        tablename,
        schemaname
    FROM pg_policies
    WHERE schemaname = 'public'
) LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "' || r.schemaname || '"."' || r.tablename || '"';
END LOOP;
-- 2. Drop the admin check function with CASCADE
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
-- 3. Drop ALL Foreign Keys referencing profiles.id (on common tables)
-- We'll catch the obvious ones. If others exist, they will report an error.
-- (The loop below is better for FKs too)
FOR r IN (
    SELECT tc.table_schema,
        tc.table_name,
        tc.constraint_name
    FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'profiles'
        AND ccu.column_name = 'id'
) LOOP EXECUTE 'ALTER TABLE "' || r.table_schema || '"."' || r.table_name || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
END LOOP;
-- 4. Detach from auth.users (Supabase standard)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
-- 5. Alter profiles.id to TEXT
-- This supports Clerk IDs (e.g., 'user_2xyz')
ALTER TABLE public.profiles
ALTER COLUMN id TYPE TEXT;
-- 6. Re-attach references (ensure columns are TEXT first)
ALTER TABLE public.classes
ALTER COLUMN instructor_id TYPE TEXT;
ALTER TABLE public.class_enrollments
ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.courses
ALTER COLUMN instructor_id TYPE TEXT;
ALTER TABLE public.course_assignments
ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.course_progress
ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.class_announcements
ALTER COLUMN author_id TYPE TEXT;
ALTER TABLE public.class_messages
ALTER COLUMN user_id TYPE TEXT;
-- 7. Restore Common Foreign Keys
ALTER TABLE public.classes
ADD CONSTRAINT classes_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.profiles(id);
ALTER TABLE public.class_enrollments
ADD CONSTRAINT class_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.courses
ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.profiles(id);
ALTER TABLE public.course_assignments
ADD CONSTRAINT course_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.course_progress
ADD CONSTRAINT course_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.class_announcements
ADD CONSTRAINT class_announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.class_messages
ADD CONSTRAINT class_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $$;
-- SUCCESS MESSAGE
-- Step 1 complete. Your Profile ID is now 'TEXT'.
-- Step 2: Now run '025_classroom_system_prompt.sql' to restore policies and functions.
-- Step 3: (If you use Community Feed) Run those SQL scripts too to restore their policies.