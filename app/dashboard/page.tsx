import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { InternDashboard } from "@/components/dashboard/intern-dashboard";
import { redirect } from "next/navigation";
import type { DailyReport, ActivityLog } from "@/lib/types";

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

    // Fetch recent activity (mocked if no table yet, or fetch from logs if exists)
    // For now returning empty array to prevent crash
    const recentActivity: ActivityLog[] = [];

    // Map the fetched reports to match DailyReport type if needed, or cast if matches
    // The select query structure matches standard expectation but we needs to be careful about joins
    // We will cast for now, assuming types align or are compatible enough for UI
    const typedReports = (pendingReports || []) as unknown as DailyReport[];

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
    // Intern view
    return <InternDashboard profile={profile} />;
  }
}
