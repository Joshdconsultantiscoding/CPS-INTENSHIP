-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;
-- Re-create policies with explicit permissions
-- 1. View: Users can view messages where they are the sender OR recipient OR it's a channel message
CREATE POLICY "Users can view messages" ON messages FOR
SELECT USING (
        auth.uid() = sender_id
        OR auth.uid() = recipient_id
        OR channel_id IS NOT NULL
    );
-- 2. Insert: Authenticated users can insert messages if they are the sender
CREATE POLICY "Users can insert messages" ON messages FOR
INSERT WITH CHECK (auth.uid() = sender_id);
-- 3. Update: Users can update/mark read messages sent to them or by them
CREATE POLICY "Users can update messages" ON messages FOR
UPDATE USING (
        auth.uid() = sender_id
        OR auth.uid() = recipient_id
    );
-- Grant permissions to authenticated role (UUID PK doesn't use sequence)
GRANT ALL ON messages TO authenticated;