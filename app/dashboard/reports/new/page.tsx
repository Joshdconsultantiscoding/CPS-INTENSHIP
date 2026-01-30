import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportForm } from "@/components/reports/report-form";

export const metadata = {
  title: "Submit Daily Report",
};

export default async function NewReportPage() {
  const user = await getAuthUser();
  const supabase = await createClient();

  // Get user's tasks for selection
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status")
    .eq("assigned_to", user.id)
    .in("status", ["pending", "in_progress", "completed"]);

  // Check if today's report already exists
  const today = new Date().toISOString().split("T")[0];
  const { data: existingReport } = await supabase
    .from("daily_reports")
    .select("id")
    .eq("user_id", user.id)
    .eq("report_date", today)
    .single();

  if (existingReport) {
    redirect("/dashboard/reports");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit Daily Report</h1>
        <p className="text-muted-foreground">
          Share your progress, learnings, and any blockers from today.
        </p>
      </div>

      <ReportForm userId={user.id} tasks={tasks || []} />
    </div>
  );
}
