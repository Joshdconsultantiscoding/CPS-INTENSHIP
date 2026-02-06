-- =============================================
-- DEEP FIX: CLERK ID COMPATIBILITY FOR REWARDS
-- =============================================
-- 1. Convert point_history (the renamed rewards ledger) to TEXT
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'point_history'
) THEN -- user_id
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'point_history'
        AND column_name = 'user_id'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.point_history
ALTER COLUMN user_id TYPE TEXT;
END IF;
-- awarded_by
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'point_history'
        AND column_name = 'awarded_by'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.point_history
ALTER COLUMN awarded_by TYPE TEXT;
END IF;
END IF;
END $$;
-- 2. Convert notifications to TEXT (redundancy check)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'notifications'
) THEN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'notifications'
        AND column_name = 'user_id'
        AND data_type = 'uuid'
) THEN
ALTER TABLE public.notifications
ALTER COLUMN user_id TYPE TEXT;
END IF;
END IF;
END $$;
-- 3. Add category and points_awarded to posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS category TEXT CHECK (
        category IN (
            'urgent',
            'high_priority',
            'brainstorm',
            'normal'
        )
    ) DEFAULT 'normal';
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
-- 4. Create Correct Reward Function (clerk_friendly)
CREATE OR REPLACE FUNCTION public.reward_post_v1(
        post_id UUID,
        reward_points INTEGER,
        admin_id TEXT
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_author_id TEXT;
v_content TEXT;
BEGIN -- Get post author and content
SELECT author_id,
    content INTO v_author_id,
    v_content
FROM public.posts
WHERE id = post_id;
IF v_author_id IS NOT NULL THEN -- Update user profile points
UPDATE public.profiles
SET total_points = COALESCE(total_points, 0) + reward_points,
    updated_at = NOW()
WHERE id = v_author_id;
-- Create reward record in point_history
INSERT INTO public.point_history (
        user_id,
        points,
        reason,
        reward_type,
        reference_id,
        awarded_by,
        created_at
    )
VALUES (
        v_author_id,
        reward_points,
        'Brilliant Contribution: ' || LEFT(v_content, 50) || '...',
        'bonus',
        post_id,
        admin_id,
        NOW()
    );
-- Create notification
INSERT INTO public.notifications (
        user_id,
        title,
        message,
        notification_type,
        reference_id,
        reference_type,
        created_at
    )
VALUES (
        v_author_id,
        'Brilliant Contribution Reward!',
        'An admin rewarded your post with ' || reward_points || ' points!',
        'success',
        post_id,
        'post',
        NOW()
    );
RETURN jsonb_build_object('success', true, 'points', reward_points);
END IF;
RETURN jsonb_build_object('success', false, 'error', 'Post not found');
END;
$$;