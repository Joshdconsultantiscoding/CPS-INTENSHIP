"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function saveDailyReport(data: {
    id?: string | null;
    user_id: string;
    report_date: string;
    tasks_completed: string[];
    tasks_in_progress: string[];
    blockers: string | null;
    learnings: string | null;
    mood: string;
    hours_worked: number;
    status: "draft" | "submitted";
    submitted_at: string | null;
}) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId || clerkId !== data.user_id) {
            throw new Error("Unauthorized: User session mismatch");
        }

        const supabase = await createAdminClient();

        // 1. Prepare data (strip null ID for new inserts, add updated_at)
        const payload = {
            ...data,
            updated_at: new Date().toISOString()
        };
        if (!payload.id) {
            delete payload.id;
        }

        // 2. Upsert the report - use onConflict to handle existing reports for the same date
        const { data: report, error: reportError } = await supabase
            .from("daily_reports")
            .upsert(payload, {
                onConflict: "user_id,report_date",
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (reportError) {
            console.error("Report Save Error:", reportError);
            throw new Error(reportError.message);
        }

        // 2. Handle Streak logic if submitted
        if (data.status === "submitted") {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("current_streak, longest_streak")
                .eq("id", data.user_id)
                .single();

            if (profile && !profileError) {
                const newStreak = (profile.current_streak || 0) + 1;
                const longestStreak = Math.max(newStreak, profile.longest_streak || 0);

                await supabase
                    .from("profiles")
                    .update({
                        current_streak: newStreak,
                        longest_streak: longestStreak,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", data.user_id);
            }
        }

        revalidatePath("/dashboard/reports");
        revalidatePath("/dashboard");

        return { success: true, data: report };
    } catch (error: any) {
        console.error("Server Action Error (saveDailyReport):", error);
        return { success: false, error: error.message };
    }
}
export async function reviewDailyReport(data: {
    reportId: string;
    reviewerId: string;
    feedback: string;
    rating: number;
    internId: string;
    reportDate: string;
}) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId || clerkId !== data.reviewerId) {
            throw new Error("Unauthorized: Reviewer session mismatch");
        }

        const supabase = await createAdminClient();

        // 1. Update the report
        const { error: reportError } = await supabase
            .from("daily_reports")
            .update({
                admin_feedback: data.feedback,
                admin_rating: data.rating,
                status: "reviewed",
                reviewed_at: new Date().toISOString(),
                reviewed_by: data.reviewerId,
            })
            .eq("id", data.reportId);

        if (reportError) {
            console.error("Report Review Error:", reportError);
            throw new Error(reportError.message);
        }

        // 2. Notify the intern
        await supabase.from("notifications").insert({
            user_id: data.internId,
            title: "Report Reviewed",
            message: `Your daily report for ${new Date(data.reportDate).toLocaleDateString()} has been reviewed. Rating: ${data.rating}/5 stars.`,
            type: "report",
            reference_id: data.reportId,
            reference_type: "daily_report",
        });

        revalidatePath("/dashboard/reports");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error: any) {
        console.error("Server Action Error (reviewDailyReport):", error);
        return { success: false, error: error.message };
    }
}
