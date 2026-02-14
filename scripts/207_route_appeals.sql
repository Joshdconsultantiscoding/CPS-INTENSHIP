-- Migration to support route-specific appeals
ALTER TABLE public.appeals 
ADD COLUMN IF NOT EXISTS appeal_type text CHECK (appeal_type IN ('suspension', 'route_block')) DEFAULT 'suspension',
ADD COLUMN IF NOT EXISTS target_route text;

-- Update the handle_appeal_decision function to handle route unblocking
CREATE OR REPLACE FUNCTION public.handle_appeal_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Handle account suspension approval
    IF NEW.appeal_type = 'suspension' THEN
      UPDATE public.profiles
      SET account_status = 'active',
          suspended_reason = NULL
      WHERE id = NEW.user_id;
    
    -- Handle route block approval
    ELSIF NEW.appeal_type = 'route_block' AND NEW.target_route IS NOT NULL THEN
      UPDATE public.profiles
      SET blocked_routes = array_remove(blocked_routes, NEW.target_route)
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
