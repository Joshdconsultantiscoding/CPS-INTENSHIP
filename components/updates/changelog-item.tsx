"use client";

import { Changelog } from "@/lib/changelog/changelog-types";
import {
    Zap,
    Sparkles,
    Bug,
    AlertTriangle,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangelogItemProps {
    changelog: Changelog;
    className?: string;
}

export function ChangelogItem({ changelog, className }: ChangelogItemProps) {
    return (
        <div className={cn("space-y-6", className)}>
            {/* New Features */}
            {changelog.features?.length > 0 && (
                <section className="space-y-3">
                    <h4 className="flex items-center text-xs font-bold uppercase tracking-widest text-primary/80">
                        <Zap className="h-4 w-4 mr-2 text-primary" /> New Features
                    </h4>
                    <ul className="space-y-2">
                        {changelog.features.map((item, i) => (
                            <li key={i} className="flex items-start text-sm leading-relaxed group/item">
                                <ChevronRight className="h-4 w-4 mr-2 text-primary/40 mt-0.5 shrink-0 group-hover/item:text-primary transition-colors" />
                                <span className="text-foreground/90">{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Improvements */}
            {changelog.improvements?.length > 0 && (
                <section className="space-y-3">
                    <h4 className="flex items-center text-xs font-bold uppercase tracking-widest text-emerald-500/80">
                        <Sparkles className="h-4 w-4 mr-2 text-emerald-500" /> Improvements
                    </h4>
                    <ul className="space-y-2">
                        {changelog.improvements.map((item, i) => (
                            <li key={i} className="flex items-start text-sm leading-relaxed">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40 mt-1.5 mr-3 shrink-0" />
                                <span className="text-muted-foreground">{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Bug Fixes */}
            {changelog.fixes?.length > 0 && (
                <section className="space-y-3">
                    <h4 className="flex items-center text-xs font-bold uppercase tracking-widest text-indigo-400/80">
                        <Bug className="h-4 w-4 mr-2 text-indigo-400" /> Bug Fixes
                    </h4>
                    <ul className="space-y-1.5">
                        {changelog.fixes.map((item, i) => (
                            <li key={i} className="flex items-start text-sm text-muted-foreground/80 italic leading-relaxed">
                                <span className="mr-3 opacity-40 font-mono text-xs">•</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Breaking Changes */}
            {changelog.breaking_changes?.length > 0 && (
                <section className="space-y-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10 mt-2">
                    <h4 className="flex items-center text-xs font-bold uppercase tracking-widest text-destructive">
                        <AlertTriangle className="h-4 w-4 mr-2" /> Breaking Changes
                    </h4>
                    <ul className="space-y-2">
                        {changelog.breaking_changes.map((item, i) => (
                            <li key={i} className="flex items-start text-sm font-medium text-destructive/90 leading-relaxed">
                                <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 mr-3 shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
