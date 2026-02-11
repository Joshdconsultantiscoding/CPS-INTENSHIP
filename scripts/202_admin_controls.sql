-- =============================================================
-- 202_admin_controls.sql
-- Add user lifecycle management for admins
-- (suspend, block, delete) + audit logging
-- =============================================================
-- Add status fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (
        account_status IN ('active', 'suspended', 'blocked', 'deleted')
    );
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS blocked_routes TEXT [] DEFAULT '{}';
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
-- Audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL REFERENCES profiles(id),
    target_user_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (
        action IN (
            'suspend',
            'unsuspend',
            'block',
            'unblock',
            'delete',
            'restore'
        )
    ),
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_user_id);
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins see all audit logs" ON admin_audit_log FOR
SELECT USING (true);
CREATE POLICY "Admins insert audit logs" ON admin_audit_log FOR
INSERT WITH CHECK (true);