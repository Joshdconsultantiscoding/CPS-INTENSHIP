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

import { ChangelogItem } from "./changelog-item";

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
        <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-primary/20 before:via-primary/5 before:to-transparent">
            {changelogs.map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Timeline Dot */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                        {log.is_major ? (
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        ) : (
                            <div className="h-2 w-2 rounded-full bg-primary/60" />
                        )}
                    </div>

                    {/* Content Card */}
                    <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-0 overflow-hidden border-primary/10 transition-all hover:border-primary/30 hover:shadow-xl dark:hover:shadow-primary/5 group/card">
                        <CardHeader className={cn(
                            "px-6 py-6 border-b transition-colors",
                            log.is_major ? "bg-primary/3" : "bg-muted/10"
                        )}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={log.is_major ? "default" : "secondary"} className="font-mono px-3 shadow-sm select-none">
                                        v{log.version.replace(/^v/, '')}
                                    </Badge>
                                    {log.is_major && (
                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] py-0.5 uppercase tracking-widest font-bold whitespace-nowrap">
                                            Major Release
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center text-[10px] uppercase tracking-widest text-muted-foreground font-black whitespace-nowrap">
                                    <Calendar className="h-3 w-3 mr-2 opacity-50" />
                                    {format(new Date(log.created_at), "MMMM dd, yyyy")}
                                </div>
                            </div>
                            <CardTitle className="text-xl md:text-2xl font-black tracking-tight leading-none group-hover/card:text-primary transition-colors">
                                {log.title}
                            </CardTitle>
                            {log.description && (
                                <CardDescription className="text-sm mt-3 leading-relaxed font-medium">
                                    {log.description}
                                </CardDescription>
                            )}
                        </CardHeader>

                        <CardContent className="p-6">
                            <ChangelogItem changelog={log} />
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    );
}
