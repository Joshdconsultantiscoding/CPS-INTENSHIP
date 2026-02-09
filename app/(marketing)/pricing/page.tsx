"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Users,
    BookOpen,
    MessageSquare,
    Zap,
    HardDrive,
    ArrowRight,
    CheckCircle2
} from "lucide-react";

import { SectionHeading } from "@/components/marketing/marketing-components";
import { PricingSlider } from "@/components/marketing/pricing/pricing-slider";
import { AdvancedPricingCard } from "@/components/marketing/pricing/advanced-pricing-card";
import { PricingComparisonTable } from "@/components/marketing/pricing/pricing-comparison-table";
import { PricingFAQ } from "@/components/marketing/pricing/pricing-faq";
import { PRICING_TIERS, calculatePrice, getRecommendedTier, PricingConfig } from "@/components/marketing/pricing/pricing-logic";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="h-10 w-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <PricingPageContent />
        </React.Suspense>
    );
}

function PricingPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State from URL or defaults
    const [config, setConfig] = React.useState<PricingConfig>({
        seats: Number(searchParams.get("seats")) || 10,
        billing: (searchParams.get("billing") as "monthly" | "annually") || "annually",
        courses: Number(searchParams.get("courses")) || 5,
        storage: Number(searchParams.get("storage")) || 5,
    });

    // Update URL when config changes
    React.useEffect(() => {
        const params = new URLSearchParams();
        params.set("seats", config.seats.toString());
        params.set("billing", config.billing);
        params.set("courses", config.courses.toString());
        params.set("storage", config.storage.toString());
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [config, router]);

    const recommendedTierId = getRecommendedTier(config);

    const updateConfig = (key: keyof PricingConfig, value: any) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative pt-24 pb-16 overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-sky-500/10 via-background to-background" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Flexible Pricing"
                        title="Plans for Every Team — From Intern to Enterprise"
                        subtitle="Scale your internship program with flexible pricing and powerful features."
                        className="mb-12"
                    />

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-16">
                        <Label htmlFor="billing-toggle" className={cn("text-sm font-medium transition-colors", config.billing === "monthly" ? "text-foreground" : "text-muted-foreground")}>
                            Monthly
                        </Label>
                        <Switch
                            id="billing-toggle"
                            checked={config.billing === "annually"}
                            onCheckedChange={(checked) => updateConfig("billing", checked ? "annually" : "monthly")}
                            className="data-[state=checked]:bg-sky-500"
                        />
                        <div className="flex items-center gap-2">
                            <Label htmlFor="billing-toggle" className={cn("text-sm font-medium transition-colors", config.billing === "annually" ? "text-foreground" : "text-muted-foreground")}>
                                Annually
                            </Label>
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold uppercase tracking-wider">
                                Save 20%
                            </span>
                        </div>
                    </div>

                    {/* Interactive Sliders */}
                    <div className="mx-auto max-w-4xl bg-white dark:bg-slate-900/50 border border-border/50 rounded-3xl p-8 sm:p-12 shadow-xl shadow-sky-500/5 relative">
                        <div className="absolute -top-3 left-8 px-4 py-1 bg-sky-500 text-white text-[10px] font-bold rounded-full shadow-lg uppercase tracking-widest">
                            Configure Your Plan
                        </div>
                        <div className="grid gap-12 md:grid-cols-2">
                            <PricingSlider
                                label="Intern Seats"
                                value={config.seats}
                                min={1}
                                max={500}
                                unit="Seats"
                                icon={<Users className="h-4 w-4" />}
                                onChange={(val) => updateConfig("seats", val)}
                            />
                            <PricingSlider
                                label="Published Courses"
                                value={config.courses}
                                min={0}
                                max={100}
                                unit="Courses"
                                icon={<BookOpen className="h-4 w-4" />}
                                onChange={(val) => updateConfig("courses", val)}
                            />
                            <PricingSlider
                                label="Storage (GB)"
                                value={config.storage}
                                min={1}
                                max={500}
                                unit="GB"
                                icon={<HardDrive className="h-4 w-4" />}
                                onChange={(val) => updateConfig("storage", val)}
                            />
                            <div className="p-6 bg-sky-500/5 rounded-2xl border border-sky-500/10 flex flex-col justify-center items-center text-center">
                                <Zap className="h-6 w-6 text-sky-500 mb-2 animate-pulse" />
                                <h4 className="text-sm font-bold text-foreground">AI Credits Included</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {(config.seats * 100).toLocaleString()} credits per month included in your selection.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Grid */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 items-stretch">
                        {PRICING_TIERS.map((tier, i) => (
                            <AdvancedPricingCard
                                key={tier.id}
                                tier={tier}
                                currentPrice={calculatePrice(tier.id, config)}
                                billing={config.billing}
                                isRecommended={tier.id === recommendedTierId}
                                delay={i * 0.1}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-20 border-y border-border/50 bg-muted/20 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sky-500/20 to-transparent" />
                <div className="mx-auto max-w-7xl px-4 text-center relative">
                    <div className="mb-12">
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-xs font-bold text-sky-600 uppercase tracking-[0.3em] mb-4"
                        >
                            The Future of Talent
                        </motion.p>
                        <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-2xl font-bold text-foreground tracking-tight"
                        >
                            We envision to partner with the pioneers of tomorrow
                        </motion.h3>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="mt-2 text-sm text-muted-foreground italic max-w-lg mx-auto"
                        >
                            Building the bridge between today's top organizations and the next generation of global talent.
                        </motion.p>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                        {/* Visionary Partner Logos */}
                        {["Adobe", "Apple", "Stripe", "Brevo", "Google", "Microsoft"].map((brand, i) => (
                            <motion.span
                                key={brand}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="text-2xl font-black text-foreground/40 hover:text-sky-500 transition-colors cursor-default"
                            >
                                {brand}
                            </motion.span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="py-24 bg-background">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-foreground">Detailed Comparison</h2>
                        <p className="mt-4 text-muted-foreground">Every feature you need to run a world-class program.</p>
                    </div>
                    <PricingComparisonTable />
                </div>
            </section>

            {/* FAQ Section */}
            <PricingFAQ />

            {/* Footer CTA */}
            <section className="py-24 relative overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 bg-linear-to-br from-sky-500/20 to-transparent" />
                <div className="relative mx-auto max-w-7xl px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to scale your internship program?</h2>
                    <p className="text-xl text-sky-100/70 mb-10 max-w-2xl mx-auto">
                        Join companies of all sizes using CPS Intern to build their future talent pipeline.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="bg-sky-500 hover:bg-sky-600 text-white px-8 rounded-full h-14 text-lg font-bold">
                            Join CPS Intern for Free
                        </Button>
                        <Button variant="outline" size="lg" className="border-white/20 hover:bg-white/10 text-white px-8 rounded-full h-14 text-lg font-bold">
                            Contact Sales
                        </Button>
                    </div>
                    <div className="mt-12 flex flex-wrap justify-center gap-8">
                        <div className="flex items-center gap-2 text-sky-100/50">
                            <CheckCircle2 className="h-5 w-5 text-sky-500" />
                            <span className="text-sm">No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2 text-sky-100/50">
                            <CheckCircle2 className="h-5 w-5 text-sky-500" />
                            <span className="text-sm">Cancel anytime</span>
                        </div>
                        <div className="flex items-center gap-2 text-sky-100/50">
                            <CheckCircle2 className="h-5 w-5 text-sky-500" />
                            <span className="text-sm">14-day Pro trial</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

import { cn } from "@/lib/utils";
