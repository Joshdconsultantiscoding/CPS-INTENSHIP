"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Quote, MessageSquare } from "lucide-react";
import type { Recommendation } from "@/lib/types/profile";

interface ProfileRecommendationsProps {
    recommendations: Recommendation[];
    isOwner: boolean;
    onRequest?: () => void;
}

export function ProfileRecommendations({
    recommendations,
    isOwner,
    onRequest,
}: ProfileRecommendationsProps) {
    if (recommendations.length === 0 && !isOwner) return null;

    return (
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recommendations
                </CardTitle>
                {isOwner && (
                    <Button variant="outline" size="sm" onClick={onRequest} className="gap-1">
                        <Plus className="h-4 w-4" />
                        Request
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {recommendations.length > 0 ? (
                    recommendations.map((rec) => (
                        <div
                            key={rec.id}
                            className="relative p-5 rounded-xl bg-muted/50 border"
                        >
                            {/* Quote icon */}
                            <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />

                            {/* Author info */}
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar className="h-12 w-12 border-2 border-background">
                                    <AvatarImage src={rec.author_avatar_url || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {rec.author_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-foreground">{rec.author_name}</h4>
                                    {rec.author_title && (
                                        <p className="text-sm text-muted-foreground">{rec.author_title}</p>
                                    )}
                                    {rec.relationship && (
                                        <p className="text-xs text-muted-foreground/70">{rec.relationship}</p>
                                    )}
                                </div>
                            </div>

                            {/* Message */}
                            <p className="text-muted-foreground leading-relaxed italic">
                                "{rec.message}"
                            </p>

                            {/* Date */}
                            <p className="mt-3 text-xs text-muted-foreground/50">
                                {new Date(rec.created_at).toLocaleDateString("en-US", {
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground/50 italic text-center py-8">
                        No recommendations yet...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
