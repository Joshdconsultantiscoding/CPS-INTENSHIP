-- Create a stored procedure to handle profile updates securely
-- This ignores RLS policies because it will be called with a Postgres function set to SECURITY DEFINER
CREATE OR REPLACE FUNCTION sync_user_profile(
        p_id TEXT,
        p_email TEXT,
        p_full_name TEXT,
        p_avatar_url TEXT,
        p_role TEXT DEFAULT 'intern'
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER -- Run as the creator of the function (postgres/admin)
    AS $$
DECLARE result JSONB;
BEGIN
INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        role,
        online_status,
        last_seen_at
    )
VALUES (
        p_id,
        p_email,
        p_full_name,
        p_avatar_url,
        p_role,
        'online',
        NOW()
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    last_seen_at = NOW();
SELECT row_to_json(p)::JSONB INTO result
FROM public.profiles p
WHERE id = p_id;
RETURN result;
END;
$$;
-- Grant access to the function
GRANT EXECUTE ON FUNCTION sync_user_profile TO anon;
GRANT EXECUTE ON FUNCTION sync_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION sync_user_profile TO service_role;