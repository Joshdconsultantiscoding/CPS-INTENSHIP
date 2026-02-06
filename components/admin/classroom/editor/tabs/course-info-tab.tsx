"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2, Save, Image as ImageIcon, Globe, BookOpen, Target } from "lucide-react";
import { updateCourseAdvanced } from "@/actions/classroom-advanced";
import { toast } from "sonner";

const formSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters."),
    short_description: z.string().optional(),
    full_description: z.any().optional(), // JSONB
    category: z.string().optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    language: z.string().default("English"),
    thumbnail_url: z.string().url().optional().or(z.literal("")),
    cover_image_url: z.string().url().optional().or(z.literal("")),
    seo_title: z.string().optional(),
    meta_description: z.string().optional(),
    slug: z.string().min(3, "Slug must be at least 3 characters.").optional(),
});

interface CourseInfoTabProps {
    course: any;
}

import { useRouter } from "next/navigation";

// ... (imports)

export function CourseInfoTab({ course }: CourseInfoTabProps) {
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: course.title || "",
            short_description: course.short_description || "",
            full_description: course.full_description || {},
            category: course.category || "General",
            level: course.level || "beginner",
            language: course.language || "English",
            thumbnail_url: course.thumbnail_url || "",
            cover_image_url: course.cover_image_url || "",
            seo_title: course.seo_title || "",
            meta_description: course.meta_description || "",
            slug: course.slug || "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSaving(true);
        try {
            const result = await updateCourseAdvanced(course.id, values);
            if (result && result.success) {
                toast.success("Course information updated successfully!");
                router.refresh();
                // Redirect to Modules tab after short delay to allow toast to be seen
                setTimeout(() => {
                    const params = new URLSearchParams(window.location.search);
                    params.set("tab", "modules");
                    router.push(`?${params.toString()}`);
                }, 1000);
            }
        } catch (error: any) {
            console.error("Update error:", error);
            toast.error(error.message || "Failed to update course.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-12">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Course Identity
                                </CardTitle>
                                <CardDescription>Basic information about your course.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Course Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Master React in 30 Days" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="short_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Short Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="A brief overview (1-2 sentences) used in cards and search results."
                                                    className="resize-none h-20"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Development">Development</SelectItem>
                                                        <SelectItem value="Design">Design</SelectItem>
                                                        <SelectItem value="Business">Business</SelectItem>
                                                        <SelectItem value="Marketing">Marketing</SelectItem>
                                                        <SelectItem value="General">General</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="level"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Level</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select level" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="beginner">Beginner</SelectItem>
                                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                                        <SelectItem value="advanced">Advanced</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="language"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                Instructional Language
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Visuals & SEO */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Visual Media
                                </CardTitle>
                                <CardDescription>Thumbnails and banners for the course.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="thumbnail_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Course Thumbnail (16:9)</FormLabel>
                                            <FormControl>
                                                <ImageUpload
                                                    bucket="portal-assets"
                                                    folder="courses/thumbnails"
                                                    initialImage={field.value}
                                                    onUploadComplete={field.onChange}
                                                    aspectRatio={16 / 9}
                                                    label="Upload Thumbnail"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cover_image_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hero Banner Image (16:9)</FormLabel>
                                            <FormControl>
                                                <ImageUpload
                                                    bucket="portal-assets"
                                                    folder="courses/banners"
                                                    initialImage={field.value}
                                                    onUploadComplete={field.onChange}
                                                    aspectRatio={16 / 9}
                                                    label="Upload Banner"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    SEO & Search Metadata
                                </CardTitle>
                                <CardDescription>Optimize how your course appears in search engines.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="seo_title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SEO Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Search engine title..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Course Slug (URL)</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground text-xs">/courses/</span>
                                                    <Input placeholder="advanced-react" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="meta_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Meta Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Brief summary for search results..."
                                                    className="resize-none h-20"
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
                </div>

                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Progress
                    </Button>
                </div>
            </form>
        </Form>
    );
}
