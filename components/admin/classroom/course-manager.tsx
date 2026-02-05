"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { createCourse, updateCourse, deleteCourse } from "@/actions/classroom-admin";

const formSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters."),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
    assignment_type: z.enum(["global", "selective"]),
    is_published: z.boolean().default(false),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    duration_minutes: z.coerce.number().min(0),
});

interface CourseManagerProps {
    initialCourses: any[];
}

export function CourseManager({ initialCourses }: CourseManagerProps) {
    const [open, setOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<any>(null);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            price: 0,
            assignment_type: "global",
            is_published: false,
            level: "beginner",
            duration_minutes: 0,
        },
    });

    // Reset form when editingCourse changes
    useEffect(() => {
        if (editingCourse) {
            form.reset({
                title: editingCourse.title,
                description: editingCourse.description || "",
                price: Number(editingCourse.price),
                assignment_type: editingCourse.assignment_type,
                is_published: editingCourse.is_published,
                level: editingCourse.level || "beginner",
                duration_minutes: editingCourse.duration_minutes || 0,
            });
        } else {
            form.reset({
                title: "",
                description: "",
                price: 0,
                assignment_type: "global",
                is_published: false,
                level: "beginner",
                duration_minutes: 0,
            });
        }
    }, [editingCourse, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (editingCourse) {
                await updateCourse(editingCourse.id, values);
                toast.success("Course updated", {
                    description: "Initial details updated.",
                });
                setOpen(false);
                setEditingCourse(null);
            } else {
                const result = await createCourse(values);
                if (result.success && result.id) {
                    toast.success("Course created", {
                        description: "Redirecting to deep editor...",
                    });
                    router.push(`/dashboard/admin/classroom/courses/${result.id}/edit`);
                } else {
                    toast.success("Course created", {
                        description: "The course has been successfully created.",
                    });
                }
            }
            form.reset();
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error", {
                description: `Failed to ${editingCourse ? "update" : "create"} course.`,
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

        try {
            await deleteCourse(id);
            toast.success("Course deleted", {
                description: "The course has been removed.",
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error", {
                description: "Failed to delete course.",
            });
        }
    };

    const handleEdit = (course: any) => {
        setEditingCourse(course);
        form.reset({
            title: course.title,
            description: course.description || "",
            price: course.price,
            assignment_type: course.assignment_type,
            is_published: course.is_published,
        });
        setOpen(true);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setEditingCourse(null);
            form.reset({
                title: "",
                description: "",
                price: 0,
                assignment_type: "global",
                is_published: false,
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Course Library</h3>
                <Button onClick={() => {
                    setEditingCourse(null);
                    form.reset({
                        title: "",
                        description: "",
                        price: 0,
                        assignment_type: "global",
                        is_published: false,
                    });
                    setOpen(true);
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Course
                </Button>

                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
                            <DialogDescription>
                                {editingCourse ? "Update the course details below." : "Add a new course to the library."}
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Course Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Advanced React Patterns" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="What is this course about?" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price ($)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormDescription>Set to 0 for free courses.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="duration_minutes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Duration (Minutes)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="level"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Difficulty Level</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                                    <FormField
                                        control={form.control}
                                        name="assignment_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Assignment Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="global">Global (All Interns)</SelectItem>
                                                        <SelectItem value="selective">Selective (Assigned Only)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="is_published"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Published</FormLabel>
                                                <FormDescription>
                                                    Visible to interns if enabled.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter>
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {editingCourse ? "Update Course" : "Create Course"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialCourses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No courses found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialCourses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell className="font-medium">{course.title}</TableCell>
                                    <TableCell className="capitalize">{course.level || "beginner"}</TableCell>
                                    <TableCell>
                                        <Badge variant={course.assignment_type === "global" ? "secondary" : "outline"}>
                                            {course.assignment_type === "global" ? "Global" : "Selective"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{course.price > 0 ? `$${Number(course.price).toFixed(2)}` : "Free"}</TableCell>
                                    <TableCell>
                                        <Badge variant={course.is_published ? "default" : "destructive"}>
                                            {course.is_published ? "Published" : "Draft"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={`/dashboard/admin/classroom/courses/${course.id}/edit`}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Manage
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(course)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(course.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
