"use client";

import { Changelog } from "@/lib/changelog/changelog-types";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    Sparkles,
    Bug,
    Zap,
    AlertTriangle,
    ChevronRight,
    Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChangelogListProps {
    changelogs: Changelog[];
}

export function ChangelogList({ changelogs }: ChangelogListProps) {
    if (!changelogs.length) {
        return (
            <Card className="border-dashed py-12 flex flex-col items-center justify-center text-center">
                <Rocket className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <CardTitle className="text-muted-foreground">No updates found</CardTitle>
                <CardDescription>Stay tuned for our first release!</CardDescription>
            </Card>
        );
    }

    return (
        <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-primary/5 before:to-transparent">
            {changelogs.map((log, idx) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Timeline Dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        {log.is_major ? (
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        ) : (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                    </div>

                    {/* Content Card */}
                    <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-0 overflow-hidden border-primary/10 transition-all hover:border-primary/30 hover:shadow-lg dark:hover:shadow-primary/5">
                        <CardHeader className={cn(
                            "pb-4 border-b",
                            log.is_major ? "bg-primary/5" : "bg-muted/30"
                        )}>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={log.is_major ? "default" : "secondary"} className="font-mono px-3">
                                        {log.version}
                                    </Badge>
                                    {log.is_major && (
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-wider">
                                            Major Release
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground font-medium">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(log.created_at), "MMMM dd, yyyy")}
                                </div>
                            </div>
                            <CardTitle className="text-xl md:text-2xl font-bold leading-tight decoration-primary/30 group-hover:underline underline-offset-4 decoration-2">
                                {log.title}
                            </CardTitle>
                            {log.description && (
                                <CardDescription className="text-sm mt-2 leading-relaxed">
                                    {log.description}
                                </CardDescription>
                            )}
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            {/* Features */}
                            {log.features?.length > 0 && (
                                <section className="space-y-3">
                                    <h4 className="flex items-center text-sm font-bold uppercase tracking-widest text-primary/80">
                                        <Zap className="h-4 w-4 mr-2" /> New Features
                                    </h4>
                                    <ul className="space-y-2">
                                        {log.features.map((item, i) => (
                                            <li key={i} className="flex items-start text-sm leading-relaxed group/item">
                                                <ChevronRight className="h-4 w-4 mr-2 text-primary/40 mt-0.5 shrink-0 group-hover/item:text-primary transition-colors" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {/* Improvements */}
                            {log.improvements?.length > 0 && (
                                <section className="space-y-3">
                                    <h4 className="flex items-center text-sm font-bold uppercase tracking-widest text-chart-2/80">
                                        <Sparkles className="h-4 w-4 mr-2" /> Improvements
                                    </h4>
                                    <ul className="space-y-2">
                                        {log.improvements.map((item, i) => (
                                            <li key={i} className="flex items-start text-sm text-muted-foreground leading-relaxed">
                                                <span className="h-1.5 w-1.5 rounded-full bg-chart-2/40 mt-1.5 mr-3 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {/* Fixes */}
                            {log.fixes?.length > 0 && (
                                <section className="space-y-3">
                                    <h4 className="flex items-center text-sm font-bold uppercase tracking-widest text-chart-1/80">
                                        <Bug className="h-4 w-4 mr-2" /> Bug Fixes
                                    </h4>
                                    <ul className="space-y-1">
                                        {log.fixes.map((item, i) => (
                                            <li key={i} className="flex items-start text-sm text-muted-foreground/80 italic leading-relaxed">
                                                <span className="mr-3 opacity-50">-</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {/* Breaking Changes */}
                            {log.breaking_changes?.length > 0 && (
                                <section className="space-y-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20 mt-4">
                                    <h4 className="flex items-center text-sm font-bold uppercase tracking-widest text-destructive">
                                        <AlertTriangle className="h-4 w-4 mr-2" /> Breaking Changes
                                    </h4>
                                    <ul className="space-y-2">
                                        {log.breaking_changes.map((item, i) => (
                                            <li key={i} className="flex items-start text-sm font-medium text-destructive/90 leading-relaxed">
                                                <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 mr-3 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
}
