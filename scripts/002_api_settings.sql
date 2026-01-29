-- API Settings table for storing admin-configured API keys
-- Only admins can manage these settings, all users can read them

CREATE TABLE IF NOT EXISTS public.api_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  provider TEXT NOT NULL DEFAULT 'groq',
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (needed for AI to work for all users)
CREATE POLICY "Anyone can view api settings" ON public.api_settings FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert api settings" ON public.api_settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update api settings" ON public.api_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete api settings" ON public.api_settings FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add trigger for updated_at
CREATE TRIGGER update_api_settings_updated_at 
  BEFORE UPDATE ON public.api_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default placeholder row
INSERT INTO public.api_settings (setting_key, setting_value, provider, is_active) 
VALUES ('ai_api_key', NULL, 'groq', false)
ON CONFLICT (setting_key) DO NOTHING;
