"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { TaskPriority } from "@/lib/types";

interface TaskCreationPageProps {
    userId: string;
    interns: { id: string; full_name: string | null; email: string }[];
}

export function TaskCreationPage({ userId, interns }: TaskCreationPageProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("medium");
    const [dueDate, setDueDate] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [points, setPoints] = useState("10");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Please enter a task title");
            return;
        }

        if (!assignedTo) {
            toast.error("Please select an intern to assign this task to");
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            const taskData = {
                title: title.trim(),
                description: description.trim() || null,
                priority,
                status: "pending" as const,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                assigned_to: assignedTo,
                assigned_by: userId,
                points: parseInt(points) || 10,
            };

            const { data, error } = await supabase
                .from("tasks")
                .insert(taskData)
                .select()
                .single();

            if (error) {
                console.error("Task creation error:", error);
                toast.error(`Failed to create task: ${error.message}`);
                setLoading(false);
                return;
            }

            // Create notification for the assignee
            await supabase.from("notifications").insert({
                user_id: assignedTo,
                title: "New Task Assigned",
                message: `You have been assigned a new task: ${title}`,
                type: "task",
                reference_id: data.id,
                reference_type: "task",
            });

            toast.success("Task created successfully!");
            router.push("/dashboard/tasks");
            router.refresh();
        } catch (error) {
            console.error("Unexpected error:", error);
            toast.error("An unexpected error occurred");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/tasks">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create New Task</h1>
                    <p className="text-muted-foreground">
                        Assign a task to an intern
                    </p>
                </div>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Task Details</CardTitle>
                    <CardDescription>
                        Fill in the information below to create a new task.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter task title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the task in detail..."
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="assignee">
                                    Assign To <span className="text-destructive">*</span>
                                </Label>
                                <Select value={assignedTo} onValueChange={setAssignedTo} required>
                                    <SelectTrigger id="assignee">
                                        <SelectValue placeholder="Select intern" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {interns.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground">
                                                No active interns found
                                            </div>
                                        ) : (
                                            interns.map((intern) => (
                                                <SelectItem key={intern.id} value={intern.id}>
                                                    {intern.full_name || intern.email}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    value={priority}
                                    onValueChange={(v) => setPriority(v as TaskPriority)}
                                >
                                    <SelectTrigger id="priority">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="dueDate">Due Date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="points">Reward Points</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={points}
                                    onChange={(e) => setPoints(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || interns.length === 0}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Task
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
