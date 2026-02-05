"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Users, Edit, Trash2, ExternalLink } from "lucide-react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { createClass, updateClass, deleteClass } from "@/actions/classroom-admin";

// Zod schema for class creation/edit
const formSchema = z.object({
    name: z.string().min(2, "Class name must be at least 2 characters."),
    description: z.string().optional(),
});

interface ClassManagerProps {
    initialClasses: any[];
}

export function ClassManager({ initialClasses }: ClassManagerProps) {
    const [open, setOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    // Sync form with editing state
    useEffect(() => {
        if (editingClass) {
            form.reset({
                name: editingClass.name,
                description: editingClass.description || "",
            });
        } else {
            form.reset({
                name: "",
                description: "",
            });
        }
    }, [editingClass, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (editingClass) {
                await updateClass(editingClass.id, values.name, values.description || "");
                toast.success("Class updated", {
                    description: "Initial details updated.",
                });
                setOpen(false);
                setEditingClass(null);
            } else {
                const result = await createClass(values.name, values.description || "");
                if (result.success && result.id) {
                    toast.success("Class created", {
                        description: "Redirecting to class dashboard...",
                    });
                    router.push(`/dashboard/admin/classroom/classes/${result.id}/edit`);
                } else {
                    toast.success("Class created", {
                        description: "The new class has been successfully created.",
                    });
                }
            }
            form.reset();
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error", {
                description: `Failed to ${editingClass ? "update" : "create"} class.`,
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove all enrollments for this class too.")) return;

        try {
            await deleteClass(id);
            toast.success("Class deleted", {
                description: "The class has been permanently removed.",
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Error", {
                description: "Failed to delete class.",
            });
        }
    };

    const handleEdit = (cls: any) => {
        setEditingClass(cls);
        setOpen(true);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setEditingClass(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Active Classes</h3>
                <Button onClick={() => {
                    setEditingClass(null);
                    setOpen(true);
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Class
                </Button>

                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingClass ? "Edit Class" : "Create New Class"}</DialogTitle>
                            <DialogDescription>
                                {editingClass ? "Update the class details below." : "Create a private group for interns."}
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Class Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Frontend Cohort A" {...field} />
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
                                                <Textarea placeholder="Brief description of this class..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        {editingClass ? "Update Class" : "Create Class"}
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
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialClasses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No classes found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialClasses.map((cls) => (
                                <TableRow key={cls.id}>
                                    <TableCell className="font-medium">{cls.name}</TableCell>
                                    <TableCell className="max-w-xs truncate">{cls.description}</TableCell>
                                    <TableCell>{new Date(cls.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={`/dashboard/admin/classroom/classes/${cls.id}/edit`}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Manage
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(cls)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(cls.id)}>
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
