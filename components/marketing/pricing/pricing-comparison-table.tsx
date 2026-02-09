"use client";

import { Check, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ComparisonRow {
    feature: string;
    tooltip?: string;
    values: {
        free: string | boolean;
        pro: string | boolean;
        growth: string | boolean;
        enterprise: string | boolean;
    };
}

interface ComparisonSection {
    title: string;
    rows: ComparisonRow[];
}

const COMPARISON_DATA: ComparisonSection[] = [
    {
        title: "Core Limits",
        rows: [
            {
                feature: "Intern Seats",
                values: { free: "5", pro: "50", growth: "500", enterprise: "Unlimited" },
            },
            {
                feature: "Courses Published",
                values: { free: "2", pro: "20", growth: "100", enterprise: "Unlimited" },
            },
            {
                feature: "Storage Space",
                values: { free: "1 GB", pro: "10 GB", growth: "50 GB", enterprise: "Custom" },
            },
        ],
    },
    {
        title: "Learning Management",
        rows: [
            {
                feature: "Course Builder",
                values: { free: true, pro: true, growth: true, enterprise: true },
            },
            {
                feature: "Automated Quizzes",
                values: { free: false, pro: "Timed", growth: "Advanced", enterprise: "Custom" },
            },
            {
                feature: "Certificates",
                tooltip: "Automatically generate certificates upon course completion",
                values: { free: false, pro: true, growth: true, enterprise: "White-label" },
            },
            {
                feature: "Leaderboards",
                values: { free: false, pro: false, growth: true, enterprise: true },
            },
        ],
    },
    {
        title: "Enterprise & Support",
        rows: [
            {
                feature: "Support Level",
                values: { free: "Email", pro: "Priority", growth: "Priority + Chat", enterprise: "24/7 Dedicated" },
            },
            {
                feature: "SSO (SAML/OpenID)",
                values: { free: false, pro: false, growth: false, enterprise: true },
            },
            {
                feature: "SLA / Uptime",
                values: { free: false, pro: false, growth: "99.9%", enterprise: "99.99%" },
            },
            {
                feature: "Custom Contract",
                values: { free: false, pro: false, growth: false, enterprise: true },
            },
        ],
    },
];

export function PricingComparisonTable() {
    return (
        <div className="mt-24 w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                    <tr className="border-b border-border">
                        <th className="py-6 px-4 text-sm font-bold text-foreground w-1/4">Features</th>
                        <th className="py-6 px-4 text-sm font-bold text-foreground text-center">Starter</th>
                        <th className="py-6 px-4 text-sm font-bold text-sky-600 text-center">Professional</th>
                        <th className="py-6 px-4 text-sm font-bold text-foreground text-center">Growth</th>
                        <th className="py-6 px-4 text-sm font-bold text-foreground text-center">Enterprise</th>
                    </tr>
                </thead>
                <TooltipProvider>
                    <tbody>
                        {COMPARISON_DATA.map((section, idx) => (
                            <React.Fragment key={idx}>
                                <tr className="bg-muted/30">
                                    <td colSpan={5} className="py-3 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        {section.title}
                                    </td>
                                </tr>
                                {section.rows.map((row, rowIdx) => (
                                    <tr key={rowIdx} className="border-b border-border/50 hover:bg-sky-500/5 transition-colors">
                                        <td className="py-4 px-4 text-sm text-foreground flex items-center gap-2">
                                            {row.feature}
                                            {row.tooltip && (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-3 w-3 text-muted-foreground hover:text-sky-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-xs">{row.tooltip}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </td>
                                        <ComparisonCell value={row.values.free} />
                                        <ComparisonCell value={row.values.pro} />
                                        <ComparisonCell value={row.values.growth} />
                                        <ComparisonCell value={row.values.enterprise} />
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </TooltipProvider>
            </table>
        </div>
    );
}

function ComparisonCell({ value }: { value: string | boolean }) {
    return (
        <td className="py-4 px-4 text-center">
            {typeof value === "boolean" ? (
                value ? (
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                ) : (
                    <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                )
            ) : (
                <span className="text-sm font-medium text-foreground">{value}</span>
            )}
        </td>
    );
}
import * as React from "react";
