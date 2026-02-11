import { createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// Country → Region mapping
const COUNTRY_REGION_MAP: Record<string, string> = {
    // Africa
    NG: "africa", GH: "africa", KE: "africa", ZA: "africa", EG: "africa",
    ET: "africa", TZ: "africa", UG: "africa", RW: "africa", SN: "africa",
    CI: "africa", CM: "africa", AO: "africa", MZ: "africa", ZW: "africa",
    BW: "africa", NA: "africa", MW: "africa", ZM: "africa", MG: "africa",
    // Asia
    IN: "asia", PK: "asia", BD: "asia", CN: "asia", JP: "asia",
    KR: "asia", PH: "asia", VN: "asia", TH: "asia", MY: "asia",
    ID: "asia", SG: "asia", LK: "asia", NP: "asia", MM: "asia",
    // Europe
    GB: "europe", DE: "europe", FR: "europe", IT: "europe", ES: "europe",
    NL: "europe", BE: "europe", PT: "europe", SE: "europe", NO: "europe",
    DK: "europe", FI: "europe", AT: "europe", CH: "europe", IE: "europe",
    PL: "europe", CZ: "europe", RO: "europe", HU: "europe", GR: "europe",
    // Americas
    US: "americas", CA: "americas", MX: "americas", BR: "americas",
    AR: "americas", CO: "americas", CL: "americas", PE: "americas",
    VE: "americas", EC: "americas", UY: "americas", PY: "americas",
    // Oceania
    AU: "oceania", NZ: "oceania", FJ: "oceania",
    // Middle East
    AE: "middle_east", SA: "middle_east", QA: "middle_east", KW: "middle_east",
    BH: "middle_east", OM: "middle_east", JO: "middle_east", LB: "middle_east",
    IL: "middle_east", TR: "middle_east",
};

export interface RegionInfo {
    regionCode: string;
    regionName: string;
    currencyCode: string;
    currencySymbol: string;
    priceMultiplier: number;
}

export interface PricingTier {
    planName: string;
    monthlyPrice: number;
    annualPrice: number;
    annualDiscountPct: number;
    displayMonthly: string;
    displayAnnual: string;
    currencySymbol: string;
}

/**
 * GeoService — Region detection and pricing resolution.
 */
export class GeoService {
    /**
     * Detect the user's region from request headers.
     * Uses Vercel/Cloudflare geo headers first, falls back to default.
     */
    static async detectRegion(): Promise<RegionInfo> {
        try {
            const headerStore = await headers();
            const country =
                headerStore.get("x-vercel-ip-country") ||
                headerStore.get("cf-ipcountry") ||
                headerStore.get("x-country-code") ||
                "";

            const regionCode = COUNTRY_REGION_MAP[country.toUpperCase()] || "americas";

            return this.getRegionInfo(regionCode);
        } catch (error) {
            console.error("[GeoService] detectRegion error:", error);
            return this.getDefaultRegion();
        }
    }

    /**
     * Get region info from database.
     */
    static async getRegionInfo(regionCode: string): Promise<RegionInfo> {
        const supabase = await createAdminClient();

        const { data } = await supabase
            .from("pricing_regions")
            .select("*")
            .eq("region_code", regionCode)
            .eq("is_active", true)
            .maybeSingle();

        if (!data) return this.getDefaultRegion();

        return {
            regionCode: data.region_code,
            regionName: data.region_name,
            currencyCode: data.currency_code,
            currencySymbol: data.currency_symbol,
            priceMultiplier: parseFloat(data.price_multiplier),
        };
    }

    /**
     * Default region fallback.
     */
    static getDefaultRegion(): RegionInfo {
        return {
            regionCode: "americas",
            regionName: "Americas",
            currencyCode: "USD",
            currencySymbol: "$",
            priceMultiplier: 1.0,
        };
    }

    /**
     * Get all active regions for the currency toggle.
     */
    static async getAllRegions(): Promise<RegionInfo[]> {
        const supabase = await createAdminClient();

        const { data } = await supabase
            .from("pricing_regions")
            .select("*")
            .eq("is_active", true)
            .order("region_name");

        return (data || []).map((r) => ({
            regionCode: r.region_code,
            regionName: r.region_name,
            currencyCode: r.currency_code,
            currencySymbol: r.currency_symbol,
            priceMultiplier: parseFloat(r.price_multiplier),
        }));
    }

    /**
     * Get pricing for a specific region.
     */
    static async getRegionPricing(regionCode: string): Promise<PricingTier[]> {
        const supabase = await createAdminClient();

        const { data: region } = await supabase
            .from("pricing_regions")
            .select("id, currency_symbol, currency_code")
            .eq("region_code", regionCode)
            .maybeSingle();

        if (!region) return [];

        const { data: rules } = await supabase
            .from("pricing_rules")
            .select("*")
            .eq("region_id", region.id)
            .eq("is_active", true)
            .order("monthly_price", { ascending: true });

        if (!rules) return [];

        // Get exchange rate if not USD
        let rate = 1;
        if (region.currency_code !== "USD") {
            const { data: exchangeRate } = await supabase
                .from("exchange_rates")
                .select("rate")
                .eq("from_currency", "USD")
                .eq("to_currency", region.currency_code)
                .maybeSingle();

            rate = exchangeRate ? parseFloat(String(exchangeRate.rate)) : 1;
        }

        return rules.map((r) => {
            const localMonthly = r.monthly_price * rate;
            const localAnnual = r.annual_price * rate;

            return {
                planName: r.plan_name,
                monthlyPrice: r.monthly_price,
                annualPrice: r.annual_price,
                annualDiscountPct: r.annual_discount_pct,
                displayMonthly: this.formatPrice(localMonthly, region.currency_symbol),
                displayAnnual: this.formatPrice(localAnnual, region.currency_symbol),
                currencySymbol: region.currency_symbol,
            };
        });
    }

    /**
     * Format a price with currency symbol.
     */
    static formatPrice(amount: number, symbol: string): string {
        if (amount === 0) return "Free";
        if (amount >= 1000) {
            return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
        return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    /**
     * Convert a USD price to a target currency.
     */
    static async convertPrice(
        usdAmount: number,
        toCurrency: string
    ): Promise<{ amount: number; formatted: string }> {
        if (toCurrency === "USD") {
            return { amount: usdAmount, formatted: `$${usdAmount.toFixed(2)}` };
        }

        const supabase = await createAdminClient();
        const { data } = await supabase
            .from("exchange_rates")
            .select("rate")
            .eq("from_currency", "USD")
            .eq("to_currency", toCurrency)
            .maybeSingle();

        const rate = data ? parseFloat(String(data.rate)) : 1;
        const converted = usdAmount * rate;

        // Get symbol
        const { data: regionData } = await supabase
            .from("pricing_regions")
            .select("currency_symbol")
            .eq("currency_code", toCurrency)
            .maybeSingle();

        const symbol = regionData?.currency_symbol || toCurrency;

        return {
            amount: converted,
            formatted: this.formatPrice(converted, symbol),
        };
    }
}
