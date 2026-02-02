"use server";

import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateTaskInput {
    title: string;
    description: string | null;
    priority: "low" | "medium" | "high" | "urgent";
    due_date: string | null;
    assigned_to: string;
    points: number;
}

export interface CreateTaskResult {
    success: boolean;
    error?: string;
    taskId?: string;
}

export async function createTaskAction(input: CreateTaskInput): Promise<CreateTaskResult> {
    try {
        // Get authenticated user
        const user = await getAuthUser();

        // Only admins can create tasks
        if (user.role !== "admin") {
            return {
                success: false,
                error: "You don't have permission to create tasks. Only administrators can assign tasks.",
            };
        }

        console.log("[Server Action] Creating task for user:", user.email);

        // Use admin client to bypass RLS since we've already verified admin role
        const supabase = await createAdminClient();

        const taskData = {
            title: input.title,
            description: input.description,
            priority: input.priority,
            status: "pending" as const,
            due_date: input.due_date ? new Date(input.due_date).toISOString() : null,
            assigned_to: input.assigned_to,
            assigned_by: user.id,
            points: input.points,
        };

        console.log("[Server Action] Inserting task:", JSON.stringify(taskData, null, 2));

        const { data, error } = await supabase
            .from("tasks")
            .insert(taskData)
            .select()
            .single();

        if (error) {
            console.error("[Server Action] Database error:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            });

            return {
                success: false,
                error: `Failed to create task: ${error.message}`,
            };
        }

        console.log("[Server Action] Task created successfully:", data.id);

        // Create notification for the assignee
        const { error: notifError } = await supabase.from("notifications").insert({
            user_id: input.assigned_to,
            title: "New Task Assigned",
            message: `You have been assigned a new task: ${input.title}`,
            type: "task",
            reference_id: data.id,
            reference_type: "task",
        });

        if (notifError) {
            console.warn("[Server Action] Failed to create notification:", notifError.message);
            // Don't fail the whole operation
        }

        // Revalidate the tasks page to show the new task
        revalidatePath("/dashboard/tasks");

        return {
            success: true,
            taskId: data.id,
        };
    } catch (error: any) {
        console.error("[Server Action] Unexpected error:", error);
        return {
            success: false,
            error: error?.message || "An unexpected error occurred",
        };
    }
}
