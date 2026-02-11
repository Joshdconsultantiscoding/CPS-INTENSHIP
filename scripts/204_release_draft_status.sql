-- =============================================================
-- 204_release_draft_status.sql
-- Add draft/publish flow to changelogs
-- =============================================================
ALTER TABLE changelogs
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published'));
ALTER TABLE changelogs
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
-- Backfill existing records as published
UPDATE changelogs
SET status = 'published',
    published_at = created_at
WHERE status IS NULL;