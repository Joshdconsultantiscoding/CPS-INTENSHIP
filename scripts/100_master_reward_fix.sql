-- MASTER REWARD FIX (OmniFix)
-- This script fixes EVERYTHING related to reward approval in one go
-- 1. CLEANUP: Remove potentially conflicting triggers
DROP TRIGGER IF EXISTS on_task_approval ON public.tasks;
DROP TRIGGER IF EXISTS award_task_points_trigger ON public.tasks;
-- 2. SCHEMA: Ensure all columns exist with proper types and defaults
-- Profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
UPDATE public.profiles
SET total_points = 0
WHERE total_points IS NULL;
ALTER TABLE public.profiles
ALTER COLUMN total_points
SET NOT NULL;
-- Tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
UPDATE public.tasks
SET points = 10
WHERE points IS NULL;
UPDATE public.tasks
SET approval_status = 'pending'
WHERE approval_status IS NULL;
-- 3. FUNCTION: Robust award_task_points with better error handling
CREATE OR REPLACE FUNCTION public.award_task_points_v2() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_points INTEGER;
v_assignee_id UUID;
v_task_title TEXT;
BEGIN -- Log start (visible in Supabase logs)
RAISE NOTICE 'Trigger award_task_points_v2 for task %',
NEW.id;
-- Only run if approval_status changed to 'approved'
IF (
    NEW.approval_status = 'approved'
    AND (
        OLD.approval_status IS NULL
        OR OLD.approval_status != 'approved'
    )
) THEN v_points := COALESCE(NEW.points, 0);
v_assignee_id := NEW.assigned_to;
v_task_title := COALESCE(NEW.title, 'Unknown Task');
IF v_assignee_id IS NOT NULL
AND v_points > 0 THEN -- Update user profile points
UPDATE public.profiles
SET total_points = total_points + v_points,
    updated_at = NOW()
WHERE id = v_assignee_id;
-- Create a record in rewards table for history
-- We use a block to catch errors in case rewards table structure is different
BEGIN
INSERT INTO public.rewards (
        user_id,
        points,
        reason,
        reward_type,
        reference_id,
        created_at
    )
VALUES (
        v_assignee_id,
        v_points,
        'Task completed: ' || v_task_title,
        'task',
        NEW.id,
        NOW()
    );
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Failed to insert into rewards table: %',
SQLERRM;
END;
-- Create notification
BEGIN
INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        reference_id,
        reference_type
    )
VALUES (
        v_assignee_id,
        'Reward Approved',
        'Your reward of ' || v_points || ' points for task "' || v_task_title || '" has been approved!',
        'achievement',
        NEW.id,
        'task'
    );
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Failed to insert into notifications table: %',
SQLERRM;
END;
END IF;
END IF;
RETURN NEW;
END;
$$;
-- 4. RE-ATTACH: Trigger to the tasks table
CREATE TRIGGER on_task_approval_v2
AFTER
UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.award_task_points_v2();
-- 5. PERMISSIONS: Grant absolute power to admins for tasks
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can do everything on tasks" ON public.tasks;
CREATE POLICY "Admins can do everything on tasks" ON public.tasks FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
-- Ensure normal users can still see their tasks
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
CREATE POLICY "Users can view assigned tasks" ON public.tasks FOR
SELECT TO authenticated USING (
        assigned_to = auth.uid()
        OR assigned_by = auth.uid()
    );