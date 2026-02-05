-- Add call-related columns to messages table if they don't exist
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS call_type TEXT CHECK (call_type IN ('voice', 'video')),
    ADD COLUMN IF NOT EXISTS call_status TEXT CHECK (call_status IN ('missed', 'completed')),
    ADD COLUMN IF NOT EXISTS call_duration TEXT;
-- Create an index for faster lookups on call type (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_messages_call_type ON messages(call_type);
COMMENT ON COLUMN messages.call_type IS 'Type of the call: voice or video';
COMMENT ON COLUMN messages.call_status IS 'Status of the call: missed or completed';
COMMENT ON COLUMN messages.call_duration IS 'Duration of the call formatted as MM:SS';