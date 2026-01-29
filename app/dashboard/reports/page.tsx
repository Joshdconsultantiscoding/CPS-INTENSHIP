import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ReportList } from "@/components/reports/report-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Daily Reports",
};

export default async function ReportsPage() {
  // Use Clerk auth
  const user = await getAuthUser();
  const supabase = await createClient();

  const isAdmin = user.role === "admin";

  // Get reports based on role
  let reportsQuery = supabase
    .from("daily_reports")
    .select("*, user:profiles!daily_reports_user_id_fkey(*), reviewer:profiles!daily_reports_reviewed_by_fkey(*)")
    .order("report_date", { ascending: false });

  if (!isAdmin) {
    reportsQuery = reportsQuery.eq("user_id", user.id);
  }

  const { data: reports } = await reportsQuery;

  // Check if today's report exists (for interns)
  const today = new Date().toISOString().split("T")[0];
  const todayReport = reports?.find((r) => r.report_date === today);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Reports</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Review and provide feedback on intern daily reports"
              : "Submit and track your daily work reports"}
          </p>
        </div>
        {!isAdmin && !todayReport && (
          <Button asChild>
            <Link href="/dashboard/reports/new">
              <Plus className="mr-2 h-4 w-4" />
              Submit Today's Report
            </Link>
          </Button>
        )}
      </div>

      <ReportList reports={reports || []} isAdmin={isAdmin} userId={user.id} />
    </div>
  );
}
