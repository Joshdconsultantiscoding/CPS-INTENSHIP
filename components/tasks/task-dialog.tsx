"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interns: { id: string; full_name: string | null; email: string }[];
  userId: string;
  task?: Task;
}

export function TaskDialog({
  open,
  onOpenChange,
  interns,
  userId,
  task,
}: TaskDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "medium");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "pending");
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.split("T")[0] : ""
  );
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || "");
  const [points, setPoints] = useState(task?.points?.toString() || "10");

  const isEditing = !!task;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const taskData = {
      title,
      description: description || null,
      priority,
      status,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      assigned_to: assignedTo,
      points: parseInt(points) || 10,
    };

    try {
      if (isEditing) {
        const { updateTaskAction } = await import("@/app/actions/tasks");
        const result = await updateTaskAction({
          id: task.id,
          ...taskData
        });

        if (!result.success) {
          toast.error(result.error || "Failed to update task");
          setLoading(false);
          return;
        }

        toast.success("Task updated successfully");
      } else {
        const { createTaskAction } = await import("@/app/actions/tasks");
        const result = await createTaskAction({
          ...taskData,
          assigned_to: assignedTo,
        });

        if (!result.success) {
          toast.error(result.error || "Failed to create task");
          setLoading(false);
          return;
        }

        toast.success("Task created successfully");
      }

      setLoading(false);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Task Operation Error:", error);
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the task details below."
              : "Fill in the details to create a new task for an intern."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
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
                placeholder="Describe the task..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignee">Assign To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo} required>
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder="Select intern" />
                  </SelectTrigger>
                  <SelectContent>
                    {interns.map((intern) => (
                      <SelectItem key={intern.id} value={intern.id}>
                        {intern.full_name || intern.email}
                      </SelectItem>
                    ))}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </div>
            </div>
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as TaskStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
