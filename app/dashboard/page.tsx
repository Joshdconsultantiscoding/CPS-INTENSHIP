import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { InternDashboard } from "@/components/dashboard/intern-dashboard";
import { redirect } from "next/navigation";
import type { DailyReport, ActivityLog, Task, Notification, CalendarEvent } from "@/lib/types";
import { AdminVaultGate } from "@/components/dashboard/admin-vault-gate";
import { config } from "@/lib/config";

export default async function DashboardPage() {
  const user = await getAuthUser();
  const supabase = await createAdminClient(); // Use admin client to bypass RLS

  // Convert AuthUser to Profile type expected by components
  const profile = {
    id: user.id,
    email: user.email || "",
    full_name: user.full_name || "User",
    first_name: user.full_name?.split(" ")[0] || "User",
    last_name: user.full_name?.split(" ")[1] || "",
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
    const now = new Date().toISOString();
    // Fetch all admin data in parallel to eliminate waterfalls
    const [
      { count: internCount },
      { count: completedTasksCount },
      { count: inProgressTasksCount },
      { count: todoTasksCount },
      { data: pendingReports },
      { data: recentActivityData },
      { data: eventsData }
    ] = (await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "intern"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("daily_reports").select("id, status, created_at, user_id, user:profiles(full_name, avatar_url), tasks:report_tasks(id, title, status)").eq("status", "submitted").order("created_at", { ascending: false }),
      supabase.from("activity_logs").select("id, action, created_at, metadata, user:profiles(full_name, avatar_url)").order("created_at", { ascending: false }).limit(5),
      supabase.from("calendar_events").select("id, title, start_time, end_time, event_type").gte("start_time", now).order("start_time", { ascending: true }).limit(5)
    ])) as any[];

    const recentActivity = (recentActivityData || []) as unknown as ActivityLog[];
    const events = (eventsData || []) as unknown as CalendarEvent[];

    // Map the fetched reports to match DailyReport type
    const typedReports = (pendingReports || []) as unknown as DailyReport[];

    // VAULT GATE SECURITY CHECK
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const isVaultUnlocked = cookieStore.get("admin_vault_session")?.value === "unlocked";
    const ADMIN_EMAIL = config.adminEmail;

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
        inProgressTasks={inProgressTasksCount || 0}
        pendingTasks={todoTasksCount || 0}
        recentActivity={recentActivity}
        events={events}
      />
    );
  } else {
    const nowIso = new Date().toISOString();
    // Intern view - Fetch Data in parallel
    const [
      { data: tasks },
      { data: reports },
      { data: eventsData },
      { data: notificationsData },
      { count: unreadMessagesCount }
    ] = (await Promise.all([
      supabase.from("tasks").select("*").eq("assigned_to", user.id).order("due_date", { ascending: true }),
      supabase.from("daily_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("calendar_events").select("*").or(`is_public.eq.true,user_id.eq.${user.id},attendees.cs.{${user.id}}`).gte("start_time", nowIso).order("start_time", { ascending: true }).limit(5),
      supabase.from("notifications").select("*").or(`user_id.eq.${user.id},target_type.eq.ALL`).order("created_at", { ascending: false }).limit(20),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("is_read", false)
    ])) as any[];

    // Calculate stats
    const typedTasks = (tasks || []) as unknown as Task[];
    const typedReports = (reports || []) as unknown as DailyReport[];
    const events = (eventsData || []) as unknown as CalendarEvent[];
    const notifications = (notificationsData || []) as unknown as Notification[];
    const unreadMessages = unreadMessagesCount || 0;

    const completedTasks = typedTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = typedTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

    // Check overdue
    const now = new Date();
    const overdueTasks = typedTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'completed').length;


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
        events={events}
      />
    );
  }
}
