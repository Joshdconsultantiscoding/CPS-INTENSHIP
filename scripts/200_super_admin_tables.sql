-- ============================================================
-- SUPER ADMIN CONTROL CENTER TABLES
-- Safe additions only — does NOT modify any existing tables
-- Run this in Supabase SQL Editor
-- ============================================================
-- 1. Admins table — tracks admin users created by Super Admin
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE
    SET NULL,
        slug TEXT UNIQUE,
        email TEXT,
        full_name TEXT,
        company_name TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins (user_id);
CREATE INDEX IF NOT EXISTS idx_admins_slug ON admins (slug);
-- 2. Mentors table
CREATE TABLE IF NOT EXISTS mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    skills TEXT [] DEFAULT '{}',
    rating NUMERIC(3, 2) DEFAULT 0,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE
    SET NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentors_user_id ON mentors (user_id);
-- 3. Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT,
    industry TEXT,
    website TEXT,
    total_hires INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies (user_id);
-- 4. Intern pool — global talent pool
CREATE TABLE IF NOT EXISTS intern_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    skills TEXT [] DEFAULT '{}',
    points INT DEFAULT 0,
    certificates INT DEFAULT 0,
    assigned_workspace_id UUID REFERENCES workspaces(id) ON DELETE
    SET NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intern_pool_user_id ON intern_pool (user_id);
CREATE INDEX IF NOT EXISTS idx_intern_pool_workspace ON intern_pool (assigned_workspace_id);
-- 5. System logs — audit trail
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    actor TEXT,
    target_type TEXT,
    target_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs (action);
-- 6. Enable RLS with permissive policies (service role access)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE intern_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on admins" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on mentors" ON mentors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on companies" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on intern_pool" ON intern_pool FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on system_logs" ON system_logs FOR ALL USING (true) WITH CHECK (true);