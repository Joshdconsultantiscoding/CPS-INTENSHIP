-- SQL FIX: Synchronize Profile Names and Avatars
-- 1. Update the handle_new_user trigger to handle first_name/last_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
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
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', ''),
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            (
                COALESCE(new.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data->>'last_name', '')
            ),
            split_part(new.email, '@', 1)
        ),
        COALESCE(new.raw_user_meta_data->>'role', 'intern'),
        new.raw_user_meta_data->>'department',
        COALESCE(
            new.raw_user_meta_data->>'avatar_url',
            new.raw_user_meta_data->>'picture'
        ),
        COALESCE(
            new.raw_user_meta_data->>'auth_provider',
            new.raw_app_meta_data->>'provider',
            'email'
        ),
        'online',
        NOW()
    ) ON CONFLICT (id) DO
UPDATE
SET first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    online_status = 'online',
    last_seen_at = NOW();
RETURN new;
END;
$$;
-- 2. Create a trigger to ALWAYS keep full_name in sync with first_name + last_name
CREATE OR REPLACE FUNCTION public.sync_full_name() RETURNS TRIGGER AS $$ BEGIN IF NEW.first_name IS NOT NULL
    OR NEW.last_name IS NOT NULL THEN NEW.full_name := TRIM(
        COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_sync_full_name ON public.profiles;
CREATE TRIGGER trg_sync_full_name BEFORE
INSERT
    OR
UPDATE OF first_name,
    last_name ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_full_name();
-- 3. Backfill existing data
UPDATE public.profiles
SET full_name = TRIM(
        COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
    )
WHERE (
        first_name IS NOT NULL
        OR last_name IS NOT NULL
    )
    AND (
        full_name IS NULL
        OR full_name = ''
    );