-- =============================================================
-- 203_harden_rewards.sql
-- Harden rewards persistence — add expiry, archive, view
-- =============================================================
-- Ensure persistence columns exist
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
-- View for active, non-expired, non-archived rewards
CREATE OR REPLACE VIEW active_rewards AS
SELECT *
FROM rewards
WHERE is_active = true
    AND archived_at IS NULL
    AND (
        expires_at IS NULL
        OR expires_at > now()
    );