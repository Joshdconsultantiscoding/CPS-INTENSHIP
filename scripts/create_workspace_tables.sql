-- ============================================================
-- MULTI-TENANT WORKSPACE TABLES
-- Safe additions only — does NOT modify any existing tables
-- ============================================================
-- 1. Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (
        type IN ('admin', 'mentor', 'company', 'recruiter', 'ai')
    ),
    owner_id TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Index for fast slug lookups (used in /w/[slug] routes)
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces (slug);
-- Index for fast owner lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces (owner_id);
-- 2. Workspace members table
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'intern')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Prevent duplicate memberships
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_unique ON workspace_members (workspace_id, user_id);
-- Index for fast user membership lookups
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members (user_id);
-- Index for fast workspace member listings
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members (workspace_id);
-- 3. Enable RLS (but use permissive policies — actual filtering is done in app layer)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
-- Allow service role full access (our admin client bypasses RLS anyway, but this is belt-and-suspenders)
CREATE POLICY "Service role full access on workspaces" ON workspaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on workspace_members" ON workspace_members FOR ALL USING (true) WITH CHECK (true);