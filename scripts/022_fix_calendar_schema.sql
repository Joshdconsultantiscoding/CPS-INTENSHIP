-- Fix calendar_events schema to match profiles.id (TEXT)
-- Based on error: "column created_by does not exist", we infer the column is named 'user_id'
-- Changes user_id from UUID to TEXT
-- Changes attendees from UUID[] to TEXT[]
-- Adds is_public BOOLEAN column if missing
-- 1. Drop the foreign key constraint first (handling potential names)
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_user_id_fkey;
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_created_by_fkey;
-- 2. Alter the user_id column type (assuming this is the creator column based on previous code)
ALTER TABLE public.calendar_events
ALTER COLUMN user_id TYPE TEXT;
-- 3. Re-add the foreign key constraint
ALTER TABLE public.calendar_events
ADD CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
-- 4. Alter the attendees column type (if it exists)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calendar_events'
        AND column_name = 'attendees'
) THEN
ALTER TABLE public.calendar_events
ALTER COLUMN attendees TYPE TEXT [];
END IF;
END $$;
-- 5. Add is_public column (missing in original schema but used in UI)
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;