import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Tasks",
};

export default async function TasksPage() {
  // Use Clerk auth instead of Supabase
  const user = await getAuthUser();
  const isAdmin = user.role === "admin";

  // Use Admin Client to bypass RLS policies that might hide tasks
  // This ensures Admins see ALL tasks and Interns see tasks even if status changes affect RLS
  const supabase = await createAdminClient();

  // Get tasks based on role
  let tasksQuery = supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assigned_to_fkey(*), assigner:profiles!tasks_assigned_by_fkey(*)")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    // ENFORCE PRIVACY: Filter tasks for non-admins securely here
    tasksQuery = tasksQuery.eq("assigned_to", user.id);
  }

  const { data: tasks } = await tasksQuery;

  // Get interns list for admins
  let interns: { id: string; full_name: string | null; email: string }[] = [];
  if (isAdmin) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "intern");
    interns = data || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Manage and assign tasks to interns"
            : "View and manage your assigned tasks"}
        </p>
      </div>

      <TaskFilters isAdmin={isAdmin} interns={interns} userId={user.id} />
      <TaskList tasks={tasks || []} isAdmin={isAdmin} userId={user.id} interns={interns} />
    </div>
  );
}
