-- PHASE 1.5: REWARDS & ACHIEVEMENTS SCHEMA REFACTOR
-- Aligning DB with Frontend expectations (Reward = Catalog, Achievement = User Link)
-- 1. Rename junction table 'user_achievements' to 'achievements' temp
ALTER TABLE IF EXISTS public.user_achievements
    RENAME TO achievements_temp;
-- 2. Rename catalog table 'achievements' to 'rewards'
-- But wait, 'rewards' already exists (as ledger).
ALTER TABLE IF EXISTS public.rewards
    RENAME TO point_history;
-- 3. Now rename 'achievements' catalog to 'rewards'
ALTER TABLE IF EXISTS public.achievements
    RENAME TO rewards;
-- 4. Rename 'achievements_temp' to 'achievements'
ALTER TABLE IF EXISTS public.achievements_temp
    RENAME TO achievements;
-- 5. Update columns in 'rewards' (the new catalog) to match lib/types.ts
ALTER TABLE public.rewards
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
-- 6. Update columns in 'achievements' (the new junction)
-- Frontend expects 'reward_id' instead of 'achievement_id'
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'achievements'
        AND column_name = 'achievement_id'
) THEN
ALTER TABLE public.achievements
    RENAME COLUMN achievement_id TO reward_id;
END IF;
END $$;
-- 7. Update the trigger 'award_task_points_v2' to use 'point_history' instead of 'rewards'
CREATE OR REPLACE FUNCTION public.award_task_points_v2() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_points INTEGER;
v_assignee_id UUID;
v_task_title TEXT;
BEGIN IF (
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
-- Point history ledger
BEGIN
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
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Failed to insert into point_history: %',
SQLERRM;
END;
-- Notification
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
-- 8. Policies cleanup & re-apply
ALTER TABLE public.point_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage point history" ON public.point_history;
CREATE POLICY "Admins can manage point history" ON public.point_history FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
DROP POLICY IF EXISTS "Users can view own point history" ON public.point_history;
CREATE POLICY "Users can view own point history" ON public.point_history FOR
SELECT TO authenticated USING (user_id = auth.uid());
-- 9. AUTO-REWARD SYSTEM: Perfect Score (5-star report)
CREATE OR REPLACE FUNCTION public.auto_grant_perfect_score() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_reward_id UUID;
BEGIN -- Only trigger if admin_rating is 5 and was either updated to 5 or newly inserted as 5
IF (
    NEW.admin_rating = 5
    AND (
        OLD.admin_rating IS NULL
        OR OLD.admin_rating < 5
    )
) THEN -- Find the 'Perfect Score' reward in the catalog
SELECT id INTO v_reward_id
FROM public.rewards
WHERE name = 'Perfect Score'
LIMIT 1;
IF v_reward_id IS NOT NULL THEN -- Grant the reward if not already earned
INSERT INTO public.achievements (user_id, reward_id, earned_at)
VALUES (NEW.user_id, v_reward_id, NOW()) ON CONFLICT (user_id, reward_id) DO NOTHING;
-- Optional: Add bonus points for 5-star? (e.g., 50 points)
UPDATE public.profiles
SET total_points = total_points + 50
WHERE id = NEW.user_id;
INSERT INTO public.point_history (
        user_id,
        points,
        reason,
        reward_type,
        reference_id
    )
VALUES (
        NEW.user_id,
        50,
        'Bonus: 5-Star Daily Report!',
        'bonus',
        NEW.id
    );
-- Notify
INSERT INTO public.notifications (
        user_id,
        title,
        message,
        notification_type,
        reference_id,
        reference_type
    )
VALUES (
        NEW.user_id,
        'Achievement Unlocked!',
        'You earned the "Perfect Score" badge and 50 bonus points for your 5-star report!',
        'achievement',
        v_reward_id,
        'reward'
    );
END IF;
END IF;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_report_rated_5star ON public.daily_reports;
CREATE TRIGGER on_report_rated_5star
AFTER
UPDATE ON public.daily_reports FOR EACH ROW EXECUTE FUNCTION public.auto_grant_perfect_score();