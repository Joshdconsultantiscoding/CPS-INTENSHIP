-- Drop the unique constraint on rewards(name) which is causing issues
-- The constraint is likely named 'achievements_name_key' because the table was renamed from 'achievements'
DO $$ BEGIN -- Try to drop the constraint if it exists
IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'achievements_name_key'
) THEN
ALTER TABLE public.rewards DROP CONSTRAINT achievements_name_key;
END IF;
-- Also check if there's a constraint named 'rewards_name_key' just in case
IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rewards_name_key'
) THEN
ALTER TABLE public.rewards DROP CONSTRAINT rewards_name_key;
END IF;
-- And checking for a unique index that might not be a formal constraint
DROP INDEX IF EXISTS public.achievements_name_key;
DROP INDEX IF EXISTS public.rewards_name_key;
END $$;