-- 108_class_communication_settings.sql
-- Add communication strategy columns to classes table
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS announcements_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS posting_permissions TEXT DEFAULT 'all' CHECK (
        posting_permissions IN ('all', 'mentors', 'staff')
    );
-- Update existing rows to ensure they have the defaults
UPDATE public.classes
SET chat_enabled = true,
    announcements_enabled = true,
    posting_permissions = 'all'
WHERE chat_enabled IS NULL;