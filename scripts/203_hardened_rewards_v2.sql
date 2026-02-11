-- ============================================================
-- REWARDS SYSTEM HARDENING (Decoupling catalog from ledger)
-- Creates dedicated tables for items and claims.
-- ============================================================
-- 1. Reward Items (The Catalog)
CREATE TABLE IF NOT EXISTS public.reward_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL DEFAULT 100,
    icon TEXT DEFAULT 'gift',
    reward_type TEXT DEFAULT 'badge' CHECK (
        reward_type IN (
            'coupon',
            'ai_credits',
            'free_course',
            'subscription_days',
            'badge'
        )
    ),
    reward_value JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Ensure columns exist if table was created in a previous run without them
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'reward_items'
        AND column_name = 'reward_type'
) THEN
ALTER TABLE public.reward_items
ADD COLUMN reward_type TEXT DEFAULT 'badge' CHECK (
        reward_type IN (
            'coupon',
            'ai_credits',
            'free_course',
            'subscription_days',
            'badge'
        )
    );
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'reward_items'
        AND column_name = 'reward_value'
) THEN
ALTER TABLE public.reward_items
ADD COLUMN reward_value JSONB DEFAULT '{}';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'reward_items'
        AND column_name = 'max_redemptions'
) THEN
ALTER TABLE public.reward_items
ADD COLUMN max_redemptions INTEGER;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'reward_items'
        AND column_name = 'current_redemptions'
) THEN
ALTER TABLE public.reward_items
ADD COLUMN current_redemptions INTEGER DEFAULT 0;
END IF;
END $$;
-- 2. Reward Claims (The History)
CREATE TABLE IF NOT EXISTS public.reward_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reward_item_id UUID NOT NULL REFERENCES public.reward_items(id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'rejected')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 3. Enable RLS
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;
-- 4. Policies: Reward Items
DROP POLICY IF EXISTS "Public can view active rewards" ON public.reward_items;
CREATE POLICY "Public can view active rewards" ON public.reward_items FOR
SELECT USING (
        is_active = true
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = (
                    select auth.jwt()->>'sub'
                )
                AND role = 'admin'
        )
    );
DROP POLICY IF EXISTS "Admin full access reward_items" ON public.reward_items;
CREATE POLICY "Admin full access reward_items" ON public.reward_items FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (
                select auth.jwt()->>'sub'
            )
            AND role = 'admin'
    )
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (
                select auth.jwt()->>'sub'
            )
            AND role = 'admin'
    )
);
-- 5. Policies: Reward Claims
DROP POLICY IF EXISTS "Users can view own claims" ON public.reward_claims;
CREATE POLICY "Users can view own claims" ON public.reward_claims FOR
SELECT USING (
        user_id = (
            select auth.jwt()->>'sub'
        )
    );
DROP POLICY IF EXISTS "Admin view all claims" ON public.reward_claims;
CREATE POLICY "Admin view all claims" ON public.reward_claims FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (
                select auth.jwt()->>'sub'
            )
            AND role = 'admin'
    )
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (
                select auth.jwt()->>'sub'
            )
            AND role = 'admin'
    )
);
-- 6. Enable Realtime (Idempotent)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'reward_items'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE reward_items;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'reward_claims'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE reward_claims;
END IF;
END $$;
-- 7. Update existing redemptions table to point to reward_items
ALTER TABLE IF EXISTS public.redemptions
    RENAME COLUMN reward_id TO legacy_reward_id;
ALTER TABLE IF EXISTS public.redemptions
ADD COLUMN IF NOT EXISTS reward_item_id UUID REFERENCES public.reward_items(id) ON DELETE CASCADE;
-- 8. Migrate data from old rewards to reward_items (Safe Migration)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.TABLES
    WHERE table_name = 'rewards'
) THEN
INSERT INTO public.reward_items (
        name,
        description,
        points_required,
        icon,
        reward_type,
        reward_value,
        expires_at,
        max_redemptions,
        current_redemptions,
        is_active,
        created_at
    )
SELECT name,
    description,
    points_required,
    icon,
    COALESCE(reward_type, 'badge'),
    COALESCE(reward_value, '{}'::jsonb),
    expires_at,
    max_redemptions,
    current_redemptions,
    is_active,
    created_at
FROM public.rewards
WHERE name IS NOT NULL
    AND points_required > 0 ON CONFLICT DO NOTHING;
END IF;
END $$;