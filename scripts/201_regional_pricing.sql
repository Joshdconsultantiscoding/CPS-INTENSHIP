-- ============================================
-- 201: REGIONAL PRICING SYSTEM
-- Region-aware pricing with auto-currency and exchange rates
-- ============================================
-- 1. Pricing regions
CREATE TABLE IF NOT EXISTS pricing_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code TEXT NOT NULL UNIQUE,
    region_name TEXT NOT NULL,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    price_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- 2. Pricing rules per plan per region
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID REFERENCES pricing_regions(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    monthly_price NUMERIC(10, 2) NOT NULL,
    annual_price NUMERIC(10, 2) NOT NULL,
    annual_discount_pct INTEGER DEFAULT 20,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(region_id, plan_name)
);
-- 3. Exchange rates (USD base)
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency TEXT NOT NULL DEFAULT 'USD',
    to_currency TEXT NOT NULL,
    rate NUMERIC(12, 6) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(from_currency, to_currency)
);
-- 4. RLS
ALTER TABLE pricing_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
-- Public read access
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'pricing_regions_select_all'
) THEN CREATE POLICY pricing_regions_select_all ON pricing_regions FOR
SELECT USING (true);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'pricing_rules_select_all'
) THEN CREATE POLICY pricing_rules_select_all ON pricing_rules FOR
SELECT USING (true);
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'exchange_rates_select_all'
) THEN CREATE POLICY exchange_rates_select_all ON exchange_rates FOR
SELECT USING (true);
END IF;
END $$;
-- 5. Seed regions
INSERT INTO pricing_regions (
        region_code,
        region_name,
        currency_code,
        currency_symbol,
        price_multiplier
    )
VALUES ('africa', 'Africa', 'NGN', '₦', 0.40),
    ('asia', 'Asia', 'INR', '₹', 0.60),
    ('europe', 'Europe', 'EUR', '€', 1.00),
    ('americas', 'Americas', 'USD', '$', 1.00),
    ('oceania', 'Oceania', 'AUD', 'A$', 0.90),
    ('middle_east', 'Middle East', 'AED', 'د.إ', 0.85) ON CONFLICT (region_code) DO NOTHING;
-- 6. Seed exchange rates (approximate)
INSERT INTO exchange_rates (from_currency, to_currency, rate)
VALUES ('USD', 'NGN', 1580.00),
    ('USD', 'INR', 83.50),
    ('USD', 'EUR', 0.92),
    ('USD', 'GBP', 0.79),
    ('USD', 'AUD', 1.55),
    ('USD', 'AED', 3.67),
    ('USD', 'CAD', 1.37),
    ('USD', 'ZAR', 18.50),
    ('USD', 'KES', 153.00),
    ('USD', 'GHS', 15.50) ON CONFLICT (from_currency, to_currency) DO NOTHING;
-- 7. Seed default pricing rules (USD base prices)
-- We insert for 'americas' region as the base
DO $$
DECLARE americas_id UUID;
africa_id UUID;
asia_id UUID;
europe_id UUID;
BEGIN
SELECT id INTO americas_id
FROM pricing_regions
WHERE region_code = 'americas';
SELECT id INTO africa_id
FROM pricing_regions
WHERE region_code = 'africa';
SELECT id INTO asia_id
FROM pricing_regions
WHERE region_code = 'asia';
SELECT id INTO europe_id
FROM pricing_regions
WHERE region_code = 'europe';
-- Americas (base USD prices)
INSERT INTO pricing_rules (
        region_id,
        plan_name,
        monthly_price,
        annual_price,
        annual_discount_pct
    )
VALUES (americas_id, 'starter', 0, 0, 0),
    (americas_id, 'pro', 29.99, 287.90, 20),
    (americas_id, 'enterprise', 79.99, 767.90, 20) ON CONFLICT (region_id, plan_name) DO NOTHING;
-- Africa (reduced pricing)
INSERT INTO pricing_rules (
        region_id,
        plan_name,
        monthly_price,
        annual_price,
        annual_discount_pct
    )
VALUES (africa_id, 'starter', 0, 0, 0),
    (africa_id, 'pro', 11.99, 115.10, 20),
    (africa_id, 'enterprise', 31.99, 307.10, 20) ON CONFLICT (region_id, plan_name) DO NOTHING;
-- Asia (mid pricing)
INSERT INTO pricing_rules (
        region_id,
        plan_name,
        monthly_price,
        annual_price,
        annual_discount_pct
    )
VALUES (asia_id, 'starter', 0, 0, 0),
    (asia_id, 'pro', 17.99, 172.70, 20),
    (asia_id, 'enterprise', 47.99, 460.70, 20) ON CONFLICT (region_id, plan_name) DO NOTHING;
-- Europe (standard pricing)
INSERT INTO pricing_rules (
        region_id,
        plan_name,
        monthly_price,
        annual_price,
        annual_discount_pct
    )
VALUES (europe_id, 'starter', 0, 0, 0),
    (europe_id, 'pro', 27.99, 268.70, 20),
    (europe_id, 'enterprise', 74.99, 719.90, 20) ON CONFLICT (region_id, plan_name) DO NOTHING;
END $$;