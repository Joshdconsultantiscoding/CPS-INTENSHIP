import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { InternDashboard } from "@/components/dashboard/intern-dashboard";
import { redirect } from "next/navigation";
import type { DailyReport, ActivityLog, Task, Notification } from "@/lib/types";
import { AdminVaultGate } from "@/components/dashboard/admin-vault-gate";

export default async function DashboardPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  // Convert AuthUser to Profile type expected by components
  const profile = {
    id: user.id,
    email: user.email || "",
    full_name: user.full_name || "User",
    avatar_url: user.avatar_url,
    role: user.role,
    department: null,
    phone: null,
    bio: null,
    start_date: null,
    end_date: null,
    total_points: 0,
    current_streak: 0,
    longest_streak: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    online_status: "online" as const,
    last_seen_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    is_typing_to: null,
    auth_provider: "email",
  };

  if (user.role === "admin") {
    // Fetch real stats for admin
    const { count: internCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "intern");

    const { count: completedTasksCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    const { count: pendingTasksCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .neq("status", "completed");

    // Fetch actual pending reports
    const { data: pendingReports } = await supabase
      .from("daily_reports")
      .select("*, user:profiles(full_name, avatar_url), tasks:report_tasks(*)")
      .eq("status", "submitted") // Assuming "submitted" means pending review
      .order("created_at", { ascending: false });

    // Fetch recent activity
    const { data: recentActivityData } = await supabase
      .from("activity_logs")
      .select("*, user:profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentActivity = (recentActivityData || []) as unknown as ActivityLog[];

    // Map the fetched reports to match DailyReport type
    const typedReports = (pendingReports || []) as unknown as DailyReport[];

    // VAULT GATE SECURITY CHECK
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const isVaultUnlocked = cookieStore.get("admin_vault_session")?.value === "unlocked";
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "agbojoshua2005@gmail.com";

    // Strict Email Enforcement (Double Check)
    if (user.email !== ADMIN_EMAIL) {
      // Ideally redirect or show 403, but standard InternDashboard is safer fallback if role was somehow admin
      // But if they have role=admin but wrong email, we block.
      return (
        <div className="flex items-center justify-center h-screen text-red-500 font-bold">
          CRITICAL SECURITY ALERT: UNAUTHORIZED ADMIN EMAIL
        </div>
      );
    }

    if (!isVaultUnlocked) {
      return <AdminVaultGate />;
    }

    return (
      <AdminDashboard
        totalInterns={internCount || 0}
        pendingReports={typedReports}
        completedTasks={completedTasksCount || 0}
        pendingTasks={pendingTasksCount || 0}
        recentActivity={recentActivity}
      />
    );
  } else {
    // Intern view - Fetch Data
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", user.id)
      .order("due_date", { ascending: true });

    const { data: reports } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Calculate stats
    const typedTasks = (tasks || []) as unknown as Task[];
    const typedReports = (reports || []) as unknown as DailyReport[];

    const completedTasks = typedTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = typedTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

    // Check overdue
    const now = new Date();
    const overdueTasks = typedTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length;

    // Mock Messages/Notifications for now as tables might not exist or need complex query
    const unreadMessages = 0;
    const notifications: Notification[] = [];

    return (
      <InternDashboard
        profile={profile}
        tasks={typedTasks}
        reports={typedReports}
        completedTasks={completedTasks}
        pendingTasks={pendingTasks}
        overdueTasks={overdueTasks}
        unreadMessages={unreadMessages}
        notifications={notifications}
      />
    );
  }
}
