"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
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
import { ImageUpload } from "@/components/ui/image-upload";
import { updateClass } from "@/actions/classroom-admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    description: z.string().optional(),
    icon_url: z.string().optional(),
});

interface ClassOverviewTabProps {
    classData: any;
}

export function ClassOverviewTab({ classData }: ClassOverviewTabProps) {
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: classData.name || "",
            description: classData.description || "",
            icon_url: classData.icon_url || "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await updateClass(classData.id, values.name, values.description || "", values.icon_url);
            toast.success("Changes saved", {
                description: "Class overview has been updated.",
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update class details.");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-medium">Class Identity</h3>
                <p className="text-sm text-muted-foreground">
                    Update the basic information and branding for this class.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-6">
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
                                        <FormLabel>Short Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="What is this class focusing on?"
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="icon_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Class Icon / Image</FormLabel>
                                        <FormControl>
                                            <ImageUpload
                                                bucket="portal-assets"
                                                folder="classes"
                                                initialImage={field.value}
                                                onUploadComplete={(url) => field.onChange(url)}
                                                aspectRatio={1}
                                                label="Upload Icon"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Recommended: Square image (1:1 aspect ratio).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
