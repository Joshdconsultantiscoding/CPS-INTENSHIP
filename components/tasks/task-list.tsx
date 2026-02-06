"use client";

import { useState, useEffect } from "react";
import type { Task } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  Trophy,
  Check,
  XCircle
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAbly } from "@/providers/ably-provider";
import { TaskDialog } from "./task-dialog";
import { updateTaskStatusAction } from "@/app/actions/tasks";

interface TaskListProps {
  tasks: Task[];
  isAdmin: boolean;
  userId: string;
  interns: { id: string; full_name: string | null; email: string }[];
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-3/20 text-chart-3",
  high: "bg-chart-4/20 text-chart-4",
  urgent: "bg-destructive/20 text-destructive",
};

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  overdue: AlertCircle,
};

export function TaskList({ tasks, isAdmin, userId, interns }: TaskListProps) {
  const router = useRouter();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [mounted, setMounted] = useState(false);

  // Real-time Interns State (for Dropdowns)
  const [localInterns, setLocalInterns] = useState(interns);
  // Real-time Tasks State
  const [localTasks, setLocalTasks] = useState(tasks);
  const { client: ablyClient } = useAbly();

  useEffect(() => {
    setLocalInterns(interns);
  }, [interns]);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Listen for real-time updates via Ably
  useEffect(() => {
    if (!ablyClient) return;

    const channel = ablyClient.channels.get("global-updates");

    // Profile Updates
    const handleProfileUpdate = (message: any) => {
      const data = message.data;
      setLocalInterns((prev) =>
        prev.map((intern) =>
          intern.id === data.userId
            ? { ...intern, ...data, full_name: `${data.first_name} ${data.last_name}`.trim() }
            : intern
        )
      );
    };

    // Task Creation Updates
    const handleTaskCreated = (message: any) => {
      const newTask = message.data.task;
      if (!newTask) return;

      // Add to list if I am Admin OR if I am the assignee
      const shouldAdd = isAdmin || newTask.assigned_to === userId;

      if (shouldAdd) {
        setLocalTasks((prev) => {
          // Prevent duplicates
          if (prev.some(t => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
        toast.success(`New task received: ${newTask.title}`);
      }
    };

    // Task Status Updates
    const handleTaskUpdated = (message: any) => {
      const updatedTask = message.data.task;
      if (!updatedTask) return;

      setLocalTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
      );
    };

    channel.subscribe("profile-updated", handleProfileUpdate);
    channel.subscribe("task-created", handleTaskCreated);
    channel.subscribe("task-updated", handleTaskUpdated);

    return () => {
      channel.unsubscribe("profile-updated", handleProfileUpdate);
      channel.unsubscribe("task-created", handleTaskCreated);
      channel.unsubscribe("task-updated", handleTaskUpdated);
    };
  }, [ablyClient, isAdmin, userId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading tasks...</p>
        </CardContent>
      </Card>
    );
  }

  const pendingTasks = localTasks.filter((t) => t.status === "pending");
  const inProgressTasks = localTasks.filter((t) => t.status === "in_progress");
  const completedTasks = localTasks.filter((t) => t.status === "completed");

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const result = await updateTaskStatusAction({
        taskId,
        status: status as any
      });

      if (!result.success) {
        toast.error(result.error || "Failed to update task status");
      } else {
        toast.success("Task status updated");
        // router.refresh() handles the server-side state, 
        // while Ably handles the local state for immediate feedback
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const approveReward = async (taskId: string) => {
    try {
      const { approveTaskRewardAction } = await import("@/app/actions/tasks");
      const result = await approveTaskRewardAction(taskId);

      if (!result.success) {
        toast.error(result.error || "Failed to approve reward");
      } else {
        toast.success("Reward approved & points awarded");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const StatusIcon = statusIcons[task.status] || Circle;
    const isOverdue = task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date();

    // Approval Status Logic
    const isCompleted = task.status === "completed";
    const approvalStatus = task.approval_status || "pending";
    const isApproved = approvalStatus === "approved";

    return (
      <Card className="group relative">
        {/* Helper for Admin Approval */}
        {isAdmin && isCompleted && !isApproved && (
          <div className="absolute top-2 right-2 z-10">
            <Button size="sm" onClick={() => approveReward(task.id)} className="bg-green-600 hover:bg-green-700 text-white shadow-sm h-8 px-2 text-xs">
              <Check className="h-3 w-3 mr-1" /> Approve Reward
            </Button>
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <StatusIcon
                className={`mt-0.5 h-5 w-5 ${task.status === "completed"
                  ? "text-green-500"
                  : isOverdue
                    ? "text-destructive"
                    : "text-muted-foreground"
                  }`}
              />
              <div>
                <CardTitle className="text-base">{task.title}</CardTitle>
                {task.description && (
                  <CardDescription className="mt-1 line-clamp-2">
                    {task.description}
                  </CardDescription>
                )}
              </div>
            </div>

            {/* Context Menu (Only show if not blocked by button) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isAdmin && task.status !== "completed" && (
                  <>
                    {task.status === "pending" && (
                      <DropdownMenuItem onClick={() => updateTaskStatus(task.id, "in_progress")}>
                        Start Working
                      </DropdownMenuItem>
                    )}
                    {task.status === "in_progress" && (
                      <DropdownMenuItem onClick={() => updateTaskStatus(task.id, "completed")}>
                        Mark Complete
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => setEditingTask(task)}>
                    Edit Task
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
            {task.due_date && (
              <Badge variant="outline" className={isOverdue ? "border-destructive text-destructive" : ""}>
                <Calendar className="mr-1 h-3 w-3" />
                {format(new Date(task.due_date), "MMM d")}
              </Badge>
            )}

            {/* Rewards Badge */}
            {task.points > 0 && (
              <Badge variant={isApproved ? "default" : "secondary"} className={isApproved ? "bg-green-500 hover:bg-green-600" : ""}>
                <Trophy className="mr-1 h-3 w-3" />
                {task.points} pts
                {isCompleted && !isApproved && <span className="ml-1 text-[10px] opacity-80">(Pending)</span>}
                {isApproved && <span className="ml-1 text-[10px] opacity-90">(Awarded)</span>}
              </Badge>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            {isAdmin && task.assignee && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar_url || ""} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {task.assignee.full_name}
                </span>
              </div>
            )}
            {!isAdmin && task.assigner && (
              <span className="text-xs text-muted-foreground">
                Assigned by {task.assigner.full_name}
              </span>
            )}
            {task.created_at && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({localTasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {localTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No tasks yet</h3>
                <p className="mt-2 text-center text-muted-foreground">
                  {isAdmin
                    ? "Create your first task to get started"
                    : "No tasks have been assigned to you yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {localTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="in_progress" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inProgressTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {editingTask && (
        <TaskDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          interns={localInterns}
          userId={userId}
          task={editingTask}
        />
      )}
    </>
  );
}
