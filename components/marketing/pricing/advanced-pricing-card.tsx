"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PricingTier } from "./pricing-logic";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdvancedPricingCardProps {
    tier: PricingTier;
    currentPrice: number;
    billing: "monthly" | "annually";
    isRecommended?: boolean;
    delay?: number;
    currencySymbol?: string;
    priceMultiplier?: number;
}

export function AdvancedPricingCard({
    tier,
    currentPrice,
    billing,
    isRecommended = false,
    delay = 0,
    currencySymbol = "$",
    priceMultiplier = 1,
}: AdvancedPricingCardProps) {
    const isEnterprise = tier.id === "enterprise";
    const monthlyPrice = billing === "annually" ? currentPrice / 12 : currentPrice;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className={cn(
                "relative flex flex-col p-8 rounded-3xl border transition-all duration-500",
                isRecommended
                    ? "bg-white dark:bg-slate-900 border-sky-500 shadow-2xl shadow-sky-500/10 scale-105 z-10"
                    : "bg-muted/30 border-border/50 hover:border-sky-500/30"
            )}
        >
            {isRecommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-linear-to-r from-sky-500 to-sky-600 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                    Recommended Case
                </div>
            )}

            <div className="mb-8">
                <h3 className="text-xl font-bold text-foreground mb-2 flex items-center justify-between">
                    {tier.name}
                    {tier.id === "pro" && <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">POPULAR</span>}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed min-h-[40px]">
                    {tier.description}
                </p>
            </div>

            <div className="mb-8 min-h-[80px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${tier.id}-${currentPrice}-${billing}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-baseline gap-1"
                    >
                        {isEnterprise ? (
                            <span className="text-4xl font-bold text-foreground tracking-tight">Custom</span>
                        ) : (
                            <>
                                <span className="text-4xl font-bold text-foreground tracking-tight">
                                    {currencySymbol}
                                    {Number.isInteger(currentPrice) ? currentPrice : currentPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-muted-foreground text-sm font-medium">/{billing === "annually" ? "yr" : "mo"}</span>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
                {!isEnterprise && billing === "annually" && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-green-600 font-medium mt-1"
                    >
                        Save approx. 20% compared to monthly
                    </motion.p>
                )}
                {tier.pricePerSeat > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-tight">
                        Includes base + usage-based scaling
                    </p>
                )}
            </div>

            <div className="space-y-4 mb-8 grow">
                <p className="text-xs font-semibold text-foreground uppercase tracking-widest">Key Features</p>
                <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 group">
                            <div className="mt-0.5 rounded-full bg-sky-500/10 p-0.5 text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                                <Check className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <Button
                asChild
                size="lg"
                className={cn(
                    "w-full rounded-2xl font-bold transition-all duration-300",
                    isRecommended
                        ? "bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25"
                        : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-foreground hover:border-sky-500 hover:bg-sky-50/50"
                )}
            >
                <Link href={isEnterprise ? "/contact" : "/auth/sign-up"}>
                    {tier.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>

            <p className="text-[10px] text-center text-muted-foreground mt-4">
                {isEnterprise ? "Talk to our experts" : "No credit card required"}
            </p>
        </motion.div>
    );
}
