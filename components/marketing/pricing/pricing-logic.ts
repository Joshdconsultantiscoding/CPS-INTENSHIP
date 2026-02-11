export type TierId = "free" | "pro" | "growth" | "enterprise";

export interface PricingConfig {
    seats: number;
    billing: "monthly" | "annually";
    courses: number;
    storage: number;
}

export interface TierFeature {
    name: string;
    included: boolean | string;
    tooltip?: string;
}

export interface PricingTier {
    id: TierId;
    name: string;
    description: string;
    basePrice: number; // Monthly base price
    pricePerSeat: number;
    highlighted?: boolean;
    cta: string;
    features: string[];
    limits: {
        seats: number;
        courses: number;
        storage: number;
    };
}

export const PRICING_TIERS: PricingTier[] = [
    {
        id: "free",
        name: "Starter",
        description: "Free forever for small teams and individuals.",
        basePrice: 0,
        pricePerSeat: 0,
        cta: "Start Free",
        features: [
            "Up to 5 interns",
            "Basic messaging",
            "Public profiles",
            "Course viewer",
            "Email support",
        ],
        limits: {
            seats: 5,
            courses: 2,
            storage: 1,
        },
    },
    {
        id: "pro",
        name: "Professional",
        description: "Advanced tools for growing internship programs.",
        basePrice: 49,
        pricePerSeat: 10,
        highlighted: true,
        cta: "Get Started",
        features: [
            "Up to 50 interns",
            "Advanced messaging",
            "Timed quizzes",
            "Certificates",
            "Analytics dashboard",
            "Priority support",
        ],
        limits: {
            seats: 50,
            courses: 20,
            storage: 10,
        },
    },
    {
        id: "growth",
        name: "Growth",
        description: "Full suite for large-scale talent management.",
        basePrice: 199,
        pricePerSeat: 8,
        cta: "Go Growth",
        features: [
            "Up to 500 interns",
            "Mentor features",
            "Company portal",
            "Recruiter marketplace",
            "Leaderboards",
            "Account Manager",
        ],
        limits: {
            seats: 500,
            courses: 100,
            storage: 50,
        },
    },
    {
        id: "enterprise",
        name: "Enterprise",
        description: "Custom solutions for global organizations.",
        basePrice: 0, // Negotiated
        pricePerSeat: 0,
        cta: "Contact Sales",
        features: [
            "Unlimited interns",
            "SSO/SAML",
            "Custom onboarding",
            "Custom SLAs",
            "Dedicated support",
            "White-labeling",
        ],
        limits: {
            seats: 10000,
            courses: 1000,
            storage: 1000,
        },
    },
];

export const calculatePrice = (tierId: TierId, config: PricingConfig) => {
    const tier = PRICING_TIERS.find((t) => t.id === tierId);
    if (!tier || tierId === "enterprise") return 0;

    let price = tier.basePrice + Math.max(0, config.seats - 5) * tier.pricePerSeat;

    // Add-on logic (simplified for now)
    if (config.courses > tier.limits.courses) {
        price += (config.courses - tier.limits.courses) * 2;
    }

    if (config.storage > tier.limits.storage) {
        price += (config.storage - tier.limits.storage) * 0.5;
    }

    if (config.billing === "annually") {
        return price * 0.8; // 20% discount
    }

    return price;
};

export const getRecommendedTier = (config: PricingConfig): TierId => {
    if (config.seats > 500 || config.courses > 100) return "enterprise";
    if (config.seats > 50 || config.courses > 20) return "growth";
    if (config.seats > 5 || config.courses > 2) return "pro";
    return "free";
};
