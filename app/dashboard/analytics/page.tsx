import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminAnalytics } from "@/components/analytics/admin-analytics";

export const metadata = {
  title: "Analytics",
};

export default async function AnalyticsPage() {
  // Use Clerk auth
  const user = await getAuthUser();
  const supabase = await createClient();

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Access restricted to administrators.</p>
      </div>
    );
  }

  // Get all interns
  const { data: interns } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "intern")
    .order("total_points", { ascending: false });

  // Get all tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assigned_to_fkey(full_name)")
    .order("created_at", { ascending: false });

  // Get all reports from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: reports } = await supabase
    .from("daily_reports")
    .select("*, user:profiles!daily_reports_user_id_fkey(full_name)")
    .gte("report_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("report_date", { ascending: false });

  // Get performance scores
  const { data: performanceScores } = await supabase
    .from("performance_scores")
    .select("*, user:profiles!performance_scores_user_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of intern performance and program metrics
        </p>
      </div>

      <AdminAnalytics
        interns={interns || []}
        tasks={tasks || []}
        reports={reports || []}
        performanceScores={performanceScores || []}
      />
    </div>
  );
}
