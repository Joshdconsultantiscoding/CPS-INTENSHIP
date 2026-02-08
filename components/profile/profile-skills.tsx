"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, ThumbsUp, Sparkles } from "lucide-react";
import type { ProfileSkill } from "@/lib/types/profile";
import { endorseSkill } from "@/actions/profile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileSkillsProps {
    skills: ProfileSkill[];
    isOwner: boolean;
    onAdd?: () => void;
    onEdit?: () => void;
}

export function ProfileSkills({
    skills,
    isOwner,
    onAdd,
    onEdit,
}: ProfileSkillsProps) {
    const [endorsing, setEndorsing] = useState<string | null>(null);

    const handleEndorse = async (skillId: string) => {
        setEndorsing(skillId);
        const result = await endorseSkill(skillId);
        if (result.success) {
            toast.success("Skill endorsed!");
        } else {
            toast.error(result.error || "Failed to endorse");
        }
        setEndorsing(null);
    };

    if (skills.length === 0 && !isOwner) return null;

    return (
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Skills
                </CardTitle>
                {isOwner && (
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={onAdd}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onEdit}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <Badge
                                key={skill.id}
                                variant="secondary"
                                className={cn(
                                    "px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary/80 cursor-pointer transition-all",
                                    skill.endorsements_count > 0 && "ring-1 ring-primary/20"
                                )}
                            >
                                <span>{skill.skill_name}</span>
                                {skill.endorsements_count > 0 && (
                                    <span className="flex items-center gap-1 text-xs text-primary">
                                        <ThumbsUp className="h-3 w-3" />
                                        {skill.endorsements_count}
                                    </span>
                                )}
                                {!isOwner && (
                                    <button
                                        onClick={() => handleEndorse(skill.id)}
                                        disabled={endorsing === skill.id}
                                        className={cn(
                                            "ml-1 p-1 rounded-full hover:bg-primary/10 transition-colors",
                                            endorsing === skill.id && "opacity-50"
                                        )}
                                        title="Endorse this skill"
                                    >
                                        <ThumbsUp className="h-3 w-3" />
                                    </button>
                                )}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground/50 italic text-center py-4">
                        Add your skills...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
