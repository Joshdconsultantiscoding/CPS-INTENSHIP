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
        <div className={cn(centered && "text-center", "max-w-4xl", centered && "mx-auto", className)}>
            {badge && (
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-block mb-4 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400 bg-sky-500/10 rounded-full border border-sky-500/20"
                >
                    {badge}
                </motion.span>
            )}
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1]"
            >
                {title}
            </motion.h2>
            {subtitle && (
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
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
            className="group relative p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-500 overflow-hidden"
        >
            <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-sky-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>
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
            className="relative p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 backdrop-blur-sm group hover:border-sky-500/30 transition-colors"
        >
            <div className="absolute top-8 left-8 text-7xl text-sky-500/10 font-serif leading-none select-none group-hover:text-sky-500/20 transition-colors pointer-events-none">"</div>
            <p className="relative text-base sm:text-lg text-foreground italic leading-relaxed mb-8 pt-4">
                {quote}
            </p>
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-sky-500/20">
                    {author.charAt(0)}
                </div>
                <div>
                    <div className="font-bold text-foreground">{author}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider">{role}</div>
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
            className="relative flex gap-8 items-start"
        >
            {/* Step Number */}
            <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-4xl bg-white dark:bg-slate-950 border-4 border-slate-100 dark:border-slate-800 text-2xl font-black text-sky-500 shadow-2xl">
                {step}
            </div>

            {/* Content */}
            <div className={cn("pb-16 pt-2", !isLast && "border-l-2 border-dashed border-slate-200 dark:border-slate-800 -ml-14 pl-20 md:ml-0 md:pl-0 md:border-0")}>
                <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">{title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed font-medium max-w-2xl">{description}</p>
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
        <section className="relative py-32 overflow-hidden bg-slate-950">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-sky-500/20 via-slate-950 to-slate-950" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
            </div>
            <div className="relative mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-tight"
                >
                    {title}
                </motion.h2>
                {subtitle && (
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg sm:text-xl text-sky-100/70 mb-12 max-w-2xl mx-auto"
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
                    <Button asChild size="lg" className="h-14 px-8 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg shadow-2xl shadow-sky-500/20 w-full sm:w-auto">
                        <Link href={primaryHref}>
                            {primaryLabel}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full border-white/10 hover:bg-white/5 text-white font-bold text-lg w-full sm:w-auto">
                        <Link href={secondaryHref}>{secondaryLabel}</Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
