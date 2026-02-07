-- Changelog/Release Notes System
-- Table to store version release details
CREATE TABLE IF NOT EXISTS changelogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    features TEXT [] DEFAULT '{}',
    fixes TEXT [] DEFAULT '{}',
    improvements TEXT [] DEFAULT '{}',
    breaking_changes TEXT [] DEFAULT '{}',
    created_by TEXT REFERENCES profiles(id) ON DELETE
    SET NULL,
        is_major BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
);
-- Add last_seen_version to profiles to track "What's New" status
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen_version TEXT DEFAULT 'v0.0.0';
-- Enable RLS
ALTER TABLE changelogs ENABLE ROW LEVEL SECURITY;
-- Policies: Everyone can read, only admins can write
DROP POLICY IF EXISTS "Changelogs are viewable by everyone" ON changelogs;
CREATE POLICY "Changelogs are viewable by everyone" ON changelogs FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Only admins can create changelogs" ON changelogs;
CREATE POLICY "Only admins can create changelogs" ON changelogs FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()::text
                AND (
                    role = 'admin'
                    OR role = 'owner'
                )
        )
    );
DROP POLICY IF EXISTS "Only admins can update changelogs" ON changelogs;
CREATE POLICY "Only admins can update changelogs" ON changelogs FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()::text
                AND (
                    role = 'admin'
                    OR role = 'owner'
                )
        )
    );
-- Index for performance
CREATE INDEX IF NOT EXISTS idx_changelogs_created_at ON changelogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_changelogs_version ON changelogs(version);