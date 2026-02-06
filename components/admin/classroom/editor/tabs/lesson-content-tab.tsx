"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Video,
    FileText,
    Link as LinkIcon,
    Save,
    Loader2,
    AlertCircle,
    PlayCircle,
    CheckCircle2
} from "lucide-react";
import { VideoPlayer } from "@/components/classroom/video-player";
import { updateLessonAdvanced } from "@/actions/classroom-advanced";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const lessonSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters."),
    short_description: z.string().optional(),
    content: z.string().optional(),
    video_url: z.string().url().optional().or(z.literal("")),
    status: z.enum(["draft", "published"]),
    resources: z.array(z.object({
        name: z.string(),
        url: z.string().url()
    })).optional().default([]),
});

interface LessonContentTabProps {
    course: any;
}

export function LessonContentTab({ course }: LessonContentTabProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const lessonId = searchParams.get("lessonId");
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    // Find the lesson in the course object
    const lesson = course.course_modules
        ?.flatMap((m: any) => m.course_lessons || [])
        .find((l: any) => l.id === lessonId);

    const form = useForm<z.infer<typeof lessonSchema>>({
        resolver: zodResolver(lessonSchema),
        defaultValues: {
            title: "",
            short_description: "",
            content: "",
            video_url: "",
            status: "published",
            resources: [],
        },
    });

    // Update form when lesson changes
    useEffect(() => {
        if (lesson) {
            form.reset({
                title: lesson.title || "",
                short_description: lesson.short_description || "",
                content: lesson.content || "",
                video_url: lesson.video_url || "",
                status: lesson.status || "published",
                resources: lesson.resources || [],
            });
        }
    }, [lesson, form]);

    // Helper to find the next lesson ID
    const findNextLessonId = () => {
        if (!course.course_modules) return null;
        const allLessons = course.course_modules.flatMap((m: any) => m.course_lessons || []);
        const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId);
        if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
            return allLessons[currentIndex + 1].id;
        }
        return null;
    };

    const nextLessonId = findNextLessonId();

    async function onSubmit(values: z.infer<typeof lessonSchema>) {
        if (!lessonId) return;
        setIsSaving(true);
        try {
            await updateLessonAdvanced(lessonId, course.id, values);
            // toast.success("Lesson updated!"); // Replaced by Dialog
            setShowSuccessDialog(true);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    }

    const handleNavigate = (tab: string, id?: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set("tab", tab);
        if (id) {
            params.set("lessonId", id);
        } else {
            params.delete("lessonId");
        }
        router.push(`?${params.toString()}`);
        setShowSuccessDialog(false);
    };

    if (!lessonId) {
        // ... (keep existing empty state)
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl bg-muted/5 p-12 text-center">
                <Video className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-semibold">No Lesson Selected</h3>
                <p className="text-muted-foreground max-w-xs mt-2">
                    Select a lesson from the Course Structure tab or the list below to begin editing its content.
                </p>
                <div className="mt-8 grid gap-4 w-full max-w-md">
                    {course.course_modules?.flatMap((m: any) => m.course_lessons || []).slice(0, 5).map((l: any) => (
                        <Button
                            key={l.id}
                            variant="outline"
                            className="justify-start h-12"
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                params.set("lessonId", l.id);
                                router.push(`?${params.toString()}`);
                            }}
                        >
                            <PlayCircle className="mr-2 h-4 w-4 opacity-50" />
                            <span className="truncate">{l.title}</span>
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    if (!lesson) return <div>Lesson not found.</div>;

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-12">
                    {/* ... (Existing Form Content) ... */}
                    {/* Keeping the layout identical, just wrapping in Fragment to add Dialog */}

                    <div className="flex items-center justify-between border-b pb-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{lesson.title}</h2>
                            <p className="text-sm text-muted-foreground">Editing lesson details and learning materials.</p>
                        </div>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Left Content Area */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Video Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Video className="h-4 w-4 text-primary" />
                                        Video Content (Loom, YouTube, Vimeo)
                                    </CardTitle>
                                    <CardDescription>
                                        Paste the direct URL from your video hosting provider to embed it here.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="video_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2 text-primary font-bold">
                                                    Video Embed Link
                                                    <Badge variant="outline" className="text-[10px] uppercase">Required for Video Lessons</Badge>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                                        className="bg-muted/50 border-primary/20 focus-visible:ring-primary"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs">
                                                    We support **Loom**, **YouTube**, and **Vimeo**. Just copy the address from your browser.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="rounded-lg overflow-hidden border bg-black aspect-video">
                                        <VideoPlayer url={form.watch("video_url") || ""} title={form.watch("title") || ""} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Text Content */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        Written Content
                                    </CardTitle>
                                    <CardDescription>Detailed notes and text instructions for this lesson.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter your lesson content here... (Rich Text supported via Markdown for now)"
                                                        className="min-h-[300px] font-mono text-sm leading-relaxed"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Sidebar Area */}
                        <div className="space-y-8">
                            {/* Status & Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Publishing Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Lesson Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                        <SelectItem value="published">Published</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Lesson
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Resources */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        External Resources
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-xs text-muted-foreground italic">
                                        Add links to external PDFs, documents, or websites. (Feature coming soon)
                                    </p>
                                    <Button variant="outline" size="sm" className="w-full" disabled>
                                        <LinkIcon className="mr-2 h-3.5 w-3.5" />
                                        Add Resource
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>

            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-6 w-6" />
                            Lesson Saved Successfully!
                        </DialogTitle>
                        <DialogDescription>
                            Your changes have been saved. What would you like to do next?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                        {nextLessonId && (
                            <Button onClick={() => handleNavigate("lessons", nextLessonId)} className="w-full justify-start text-left h-auto py-3">
                                <span className="flex flex-col items-start">
                                    <span className="font-semibold">Go to Next Lesson</span>
                                    <span className="text-xs font-normal opacity-70">Continue editing content sequentially.</span>
                                </span>
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => handleNavigate("modules")} className="w-full justify-start text-left h-auto py-3">
                            <span className="flex flex-col items-start">
                                <span className="font-semibold">Return to Modules</span>
                                <span className="text-xs font-normal opacity-70">Manage course structure.</span>
                            </span>
                        </Button>
                        <Button variant="outline" onClick={() => handleNavigate("assessment")} className="w-full justify-start text-left h-auto py-3">
                            <span className="flex flex-col items-start">
                                <span className="font-semibold">Go to Assessments</span>
                                <span className="text-xs font-normal opacity-70">Add questions for this course.</span>
                            </span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
