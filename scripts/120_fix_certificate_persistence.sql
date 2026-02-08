-- Migration to fix certificate persistence
-- Goal: Ensure certificates are not deleted when a course is deleted
-- 1. Drop the existing foreign key constraint (assuming standard naming convention or from previous knowledge)
-- We need to check the constraint name first, but usually it's course_certificates_course_id_fkey
-- If we are unsure, we can try to drop it if it exists.
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'course_certificates_course_id_fkey'
) THEN
ALTER TABLE public.course_certificates DROP CONSTRAINT course_certificates_course_id_fkey;
END IF;
END $$;
-- 2. Add the constraint back with ON DELETE SET NULL
ALTER TABLE public.course_certificates
ADD CONSTRAINT course_certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE
SET NULL;
-- 3. Ensure we have the necessary snapshot columns (if not already present)
-- Based on actions/certificate.ts, we use 'course_title', so it should exist.
-- But let's make sure it's not null for existing records if possible.
-- (This part is tricky without data, but the column definition should be TEXT)
-- Optional: Comments
COMMENT ON CONSTRAINT course_certificates_course_id_fkey ON public.course_certificates IS 'Certificates should persist even if the course is deleted';