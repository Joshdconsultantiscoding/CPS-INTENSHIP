-- =============================================
-- OPTIMIZATION: MESSAGING PERFORMANCE
-- =============================================
-- Adds indexes to speed up message retrieval and filtering.
BEGIN;
-- 1. Index for Sender/Recipient lookups (Fundamental for DMs)
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
-- 2. Index for Channel lookups (Fundamental for Group Chat)
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
-- 3. Composite Index for "Conversation" lookups (The most common query)
-- Finds messages between User A and User B quickly.
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, recipient_id)
WHERE channel_id IS NULL;
-- 4. Index for Sorting by Date (Pagination)
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
-- 5. Composite Index for Channel Messages sorted by Date
CREATE INDEX IF NOT EXISTS idx_messages_channel_date ON public.messages(channel_id, created_at DESC)
WHERE channel_id IS NOT NULL;
-- 6. Analyze tables to update query planner statistics
ANALYZE public.messages;
COMMIT;