"use server";

import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";

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

        // 3. Fetch full task details with relations for the UI
        const { data: fullTask, error: fetchError } = await supabase
            .from("tasks")
            .select("*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*)")
            .eq("id", data.id)
            .single();

        if (fetchError) {
            console.error("[Server Action] Error fetching full task details:", fetchError);
            // We continue without broadcasting if fetch fails, but this shouldn't happen
        } else if (process.env.ABLY_API_KEY) {
            try {
                const Ably = require('ably');
                const ably = new Ably.Rest(process.env.ABLY_API_KEY);
                const channel = ably.channels.get("global-updates");

                await channel.publish("task-created", {
                    task: fullTask,
                    timestamp: Date.now()
                });
                console.log("[Server Action] Broadcasted task-created event");
            } catch (ablyError) {
                console.warn("[Server Action] Failed to broadcast task creation:", ablyError);
            }
        }

        // Revalidate the tasks page to show the new task
        revalidatePath("/dashboard/tasks");

        return {
            success: true,
            taskId: data.id,
        };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[Server Action] Unexpected error:", error);
        return {
            success: false,
            error: error?.message || "An unexpected error occurred",
        };
    }
}

export interface UpdateTaskStatusInput {
    taskId: string;
    status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
}

export async function updateTaskStatusAction(input: UpdateTaskStatusInput): Promise<CreateTaskResult> {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        console.log(`[Server Action] Updating task ${input.taskId} status to ${input.status} (User: ${user.email})`);

        // 1. Get current task details for notification and activity log
        const { data: currentTask, error: fetchError } = await supabase
            .from("tasks")
            .select("title, assigned_by, assigned_to, status")
            .eq("id", input.taskId)
            .single();

        if (fetchError || !currentTask) {
            console.error("[Server Action] Error fetching task:", fetchError);
            return { success: false, error: "Task not found." };
        }

        // 2. Perform the update
        const updates: Record<string, any> = {
            status: input.status,
            updated_at: new Date().toISOString()
        };

        if (input.status === "completed") {
            updates.completed_at = new Date().toISOString();
        }

        const { data: updatedTask, error: updateError } = await supabase
            .from("tasks")
            .update(updates)
            .eq("id", input.taskId)
            .select("*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*)")
            .single();

        if (updateError) {
            console.error("[Server Action] Update error:", updateError);
            return { success: false, error: updateError.message };
        }

        // 3. Log activity
        let actionLabel = "";
        switch (input.status) {
            case "in_progress": actionLabel = "started working on task"; break;
            case "completed": actionLabel = "completed task"; break;
            case "cancelled": actionLabel = "cancelled task"; break;
            default: actionLabel = "updated status of task";
        }

        const { error: logError } = await supabase.from("activity_logs").insert({
            user_id: user.id,
            action: `${actionLabel}: ${currentTask.title}`,
            entity_type: "task",
            entity_id: input.taskId,
            metadata: {
                previous_status: currentTask.status,
                new_status: input.status,
                task_title: currentTask.title
            }
        });

        if (logError) console.warn("[Server Action] Activity log failed:", logError.message);

        // 4. Create notification for the assigner (if it's the assignee who updated it)
        if (user.id === currentTask.assigned_to && user.id !== currentTask.assigned_by) {
            const { error: notifError } = await supabase.from("notifications").insert({
                user_id: currentTask.assigned_by,
                title: "Task Status Updated",
                message: `${user.full_name || user.email} ${actionLabel}: ${currentTask.title}`,
                type: "task",
                reference_id: input.taskId,
                reference_type: "task",
            });
            if (notifError) console.warn("[Server Action] Notification failed:", notifError.message);
        }

        // 5. Broadcast update via Ably
        if (process.env.ABLY_API_KEY) {
            try {
                const Ably = require('ably');
                const ably = new Ably.Rest(process.env.ABLY_API_KEY);
                const channel = ably.channels.get("global-updates");

                await channel.publish("task-updated", {
                    task: updatedTask,
                    timestamp: Date.now()
                });
                console.log("[Server Action] Broadcasted task-updated event");
            } catch (ablyError) {
                console.warn("[Server Action] Failed to broadcast task update:", ablyError);
            }
        }

        revalidatePath("/dashboard/tasks");
        revalidatePath("/dashboard");

        return { success: true, taskId: input.taskId };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[Server Action] Unexpected error:", error);
        return { success: false, error: error?.message || "An unexpected error occurred" };
    }
}

export async function approveTaskRewardAction(taskId: string): Promise<CreateTaskResult> {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        if (user.role !== "admin") {
            return { success: false, error: "Only admins can approve rewards." };
        }

        // 1. Get task details
        const { data: task, error: fetchError } = await supabase
            .from("tasks")
            .select("title, points, assigned_to, approval_status")
            .eq("id", taskId)
            .single();

        if (fetchError || !task) {
            return { success: false, error: "Task not found." };
        }

        if (task.approval_status === "approved") {
            return { success: false, error: "Reward already approved." };
        }

        // 2. Update task status
        const { error: updateError } = await supabase
            .from("tasks")
            .update({ approval_status: "approved" })
            .eq("id", taskId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        // 3. Award points to intern
        // First get current points to be safe, though incrementing is better if possible via RPC
        // For now, standard update
        const { data: profile, error: profileFetchError } = await supabase
            .from("profiles")
            .select("total_points")
            .eq("id", task.assigned_to)
            .single();

        if (!profileFetchError && profile) {
            const newTotal = (profile.total_points || 0) + (task.points || 0);
            await supabase
                .from("profiles")
                .update({ total_points: newTotal })
                .eq("id", task.assigned_to);
        }

        // 4. Log activity
        await supabase.from("activity_logs").insert({
            user_id: user.id,
            action: `approved reward for task: ${task.title}`,
            entity_type: "task",
            entity_id: taskId,
            metadata: {
                points: task.points,
                intern_id: task.assigned_to
            }
        });

        // 5. Notify intern
        await supabase.from("notifications").insert({
            user_id: task.assigned_to,
            title: "Points Awarded!",
            message: `You earned ${task.points} points for completing: ${task.title}`,
            type: "reward",
            reference_id: taskId,
            reference_type: "task",
        });

        // 6. Broadcast via Ably
        const { data: fullTask } = await supabase
            .from("tasks")
            .select("*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*)")
            .eq("id", taskId)
            .single();

        if (process.env.ABLY_API_KEY) {
            try {
                const Ably = require('ably');
                const ably = new Ably.Rest(process.env.ABLY_API_KEY);
                const channel = ably.channels.get("global-updates");

                await channel.publish("task-updated", {
                    task: fullTask,
                    timestamp: Date.now()
                });
            } catch (aError) {
                console.warn("[Reward Action] Ably broadcast failed:", aError);
            }
        }

        revalidatePath("/dashboard/tasks");
        revalidatePath("/dashboard");

        return { success: true, taskId };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[Reward Action] Unexpected error:", error);
        return { success: false, error: error?.message || "An unexpected error occurred" };
    }
}
