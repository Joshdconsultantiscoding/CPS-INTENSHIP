-- Resilient Reward Approval Fix
-- Fixes NULL point propagation and trigger crashes
-- 1. Ensure all tasks have a non-null points value (fallback to 10)
UPDATE public.tasks
SET points = 10
WHERE points IS NULL;
UPDATE public.tasks
SET approval_status = 'pending'
WHERE approval_status IS NULL;
-- 2. Optimized and Resilient Trigger Function
CREATE OR REPLACE FUNCTION public.award_task_points() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_points INTEGER;
v_assignee_id UUID;
BEGIN -- Only run if approval_status changed to 'approved'
IF (
    NEW.approval_status = 'approved'
    AND (
        OLD.approval_status IS NULL
        OR OLD.approval_status != 'approved'
    )
) THEN v_points := COALESCE(NEW.points, 0);
v_assignee_id := NEW.assigned_to;
IF v_assignee_id IS NOT NULL
AND v_points > 0 THEN -- Update user profile points
UPDATE public.profiles
SET total_points = COALESCE(total_points, 0) + v_points,
    updated_at = NOW()
WHERE id = v_assignee_id;
-- Create a record in rewards table for history
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
        COALESCE(
            'Task completed: ' || NEW.title,
            'Task completed'
        ),
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
        v_assignee_id,
        'Reward Approved',
        'Your reward of ' || v_points || ' points for task "' || COALESCE(NEW.title, 'Task') || '" has been approved!',
        'achievement',
        NEW.id,
        'task'
    );
END IF;
END IF;
RETURN NEW;
END;
$$;
-- 3. Re-attach trigger
DROP TRIGGER IF EXISTS on_task_approval ON public.tasks;
CREATE TRIGGER on_task_approval
AFTER
UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.award_task_points();
-- 4. Verify RLS (Admins need to be able to see and update all tasks)
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;
CREATE POLICY "Admins can manage all tasks" ON public.tasks FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
-- 5. Ensure Profiles have proper defaults for points
ALTER TABLE public.profiles
ALTER COLUMN total_points
SET DEFAULT 0;
UPDATE public.profiles
SET total_points = 0
WHERE total_points IS NULL;