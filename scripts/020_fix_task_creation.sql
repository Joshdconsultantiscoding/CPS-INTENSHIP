-- Task Creation Enhancement Script
-- This ensures the tasks table has all required columns and proper indexes
-- =============================================
-- ENSURE POINTS COLUMN EXISTS
-- =============================================
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;
-- =============================================
-- ADD INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON public.tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
-- =============================================
-- CREATE DEBUG FUNCTION FOR RLS ISSUES
-- =============================================
CREATE OR REPLACE FUNCTION debug_user_role(user_id UUID) RETURNS TABLE (
        id UUID,
        email TEXT,
        role TEXT,
        status TEXT
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT p.id,
    p.email,
    p.role,
    p.status
FROM public.profiles p
WHERE p.id = user_id;
END;
$$;
COMMENT ON FUNCTION debug_user_role IS 'Helper function to debug user roles and permissions';
-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION debug_user_role TO authenticated;