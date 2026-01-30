-- =============================================
-- EMERGENCY VAULT ACCESS CODE GENERATION
-- =============================================
-- 1. Create the table if it doesn't exist (Safety Check)
CREATE TABLE IF NOT EXISTS public.admin_access_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    used_by_email TEXT
);
-- 2. Enable RLS (Safety Check)
ALTER TABLE public.admin_access_codes ENABLE ROW LEVEL SECURITY;
-- 3. Policy: Only Service Role (or direct SQL access) can read/manage codes
-- We DROP purely to ensure we don't duplicate on re-runs
DROP POLICY IF EXISTS "Service Role Only" ON public.admin_access_codes;
CREATE POLICY "Service Role Only" ON public.admin_access_codes USING (false);
-- 4. INSERT 20 NEW CODES
-- We use "ON CONFLICT DO NOTHING" in case you run this twice
INSERT INTO public.admin_access_codes (code)
VALUES ('ADMIN-ALPHA-BRAVO-CHARLIE-001'),
    ('ADMIN-DELTA-ECHO-FOXTROT-002'),
    ('ADMIN-GOLF-HOTEL-INDIA-003'),
    ('ADMIN-JULIET-KILO-LIMA-004'),
    ('ADMIN-MIKE-NOVEMBER-OSCAR-005'),
    ('ADMIN-PAPA-QUEBEC-ROMEO-006'),
    ('ADMIN-SIERRA-TANGO-UNIFORM-007'),
    ('ADMIN-VICTOR-WHISKEY-XRAY-008'),
    ('ADMIN-YANKEE-ZULU-ZERO-009'),
    ('ADMIN-ONE-TWO-THREE-010'),
    ('ADMIN-RED-BLUE-GREEN-011'),
    ('ADMIN-NORTH-EAST-WEST-012'),
    ('ADMIN-SUN-MOON-STARS-013'),
    ('ADMIN-FIRE-WATER-EARTH-014'),
    ('ADMIN-GOLD-SILVER-BRONZE-015'),
    ('ADMIN-APPLE-BANANA-CHERRY-016'),
    ('ADMIN-LION-TIGER-BEAR-017'),
    ('ADMIN-EAGLE-HAWK-FALCON-018'),
    ('ADMIN-SHARK-WHALE-DOLPHIN-019'),
    ('ADMIN-MASTER-CONTROL-KEY-020') ON CONFLICT (code) DO NOTHING;