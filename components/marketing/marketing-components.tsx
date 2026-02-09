"use client";

import { motion } from "framer-motion";
import { LucideIcon, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================
// Section Heading
// ============================================
interface SectionHeadingProps {
    badge?: string;
    title: string;
    subtitle?: string;
    centered?: boolean;
    className?: string;
}

export function SectionHeading({ badge, title, subtitle, centered = true, className }: SectionHeadingProps) {
    return (
        <div className={cn(centered && "text-center", "max-w-3xl", centered && "mx-auto", className)}>
            {badge && (
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-block mb-4 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full"
                >
                    {badge}
                </motion.span>
            )}
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground"
            >
                {title}
            </motion.h2>
            {subtitle && (
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-lg text-muted-foreground"
                >
                    {subtitle}
                </motion.p>
            )}
        </div>
    );
}

// ============================================
// Feature Card
// ============================================
interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-background to-muted/30 border border-border/50 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300"
        >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
}

// ============================================
// Stats Card
// ============================================
interface StatsCardProps {
    value: string;
    label: string;
    delay?: number;
}

export function StatsCard({ value, label, delay = 0 }: StatsCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="text-center p-6"
        >
            <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent mb-2">
                {value}
            </div>
            <div className="text-sm text-muted-foreground">{label}</div>
        </motion.div>
    );
}

// ============================================
// Testimonial Card
// ============================================
interface TestimonialCardProps {
    quote: string;
    author: string;
    role: string;
    avatar?: string;
    delay?: number;
}

export function TestimonialCard({ quote, author, role, delay = 0 }: TestimonialCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="relative p-6 rounded-2xl bg-gradient-to-br from-background to-muted/30 border border-border/50"
        >
            <div className="absolute top-6 left-6 text-6xl text-sky-500/20 font-serif">"</div>
            <p className="relative text-muted-foreground leading-relaxed mb-6 pt-4">{quote}</p>
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                    {author.charAt(0)}
                </div>
                <div>
                    <div className="font-semibold text-foreground text-sm">{author}</div>
                    <div className="text-xs text-muted-foreground">{role}</div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// Pricing Card
// ============================================
interface PricingCardProps {
    tier: string;
    price: string;
    period?: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    ctaLabel?: string;
    ctaHref?: string;
    delay?: number;
}

export function PricingCard({
    tier,
    price,
    period = "/month",
    description,
    features,
    highlighted = false,
    ctaLabel = "Get Started",
    ctaHref = "/auth/sign-up",
    delay = 0,
}: PricingCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className={cn(
                "relative flex flex-col p-8 rounded-2xl border transition-all duration-300",
                highlighted
                    ? "bg-gradient-to-br from-sky-500 to-sky-600 border-sky-500 text-white shadow-2xl shadow-sky-500/25 scale-105"
                    : "bg-gradient-to-br from-background to-muted/30 border-border/50 hover:border-sky-500/50"
            )}
        >
            {highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-xs font-semibold text-white shadow-lg">
                    Most Popular
                </div>
            )}
            <div className="mb-6">
                <h3 className={cn("text-lg font-semibold mb-2", highlighted ? "text-white" : "text-foreground")}>{tier}</h3>
                <p className={cn("text-sm", highlighted ? "text-white/80" : "text-muted-foreground")}>{description}</p>
            </div>
            <div className="mb-6">
                <span className={cn("text-4xl font-bold", highlighted ? "text-white" : "text-foreground")}>{price}</span>
                {price !== "Free" && price !== "Custom" && (
                    <span className={cn("text-sm", highlighted ? "text-white/70" : "text-muted-foreground")}>{period}</span>
                )}
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <Check className={cn("h-5 w-5 shrink-0 mt-0.5", highlighted ? "text-white" : "text-sky-600")} />
                        <span className={cn("text-sm", highlighted ? "text-white/90" : "text-muted-foreground")}>{feature}</span>
                    </li>
                ))}
            </ul>
            <Button
                asChild
                className={cn(
                    "w-full",
                    highlighted
                        ? "bg-white text-sky-600 hover:bg-white/90"
                        : "bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white"
                )}
            >
                <Link href={ctaHref}>
                    {ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </motion.div>
    );
}

// ============================================
// Timeline Step
// ============================================
interface TimelineStepProps {
    step: number;
    title: string;
    description: string;
    isLast?: boolean;
    delay?: number;
}

export function TimelineStep({ step, title, description, isLast = false, delay = 0 }: TimelineStepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="relative flex gap-6"
        >
            {/* Line */}
            {!isLast && (
                <div className="absolute left-5 top-12 bottom-0 w-px bg-gradient-to-b from-amber-500 to-transparent" />
            )}
            {/* Step Number */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold shadow-lg shadow-amber-500/25">
                {step}
            </div>
            {/* Content */}
            <div className="pb-12">
                <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
}

// ============================================
// CTA Section
// ============================================
interface CTASectionProps {
    title: string;
    subtitle?: string;
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
}

export function CTASection({
    title,
    subtitle,
    primaryLabel = "Get Started",
    primaryHref = "/auth/sign-up",
    secondaryLabel = "Login",
    secondaryHref = "/auth/sign-in",
}: CTASectionProps) {
    return (
        <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-600/10 via-transparent to-amber-500/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent" />
            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4"
                >
                    {title}
                </motion.h2>
                {subtitle && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground mb-8"
                    >
                        {subtitle}
                    </motion.p>
                )}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25">
                        <Link href={primaryHref}>
                            {primaryLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href={secondaryHref}>{secondaryLabel}</Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
