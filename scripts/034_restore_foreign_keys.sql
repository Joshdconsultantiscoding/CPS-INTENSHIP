-- =============================================
-- 034_RESTORE_FOREIGN_KEYS.SQL (ROBUST VERSION)
-- Restores all foreign keys dropped during Clerk ID migration
-- Uses defensive checks to skip missing columns/tables
-- =============================================
BEGIN;
DO $$
DECLARE i int;
v_count int := 0;
-- (tbl, col, ref_tbl, ref_col, on_delete)
defs text [] [] := ARRAY [
        ['posts', 'author_id', 'profiles', 'id', 'CASCADE'],
['comments', 'author_id', 'profiles', 'id', 'CASCADE'],
['comments', 'post_id', 'posts', 'id', 'CASCADE'],
['post_likes', 'user_id', 'profiles', 'id', 'CASCADE'],
['post_likes', 'post_id', 'posts', 'id', 'CASCADE'],
['post_likes', 'comment_id', 'comments', 'id', 'CASCADE'],
['messages', 'sender_id', 'profiles', 'id', 'CASCADE'],
['messages', 'recipient_id', 'profiles', 'id', 'CASCADE'],
['messages', 'channel_id', 'channels', 'id', 'SET NULL'],
['channels', 'created_by', 'profiles', 'id', 'SET NULL'],
['rewards', 'user_id', 'profiles', 'id', 'CASCADE'],
['rewards', 'awarded_by', 'profiles', 'id', 'SET NULL'],
['notifications', 'user_id', 'profiles', 'id', 'CASCADE'],
['activity_logs', 'user_id', 'profiles', 'id', 'CASCADE'],
['ai_chats', 'user_id', 'profiles', 'id', 'CASCADE'],
['tasks', 'assigned_to', 'profiles', 'id', 'SET NULL'],
['tasks', 'assigned_by', 'profiles', 'id', 'SET NULL'],
['daily_reports', 'user_id', 'profiles', 'id', 'CASCADE'],
['daily_reports', 'reviewed_by', 'profiles', 'id', 'SET NULL'],
['performance_scores', 'user_id', 'profiles', 'id', 'CASCADE'],
['user_achievements', 'user_id', 'profiles', 'id', 'CASCADE'],
['user_achievements', 'achievement_id', 'achievements', 'id', 'CASCADE'],
['course_assignments', 'user_id', 'profiles', 'id', 'CASCADE'],
['course_assignments', 'course_id', 'courses', 'id', 'CASCADE'],
['course_progress', 'user_id', 'profiles', 'id', 'CASCADE'],
['course_progress', 'course_id', 'courses', 'id', 'CASCADE'],
['class_enrollments', 'user_id', 'profiles', 'id', 'CASCADE'],
['class_enrollments', 'class_id', 'classes', 'id', 'CASCADE'],
['class_messages', 'user_id', 'profiles', 'id', 'CASCADE'],
['class_messages', 'class_id', 'classes', 'id', 'CASCADE'],
['calendar_events', 'user_id', 'profiles', 'id', 'CASCADE'],
['calendar_events', 'created_by', 'profiles', 'id', 'SET NULL'],
['leaderboard', 'user_id', 'profiles', 'id', 'CASCADE'],
['lesson_progress', 'user_id', 'profiles', 'id', 'CASCADE'],
['quiz_submissions', 'user_id', 'profiles', 'id', 'CASCADE'],
['classes', 'instructor_id', 'profiles', 'id', 'SET NULL'],
['courses', 'instructor_id', 'profiles', 'id', 'SET NULL'],
['api_settings', 'updated_by', 'profiles', 'id', 'SET NULL'] ];
BEGIN FOR i IN 1..array_upper(defs, 1) LOOP -- Check if it's safe to process (Table and referencing Column MUST exist)
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND table_name = defs [i] [1]
        AND column_name = defs [i] [2]
)
AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = defs [i] [3]
) THEN BEGIN -- Drop any existing FK with standard naming to prevent conflicts
EXECUTE format(
    'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
    defs [i] [1],
    defs [i] [1] || '_' || defs [i] [2] || '_fkey'
);
-- Add the constraint
EXECUTE format(
    'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(%I) ON DELETE %s',
    defs [i] [1],
    defs [i] [1] || '_' || defs [i] [2] || '_fkey',
    defs [i] [2],
    defs [i] [3],
    defs [i] [4],
    defs [i] [5]
);
v_count := v_count + 1;
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'Skipping %.%: %',
defs [i] [1],
defs [i] [2],
SQLERRM;
END;
END IF;
END LOOP;
RAISE NOTICE 'Successfully restored % foreign key relationships.',
v_count;
END $$;
COMMIT;