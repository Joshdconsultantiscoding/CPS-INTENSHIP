"use client";

import { SectionHeading, PricingCard, CTASection } from "@/components/marketing";

const plans = [
    {
        tier: "Free",
        price: "Free",
        description: "Perfect for getting started",
        features: [
            "Up to 10 interns",
            "Basic task management",
            "Course access (limited)",
            "Real-time messaging",
            "Public profile",
            "Community support",
        ],
        highlighted: false,
        ctaLabel: "Get Started Free",
    },
    {
        tier: "Pro",
        price: "$29",
        description: "For growing teams",
        features: [
            "Up to 100 interns",
            "Advanced task management",
            "Full course library",
            "AI assistant",
            "Analytics dashboard",
            "Rewards system",
            "Priority support",
        ],
        highlighted: true,
        ctaLabel: "Start Pro Trial",
    },
    {
        tier: "Enterprise",
        price: "Custom",
        description: "For large organizations",
        features: [
            "Unlimited interns",
            "Custom integrations",
            "API access",
            "SSO & advanced security",
            "Dedicated account manager",
            "Custom branding",
            "SLA guarantee",
            "On-premise option",
        ],
        highlighted: false,
        ctaLabel: "Contact Sales",
        ctaHref: "/contact",
    },
];

export default function PricingPage() {
    return (
        <>
            {/* Hero */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500/5 via-transparent to-amber-500/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Pricing"
                        title="Simple, Transparent Pricing"
                        subtitle="Start free, upgrade when you need more. No hidden fees, no surprises."
                    />
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-3 items-start">
                        {plans.map((plan, i) => (
                            <PricingCard
                                key={plan.tier}
                                tier={plan.tier}
                                price={plan.price}
                                description={plan.description}
                                features={plan.features}
                                highlighted={plan.highlighted}
                                ctaLabel={plan.ctaLabel}
                                ctaHref={plan.ctaHref}
                                delay={i * 0.1}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Preview */}
            <section className="py-24 bg-muted/30">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Questions?</h2>
                    <p className="text-muted-foreground mb-6">
                        Check our resources page for FAQs, or reach out to our team directly.
                    </p>
                </div>
            </section>

            {/* CTA */}
            <CTASection
                title="Start Building Today"
                subtitle="Join thousands of teams using CPS Intern to develop talent."
            />
        </>
    );
}
