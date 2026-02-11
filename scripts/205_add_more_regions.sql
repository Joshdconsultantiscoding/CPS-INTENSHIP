-- ============================================
-- 205: EXTEND REGIONS
-- Add UK, Japan, Canada to pricing regions
-- ============================================
-- 1. Insert new regions
INSERT INTO pricing_regions (
        region_code,
        region_name,
        currency_code,
        currency_symbol,
        price_multiplier
    )
VALUES ('uk', 'United Kingdom', 'GBP', '£', 0.90),
    ('japan', 'Japan', 'JPY', '¥', 110.00),
    ('canada', 'Canada', 'CAD', 'C$', 1.35) ON CONFLICT (region_code) DO NOTHING;
-- 2. Insert/Update exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate)
VALUES ('USD', 'GBP', 0.79),
    -- Updated rate
    ('USD', 'JPY', 150.00),
    ('USD', 'CAD', 1.36) ON CONFLICT (from_currency, to_currency) DO
UPDATE
SET rate = EXCLUDED.rate;
-- 3. Seed pricing rules for new regions (using Americas base)
DO $$
DECLARE americas_id UUID;
uk_id UUID;
japan_id UUID;
canada_id UUID;
BEGIN
SELECT id INTO americas_id
FROM pricing_regions
WHERE region_code = 'americas';
SELECT id INTO uk_id
FROM pricing_regions
WHERE region_code = 'uk';
SELECT id INTO japan_id
FROM pricing_regions
WHERE region_code = 'japan';
SELECT id INTO canada_id
FROM pricing_regions
WHERE region_code = 'canada';
-- UK Pricing
INSERT INTO pricing_rules (
        region_id,
        plan_name,
        monthly_price,
        annual_price,
        annual_discount_pct
    )
VALUES (uk_id, 'starter', 0, 0, 0),
    (uk_id, 'pro', 24.99, 239.90, 20),
    (uk_id, 'enterprise', 64.99, 623.90, 20) ON CONFLICT (region_id, plan_name) DO NOTHING;
-- Japan Pricing
INSERT INTO pricing_rules (
        region_id,
        plan_name,
        monthly_price,
        annual_price,
        annual_discount_pct
    )
VALUES (uk_id, 'starter', 0, 0, 0),
    -- Should be japan_id, fixing this logic below
    (uk_id, 'pro', 24.99, 239.90, 20),
    -- Wait, copy-paste error in block above? No.
    (uk_id, 'enterprise', 64.99, 623.90, 20) ON CONFLICT (region_id, plan_name) DO NOTHING;
-- Correct Japan block
INSERT INTO pricing_rules (
        region_id,
        plan_name,
        monthly_price,
        annual_price,
        annual_discount_pct
    )
VALUES (japan_id, 'starter', 0, 0, 0),
    (japan_id, 'pro', 4500, 43200, 20),
    (japan_id, 'enterprise', 12000, 115200, 20) ON CONFLICT (region_id, plan_name) DO NOTHING;
-- Canada Pricing
INSERT INTO pricing_rules (
        region_id,
        plan_name,
        monthly_price,
        annual_price,
        annual_discount_pct
    )
VALUES (canada_id, 'starter', 0, 0, 0),
    (canada_id, 'pro', 39.99, 383.90, 20),
    (canada_id, 'enterprise', 99.99, 959.90, 20) ON CONFLICT (region_id, plan_name) DO NOTHING;
END $$;