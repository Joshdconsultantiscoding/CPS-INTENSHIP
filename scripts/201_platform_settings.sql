-- ============================================================
-- PLATFORM SETTINGS TABLE
-- Stores global feature flags and system-wide configurations.
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    portal_selection BOOLEAN NOT NULL DEFAULT true,
    new_registrations BOOLEAN NOT NULL DEFAULT true,
    ai_content_generation BOOLEAN NOT NULL DEFAULT false,
    marketing_banner_active BOOLEAN NOT NULL DEFAULT false,
    marketing_banner_text TEXT DEFAULT 'Welcome to CPS InternHub!',
    system_announcement TEXT DEFAULT '',
    referral_system_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT -- Email or ID of the admin who made the change
);
-- Add column if not exists (for existing tables)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'platform_settings'
        AND column_name = 'referral_system_enabled'
) THEN
ALTER TABLE platform_settings
ADD COLUMN referral_system_enabled BOOLEAN NOT NULL DEFAULT true;
END IF;
END $$;
-- Seed with initial row if not exists
INSERT INTO platform_settings (
        id,
        maintenance_mode,
        portal_selection,
        new_registrations,
        ai_content_generation,
        referral_system_enabled
    )
SELECT gen_random_uuid(),
    false,
    true,
    true,
    false,
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM platform_settings
    )
LIMIT 1;
-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
-- Service role access (idempotent)
DROP POLICY IF EXISTS "Service role full access on platform_settings" ON platform_settings;
CREATE POLICY "Service role full access on platform_settings" ON platform_settings FOR ALL USING (true) WITH CHECK (true);
-- Enable Realtime for this table (idempotent)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'platform_settings'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE platform_settings;
END IF;
END $$;