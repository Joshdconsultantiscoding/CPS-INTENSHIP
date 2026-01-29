-- Add message delivery status fields
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Update profile online status handling
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_typing_to UUID,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Function to update last seen
CREATE OR REPLACE FUNCTION public.update_user_presence(user_uuid UUID, status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    online_status = status,
    last_seen_at = CASE WHEN status = 'offline' THEN NOW() ELSE last_seen_at END,
    last_active_at = NOW()
  WHERE id = user_uuid;
END;
$$;

-- Function to mark messages as delivered when recipient comes online
CREATE OR REPLACE FUNCTION public.mark_messages_delivered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.online_status = 'online' AND OLD.online_status != 'online' THEN
    UPDATE public.messages 
    SET status = 'delivered', delivered_at = NOW()
    WHERE recipient_id = NEW.id AND status = 'sent';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_online ON public.profiles;
CREATE TRIGGER on_user_online
  AFTER UPDATE OF online_status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_messages_delivered();
