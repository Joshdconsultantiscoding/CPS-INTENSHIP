"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import type { Profile, Task, DailyReport, PerformanceScore } from "@/lib/types";

/**
 * Fetches real-time performance data for an individual intern.
 */
export async function getInternPerformanceData(userId: string) {
    const supabase = await createAdminClient();

    const [profileRes, scoresRes, tasksRes, reportsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
            .from("performance_scores")
            .select("*, scorer:profiles!performance_scores_scored_by_fkey(*)")
            .eq("user_id", userId)
            .order("period_start", { ascending: false })
            .limit(12),
        supabase
            .from("tasks")
            .select("status, completed_at, created_at, points")
            .eq("assigned_to", userId),
        supabase
            .from("daily_reports")
            .select("id, report_date, status, mood, hours_worked")
            .eq("user_id", userId)
            .order("report_date", { ascending: false })
            .limit(30),
    ]);

    const profile = profileRes.data as Profile | null;
    const scores = (scoresRes.data || []) as PerformanceScore[];
    const tasks = (tasksRes.data || []) as { status: string; completed_at: string | null; created_at: string; points: number }[];
    const reports = (reportsRes.data || []) as DailyReport[];

    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const totalTasks = tasks.length;
    const totalPoints = tasks
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + (t.points || 0), 0);
    const submittedReports = reports.filter((r) => r.status === "submitted" || r.status === "reviewed").length;

    return {
        profile,
        scores,
        tasks,
        reports,
        completedTasks,
        totalTasks,
        totalPoints,
        submittedReports,
    };
}

/**
 * Fetches real-time analytics data for the admin dashboard.
 */
export async function getAdminAnalyticsData() {
    const user = await getAuthUser();
    if (user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const supabase = await createAdminClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [internsRes, tasksRes, reportsRes, performanceScoresRes] = await Promise.all([
        supabase
            .from("profiles")
            .select("*")
            .eq("role", "intern")
            .order("total_points", { ascending: false }),
        supabase
            .from("tasks")
            .select("*, assignee:profiles!tasks_assigned_to_fkey(full_name)")
            .order("created_at", { ascending: false }),
        supabase
            .from("daily_reports")
            .select("*, user:profiles!daily_reports_user_id_fkey(full_name)")
            .gte("report_date", thirtyDaysAgo.toISOString().split("T")[0])
            .order("report_date", { ascending: false }),
        supabase
            .from("performance_scores")
            .select("*, user:profiles!performance_scores_user_id_fkey(full_name)")
            .order("created_at", { ascending: false })
            .limit(50),
    ]);

    return {
        interns: (internsRes.data || []) as Profile[],
        tasks: (tasksRes.data || []) as (Task & { assignee?: { full_name: string | null } })[],
        reports: (reportsRes.data || []) as (DailyReport & { user?: { full_name: string | null } })[],
        performanceScores: (performanceScoresRes.data || []) as (PerformanceScore & { user?: { full_name: string | null } })[],
    };
}
