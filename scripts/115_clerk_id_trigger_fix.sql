-- =============================================
-- DEEP FIX: CLERK ID COMPATIBILITY FOR TRIGGERS (v1)
-- =============================================
-- This script fixes the 'invalid input syntax for type uuid' error
-- by converting UUID variables to TEXT in trigger functions.
BEGIN;
-- 1. Redefine award_task_points_v2 (Used in on_task_approval_v2)
CREATE OR REPLACE FUNCTION public.award_task_points_v2() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_points INTEGER;
v_assignee_id TEXT;
-- CHANGED FROM UUID
v_task_title TEXT;
BEGIN -- Only run if approval_status changed to 'approved'
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
SET total_points = COALESCE(total_points, 0) + v_points,
    updated_at = NOW()
WHERE id = v_assignee_id;
-- Create a record in rewards/point_history table
BEGIN -- Try point_history first (some migrations renamed rewards)
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'point_history'
) THEN
INSERT INTO public.point_history (
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
ELSE
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
END IF;
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Failed to log reward history: %',
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
WHEN OTHERS THEN RAISE WARNING 'Failed to create notification: %',
SQLERRM;
END;
END IF;
END IF;
RETURN NEW;
END;
$$;
-- 2. Redefine legacy award_task_points (Used in on_task_approval)
CREATE OR REPLACE FUNCTION public.award_task_points() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_points INTEGER;
v_assignee_id TEXT;
-- CHANGED FROM UUID
BEGIN IF (
    NEW.approval_status = 'approved'
    AND (
        OLD.approval_status IS NULL
        OR OLD.approval_status != 'approved'
    )
) THEN v_points := COALESCE(NEW.points, 0);
v_assignee_id := NEW.assigned_to;
IF v_assignee_id IS NOT NULL
AND v_points > 0 THEN
UPDATE public.profiles
SET total_points = COALESCE(total_points, 0) + v_points
WHERE id = v_assignee_id;
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
        'Task reward approved: ' || v_points || ' points',
        'achievement',
        NEW.id,
        'task'
    );
END IF;
END IF;
RETURN NEW;
END;
$$;
COMMIT;