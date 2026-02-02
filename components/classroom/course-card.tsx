"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BarChart } from "lucide-react";
import Image from "next/image";

interface CourseCardProps {
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl?: string;
    level: "beginner" | "intermediate" | "advanced";
    durationMinutes: number;
}

export function CourseCard({
    id,
    title,
    description,
    price,
    thumbnailUrl,
    level,
    durationMinutes,
}: CourseCardProps) {
    const formatDuration = (mins: number) => {
        const hours = Math.floor(mins / 60);
        const m = mins % 60;
        if (hours === 0) return `${m}m`;
        return `${hours}h ${m}m`;
    };

    return (
        <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative aspect-video w-full bg-muted">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                        No Thumbnail
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <Badge variant={price === 0 ? "secondary" : "default"}>
                        {price === 0 ? "FREE" : `$${price}`}
                    </Badge>
                </div>
            </div>
            <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs capitalize">{level}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(durationMinutes)}
                    </span>
                </div>
                <CardTitle className="line-clamp-1 text-lg">{title}</CardTitle>
                <CardDescription className="line-clamp-2 text-sm">{description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
                <Button asChild className="w-full">
                    <Link href={`/dashboard/classroom/courses/${id}`}>
                        View Course
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
