import { getAuthUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { InternManagement } from "@/components/interns/intern-management";

export const metadata = {
  title: "Intern Management",
};

export default async function InternsPage() {
  // Use Clerk auth instead of Supabase
  const user = await getAuthUser();
  const supabase = await createAdminClient(); // Use admin client to bypass RLS

  // Only admin can access this page
  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Access restricted to administrators.</p>
      </div>
    );
  }

  // Get all users with full profile data
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Get task stats - use correct column name 'assigned_to'
  const { data: tasks } = await supabase
    .from("tasks")
    .select("assigned_to, status, created_at, due_date");

  // Get report stats  
  const { data: reports } = await supabase
    .from("daily_reports")
    .select("user_id, status, created_at, productivity_rating");

  // Process stats per user
  const userStats: Record<string, {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalReports: number;
    approvedReports: number;
    pendingReports: number;
    avgProductivity: number;
  }> = {};

  const now = new Date();

  allUsers?.forEach((u) => {
    const userTasks = tasks?.filter((t) => t.assigned_to === u.id) || [];
    const userReports = reports?.filter((r) => r.user_id === u.id) || [];

    const productivityRatings = userReports
      .filter((r) => r.productivity_rating)
      .map((r) => r.productivity_rating);

    userStats[u.id] = {
      totalTasks: userTasks.length,
      completedTasks: userTasks.filter((t) => t.status === "completed").length,
      inProgressTasks: userTasks.filter((t) => t.status === "in_progress").length,
      pendingTasks: userTasks.filter((t) => t.status === "pending" || t.status === "todo").length,
      overdueTasks: userTasks.filter((t) =>
        t.due_date && new Date(t.due_date) < now && t.status !== "completed"
      ).length,
      totalReports: userReports.length,
      approvedReports: userReports.filter((r) => r.status === "reviewed").length,
      pendingReports: userReports.filter((r) => r.status === "submitted" || r.status === "draft").length,
      avgProductivity: productivityRatings.length > 0
        ? Math.round(productivityRatings.reduce((a, b) => a + b, 0) / productivityRatings.length)
        : 0,
    };
  });

  return (
    <InternManagement
      users={allUsers || []}
      userStats={userStats}
      currentUserId={user.id}
    />
  );
}
