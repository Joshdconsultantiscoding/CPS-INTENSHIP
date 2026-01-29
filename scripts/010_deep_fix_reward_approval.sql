-- Deep Fix for Reward Approval and Profile Stats
-- This script adds missing columns and fixes the reward awarding trigger
-- 1. Ensure Profiles table has all necessary columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS is_typing_to UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS auth_provider TEXT;
-- 2. Ensure Tasks table has points and approval columns
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (
        approval_status IN ('pending', 'approved', 'rejected')
    );
-- 3. Fix the Reward Awarding Trigger
CREATE OR REPLACE FUNCTION public.award_task_points() RETURNS TRIGGER AS $$
DECLARE assignee_id UUID;
BEGIN -- Log for debugging (visible in Supabase logs)
RAISE NOTICE 'Trigger award_task_points called for task % with status % and approval %',
NEW.id,
NEW.status,
NEW.approval_status;
-- Only run if approval_status changed to 'approved'
IF (
    NEW.approval_status = 'approved'
    AND (
        OLD.approval_status IS NULL
        OR OLD.approval_status != 'approved'
    )
) THEN -- Get the assignee ID
assignee_id := NEW.assigned_to;
IF assignee_id IS NOT NULL
AND NEW.points > 0 THEN -- Update user profile points
UPDATE public.profiles
SET total_points = COALESCE(total_points, 0) + NEW.points,
    updated_at = NOW()
WHERE id = assignee_id;
-- Create a record in rewards table for history/tracking
INSERT INTO public.rewards (
        user_id,
        points,
        reason,
        reward_type,
        reference_id,
        created_at
    )
VALUES (
        assignee_id,
        NEW.points,
        'Task completed: ' || NEW.title,
        'task',
        NEW.id,
        NOW()
    );
-- Create notification
INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        reference_id,
        reference_type
    )
VALUES (
        assignee_id,
        'Reward Approved',
        'Your reward of ' || NEW.points || ' points for task "' || NEW.title || '" has been approved!',
        'achievement',
        NEW.id,
        'task'
    );
RAISE NOTICE 'Points awarded to user %',
assignee_id;
END IF;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Re-attach trigger
DROP TRIGGER IF EXISTS on_task_approval ON public.tasks;
CREATE TRIGGER on_task_approval
AFTER
UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.award_task_points();
-- 4. Fix RLS for profiles (Ensure points can be updated by the trigger/system)
-- Trigger runs as the user who performs the update, so the admin must have permission to update profiles
-- Or we use SECURITY DEFINER on the function.
ALTER FUNCTION public.award_task_points() SECURITY DEFINER;
-- 5. Ensure Admin can update tasks
DROP POLICY IF EXISTS "Admins can update any task" ON public.tasks;
CREATE POLICY "Admins can update any task" ON public.tasks FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );