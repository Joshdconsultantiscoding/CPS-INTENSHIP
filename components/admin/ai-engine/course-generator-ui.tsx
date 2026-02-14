"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
    BookOpen,
    Loader2,
    Sparkles,
    Save,
    Clock,
    GraduationCap,
} from "lucide-react";

interface GeneratedModule {
    title: string;
    description: string;
    order_index: number;
    lessons: {
        title: string;
        content: string;
        duration_minutes: number;
        order_index: number;
    }[];
}

interface GeneratedCourse {
    title: string;
    description: string;
    level: string;
    duration_minutes: number;
    modules: GeneratedModule[];
}

export default function CourseGeneratorUI() {
    const [prompt, setPrompt] = useState("");
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [course, setCourse] = useState<GeneratedCourse | null>(null);

    async function handleGenerate() {
        if (!prompt.trim()) {
            toast.error("Enter a course description");
            return;
        }

        setGenerating(true);
        setCourse(null);

        try {
            const res = await fetch("/api/ai/courses/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt.trim() }),
            });

            const data = await res.json();
            if (res.ok && data.course) {
                setCourse(data.course);
                toast.success("Course structure generated!");
            } else {
                toast.error(data.error || "Generation failed");
            }
        } catch (e: any) {
            toast.error(e.message || "Generation failed");
        } finally {
            setGenerating(false);
        }
    }

    async function handleSave() {
        if (!course) return;
        setSaving(true);

        try {
            const res = await fetch("/api/ai/courses/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt.trim(), save: true }),
            });

            const data = await res.json();
            if (res.ok && data.saved) {
                toast.success("Course saved to database as a draft!");
            } else {
                toast.error(data.error || "Save failed");
            }
        } catch (e: any) {
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Knowledge-Aware Course Generator
                    </CardTitle>
                    <CardDescription>
                        Generate course structures aligned with your institutional knowledge base
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Course Description</Label>
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A comprehensive web development course covering HTML, CSS, and JavaScript fundamentals for beginners, aligned with the internship learning track..."
                            className="min-h-[100px]"
                            disabled={generating}
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={generating || !prompt.trim()}>
                        {generating ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                        ) : (
                            <><Sparkles className="h-4 w-4 mr-2" />Generate Course</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Generated Course Preview */}
            {course && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    {course.title}
                                </CardTitle>
                                <CardDescription className="mt-1">{course.description}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">{course.level}</Badge>
                                <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    {course.duration_minutes}m
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                                {course.modules?.map((mod, mi) => (
                                    <div key={mi} className="border rounded-lg p-4 space-y-2">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Badge className="bg-violet-600">{mi + 1}</Badge>
                                            {mod.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                                        <div className="ml-4 space-y-1.5">
                                            {mod.lessons?.map((lesson, li) => (
                                                <div key={li} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                                                    <span className="text-muted-foreground text-xs shrink-0">
                                                        {mi + 1}.{li + 1}
                                                    </span>
                                                    <span className="flex-1">{lesson.title}</span>
                                                    <span className="text-xs text-muted-foreground shrink-0">{lesson.duration_minutes}m</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="flex justify-end pt-4 border-t mt-4">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                                ) : (
                                    <><Save className="h-4 w-4 mr-2" />Save as Draft Course</>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
