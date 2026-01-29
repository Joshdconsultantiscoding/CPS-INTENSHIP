-- Add auth_provider column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'auth_provider'
  ) THEN
    ALTER TABLE profiles ADD COLUMN auth_provider text DEFAULT 'email';
  END IF;
END $$;

-- Update the profile trigger to include auth_provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    department,
    avatar_url,
    auth_provider,
    online_status,
    last_seen_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data ->> 'role', 'intern'),
    new.raw_user_meta_data ->> 'department',
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    COALESCE(new.raw_user_meta_data ->> 'auth_provider', new.raw_app_meta_data ->> 'provider', 'email'),
    'online',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    auth_provider = COALESCE(EXCLUDED.auth_provider, profiles.auth_provider),
    online_status = 'online',
    last_seen_at = NOW();

  RETURN new;
END;
$$;
