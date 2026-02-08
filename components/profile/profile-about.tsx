"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface ProfileAboutProps {
    about: string | null;
    isOwner: boolean;
    onEdit?: () => void;
}

export function ProfileAbout({ about, isOwner, onEdit }: ProfileAboutProps) {
    if (!about && !isOwner) return null;

    return (
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">About</CardTitle>
                {isOwner && (
                    <Button variant="ghost" size="icon" onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {about ? (
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {about}
                    </p>
                ) : (
                    <p className="text-muted-foreground/50 italic">
                        Add a summary about yourself...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
