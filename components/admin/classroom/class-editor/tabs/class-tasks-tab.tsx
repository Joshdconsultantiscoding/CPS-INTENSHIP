"use client";
import { useState } from "react";
import { CheckSquare, Plus, Info, Calendar, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { createClassTask, deleteClassTask } from "@/actions/classroom-admin";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClassTasksTabProps {
    classId: string;
    initialTasks: any[];
}

export function ClassTasksTab({ classId, initialTasks }: ClassTasksTabProps) {
    const [tasks, setTasks] = useState(initialTasks);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        deadline: "",
        submissionType: "text" as "text" | "link" | "file" | "all"
    });

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await createClassTask({
                classId,
                ...formData
            });
            if (result.success) {
                setTasks([result.task, ...tasks]);
                setIsCreateOpen(false);
                setFormData({ title: "", description: "", deadline: "", submissionType: "text" });
                toast.success("Task created and interns notified!");
            }
        } catch (error) {
            toast.error("Failed to create task");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            const result = await deleteClassTask(taskId, classId);
            if (result.success) {
                setTasks(tasks.filter(t => t.id !== taskId));
                toast.success("Task deleted");
            }
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Class Tasks & Activities</h3>
                    <p className="text-sm text-muted-foreground">
                        Assign tasks and track submission progress for this cohort.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Activity
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreateTask}>
                            <DialogHeader>
                                <DialogTitle>Create Class Task</DialogTitle>
                                <DialogDescription>
                                    Enrolled interns will receive a notification immediately.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Task Title</Label>
                                    <Input
                                        id="title"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Final Project Submission"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Markdown supported)</Label>
                                    <Textarea
                                        id="description"
                                        required
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Detailed instructions for the interns..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="deadline">Deadline (Optional)</Label>
                                        <Input
                                            id="deadline"
                                            type="datetime-local"
                                            value={formData.deadline}
                                            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Submission Type</Label>
                                        <Select
                                            value={formData.submissionType}
                                            onValueChange={(val: any) => setFormData({ ...formData, submissionType: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text only</SelectItem>
                                                <SelectItem value="link">URL Link</SelectItem>
                                                <SelectItem value="file">File Upload</SelectItem>
                                                <SelectItem value="all">Any Submission</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create & Notify
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 border border-dashed rounded-xl bg-muted/5">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                        <CheckSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">No tasks assigned yet</h4>
                    <p className="text-sm text-muted-foreground text-center max-w-sm mb-8">
                        Create your first task to start tracking intern progress for this class.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold">{task.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-[10px] uppercase">
                                            {task.submission_type}
                                        </Badge>
                                        {task.deadline && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Due {format(new Date(task.deadline), "MMM d, h:mm a")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
