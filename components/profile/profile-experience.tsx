"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Briefcase, MapPin, Calendar } from "lucide-react";
import type { Experience } from "@/lib/types/profile";
import { formatDistanceToNow, format } from "date-fns";

interface ProfileExperienceProps {
    experiences: Experience[];
    isOwner: boolean;
    onAdd?: () => void;
    onEdit?: (experience: Experience) => void;
}

export function ProfileExperience({
    experiences,
    isOwner,
    onAdd,
    onEdit,
}: ProfileExperienceProps) {
    if (experiences.length === 0 && !isOwner) return null;

    const formatDate = (date: string | null) => {
        if (!date) return "";
        return format(new Date(date), "MMM yyyy");
    };

    const getDuration = (startDate: string | null, endDate: string | null, current: boolean) => {
        if (!startDate) return "";
        const start = new Date(startDate);
        const end = current ? new Date() : endDate ? new Date(endDate) : new Date();

        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        if (years > 0 && remainingMonths > 0) {
            return `${years} yr ${remainingMonths} mo`;
        } else if (years > 0) {
            return `${years} yr${years > 1 ? "s" : ""}`;
        } else {
            return `${remainingMonths} mo${remainingMonths > 1 ? "s" : ""}`;
        }
    };

    return (
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Experience
                </CardTitle>
                {isOwner && (
                    <Button variant="ghost" size="icon" onClick={onAdd}>
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                {experiences.length > 0 ? (
                    experiences.map((exp, index) => (
                        <div
                            key={exp.id}
                            className="relative flex gap-4 group"
                        >
                            {/* Timeline line */}
                            {index < experiences.length - 1 && (
                                <div className="absolute left-5 top-12 w-0.5 h-full bg-border" />
                            )}

                            {/* Company icon */}
                            <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-muted-foreground" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-foreground">{exp.title}</h3>
                                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                                    </div>
                                    {isOwner && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => onEdit?.(exp)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(exp.start_date)} - {exp.current ? "Present" : formatDate(exp.end_date)}
                                        {" · "}
                                        {getDuration(exp.start_date, exp.end_date, exp.current)}
                                    </span>
                                    {exp.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {exp.location}
                                        </span>
                                    )}
                                </div>

                                {exp.description && (
                                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                                        {exp.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground/50 italic text-center py-4">
                        Add your work experience...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
