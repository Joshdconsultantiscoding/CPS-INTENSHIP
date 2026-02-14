"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { submitAppealAction } from "@/actions/appeals";

const appealSchema = z.object({
    reason: z.string().min(20, "Please provide a detailed explanation (at least 20 characters)."),
});

interface AppealFormProps {
    type?: 'suspension' | 'route_block';
    targetRoute?: string;
    onSuccess?: () => void;
}

export function AppealForm({ type = 'suspension', targetRoute, onSuccess }: AppealFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<z.infer<typeof appealSchema>>({
        resolver: zodResolver(appealSchema),
        defaultValues: {
            reason: "",
        },
    });

    async function onSubmit(values: z.infer<typeof appealSchema>) {
        setIsSubmitting(true);
        try {
            const result = await submitAppealAction(values.reason, type, targetRoute);
            if (result.success) {
                setIsSubmitted(true);
                toast.success("Appeal submitted successfully.");
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.error || "Failed to submit appeal.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isSubmitted) {
        return (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">Appeal Submitted</h3>
                <p className="text-green-700 dark:text-green-400">
                    Your appeal {type === 'route_block' ? `for ${targetRoute} ` : ''}has been sent to the administration team. You will be notified once a decision has been made.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-2">Submit an Appeal</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                    {type === 'suspension'
                        ? 'If you believe your suspension was a mistake or you wish to request reinstatement, please provide a detailed explanation below.'
                        : `If you believe you should have access to ${targetRoute}, please explain why below.`}
                    Our team will review your case.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Appeal Reason / Explanation</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder={type === 'suspension'
                                            ? "Explain why your account should be restored..."
                                            : "Explain why you need access to this section..."}
                                        className="min-h-[120px] resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Appeal"
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
