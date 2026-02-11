-- ============================================
-- 200: REFERRAL SYSTEM
-- Referral codes, tracking, points ledger, and redemptions
-- ============================================
-- 1. Referral codes (one per user)
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
-- 2. Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referred_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    CONSTRAINT no_self_referral CHECK (referrer_id <> referred_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
-- 3. Points ledger (append-only for auditability)
CREATE TABLE IF NOT EXISTS referral_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_points_user ON referral_points(user_id);
-- 4. Extend rewards table for typed rewards
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'badge' CHECK (
        reward_type IN (
            'coupon',
            'ai_credits',
            'free_course',
            'subscription_days',
            'badge'
        )
    );
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS reward_value JSONB DEFAULT '{}';
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS max_redemptions INTEGER;
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS current_redemptions INTEGER DEFAULT 0;
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
-- 5. Redemption history
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    coupon_code TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'revoked')),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_reward ON redemptions(reward_id);
-- 6. RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
-- Anyone can read referral codes (needed for signup validation)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'referral_codes_select_all'
) THEN CREATE POLICY referral_codes_select_all ON referral_codes FOR
SELECT USING (true);
END IF;
END $$;
-- Anyone can read referrals
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'referrals_select_all'
) THEN CREATE POLICY referrals_select_all ON referrals FOR
SELECT USING (true);
END IF;
END $$;
-- Anyone can read referral points
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'referral_points_select_all'
) THEN CREATE POLICY referral_points_select_all ON referral_points FOR
SELECT USING (true);
END IF;
END $$;
-- Anyone can read redemptions
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'redemptions_select_all'
) THEN CREATE POLICY redemptions_select_all ON redemptions FOR
SELECT USING (true);
END IF;
END $$;
-- Active rewards view
CREATE OR REPLACE VIEW active_rewards AS
SELECT *
FROM rewards
WHERE is_active = true
    AND archived_at IS NULL
    AND (
        expires_at IS NULL
        OR expires_at > now()
    );