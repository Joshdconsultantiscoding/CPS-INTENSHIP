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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { TaskPriority } from "@/lib/types";
import { createTaskAction } from "../../app/actions/tasks";

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
        console.log("[Task Creation] Form submitted");

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
            console.log("[Task Creation] Calling server action with data:", {
                title: title.trim(),
                assignedTo,
                assignedBy: userId,
                priority,
                points: parseInt(points) || 10
            });

            const result = await createTaskAction({
                title: title.trim(),
                description: description.trim() || null,
                priority,
                due_date: dueDate || null,
                assigned_to: assignedTo,
                points: parseInt(points) || 10,
            });

            if (!result.success) {
                console.error("[Task Creation] Server action failed:", result.error);
                toast.error(result.error || "Failed to create task");
                setLoading(false);
                return;
            }

            console.log("[Task Creation] Task created successfully:", result.taskId);
            toast.success("Task created successfully!");
            router.push("/dashboard/tasks");
            router.refresh();
        } catch (error: any) {
            console.error("[Task Creation] Unexpected error:", {
                error,
                message: error?.message,
                stack: error?.stack
            });
            toast.error(`An unexpected error occurred: ${error?.message || 'Unknown error'}`);
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-4xl space-y-6">
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

                <Card>
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
        </div>
    );
}
