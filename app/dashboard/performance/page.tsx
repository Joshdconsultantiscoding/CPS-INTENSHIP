import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PerformanceOverview } from "@/components/performance/performance-overview";

export const metadata = {
  title: "Performance",
};

export default async function PerformancePage() {
  // Use Clerk auth
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get performance scores
  const { data: scores } = await supabase
    .from("performance_scores")
    .select("*, scorer:profiles!performance_scores_scored_by_fkey(*)")
    .eq("user_id", user.id)
    .order("period_start", { ascending: false })
    .limit(12);

  // Get task stats
  const { data: tasks } = await supabase
    .from("tasks")
    .select("status, completed_at, created_at, points")
    .eq("assigned_to", user.id);

  // Get report stats - select all fields needed for charts
  const { data: reports } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("report_date", { ascending: false })
    .limit(30);

  const completedTasks = tasks?.filter((t) => t.status === "completed").length || 0;
  const totalTasks = tasks?.length || 0;
  const totalPoints = tasks
    ?.filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.points || 0), 0) || 0;

  const submittedReports = reports?.filter((r) => r.status === "submitted" || r.status === "reviewed").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Performance</h1>
        <p className="text-muted-foreground">
          Track your progress, achievements, and growth metrics
        </p>
      </div>

      <PerformanceOverview
        profile={profile}
        scores={scores || []}
        tasks={tasks || []}
        reports={reports || []}
        completedTasks={completedTasks}
        totalTasks={totalTasks}
        totalPoints={totalPoints}
        submittedReports={submittedReports}
        userId={user.id}
      />
    </div>
  );
}
