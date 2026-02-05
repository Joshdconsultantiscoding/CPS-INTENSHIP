-- Add call metadata columns to messages for structured call logs
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS call_type TEXT,
ADD COLUMN IF NOT EXISTS call_status TEXT,
ADD COLUMN IF NOT EXISTS call_duration TEXT;

-- Optional: allow message_type 'call'. If your DB has a check on message_type, run:
-- ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
-- ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check
--   CHECK (message_type IS NULL OR message_type IN ('text', 'file', 'image', 'voice', 'announcement', 'call'));
