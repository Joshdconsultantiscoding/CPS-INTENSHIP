-- Ensure status columns exist with proper types
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (
        status IN ('sending', 'sent', 'delivered', 'read')
    ),
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
-- Function to automatically update status if not set
CREATE OR REPLACE FUNCTION handle_message_status() RETURNS TRIGGER AS $$ BEGIN IF NEW.is_read = TRUE
    AND NEW.status != 'read' THEN NEW.status := 'read';
NEW.read_at := NOW();
ELSIF NEW.delivered_at IS NOT NULL
AND NEW.status != 'read' THEN NEW.status := 'delivered';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS on_message_status_update ON public.messages;
CREATE TRIGGER on_message_status_update BEFORE
UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION handle_message_status();