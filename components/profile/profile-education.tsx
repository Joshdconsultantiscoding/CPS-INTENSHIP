"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, GraduationCap, Calendar } from "lucide-react";
import type { Education } from "@/lib/types/profile";

interface ProfileEducationProps {
    education: Education[];
    isOwner: boolean;
    onAdd?: () => void;
    onEdit?: (education: Education) => void;
}

export function ProfileEducation({
    education,
    isOwner,
    onAdd,
    onEdit,
}: ProfileEducationProps) {
    if (education.length === 0 && !isOwner) return null;

    return (
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Education
                </CardTitle>
                {isOwner && (
                    <Button variant="ghost" size="icon" onClick={onAdd}>
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {education.length > 0 ? (
                    education.map((edu) => (
                        <div
                            key={edu.id}
                            className="flex gap-4 p-4 rounded-lg bg-muted/50 group hover:bg-muted transition-colors"
                        >
                            {/* School icon */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-primary" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-foreground">{edu.school}</h3>
                                        {edu.degree && (
                                            <p className="text-sm text-muted-foreground">
                                                {edu.degree}
                                                {edu.field && ` in ${edu.field}`}
                                            </p>
                                        )}
                                    </div>
                                    {isOwner && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => onEdit?.(edu)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {edu.start_year && edu.end_year
                                        ? `${edu.start_year} - ${edu.end_year}`
                                        : edu.start_year || edu.end_year || "Present"}
                                </div>

                                {edu.description && (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {edu.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground/50 italic text-center py-4">
                        Add your education...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
