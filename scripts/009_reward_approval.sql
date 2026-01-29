-- Add approval_status to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (
        approval_status IN ('pending', 'approved', 'rejected')
    );
-- Create function to award points on approval
CREATE OR REPLACE FUNCTION award_task_points() RETURNS TRIGGER AS $$ BEGIN -- Only run if approval_status changed to 'approved' and points > 0
    IF NEW.approval_status = 'approved'
    AND OLD.approval_status != 'approved'
    AND NEW.points > 0 THEN -- Update user profile points
UPDATE public.profiles
SET total_points = total_points + NEW.points
WHERE id = NEW.assigned_to;
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
        NEW.assigned_to,
        'Reward Approved',
        'Your reward of ' || NEW.points || ' points for task "' || NEW.title || '" has been approved!',
        'achievement',
        NEW.id,
        'task'
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_task_approval ON public.tasks;
CREATE TRIGGER on_task_approval
AFTER
UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION award_task_points();