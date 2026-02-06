"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications/notification-service";
import { config } from "@/lib/config";

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

        // 3. Handle Streak logic if submitted
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

            // 4. Notify Admins if submitted
            const { data: admins } = await supabase
                .from("profiles")
                .select("id")
                .eq("role", "admin");

            if (admins) {
                const adminIds = admins.map(a => a.id);
                const { data: sender } = await supabase.from("profiles").select("full_name, email").eq("id", data.user_id).single();
                const senderName = sender?.full_name || sender?.email || "An intern";

                // Notify all admins in parallel
                await Promise.all(adminIds.map(adminId =>
                    createNotification({
                        userId: adminId,
                        title: "New Report Submitted",
                        message: `${senderName} submitted their daily report for ${new Date(data.report_date).toLocaleDateString()}`,
                        type: "report",
                        link: `/dashboard/reports`,
                        priority: 'normal',
                        metadata: { reportId: report.id, internId: data.user_id }
                    }).catch(err => console.error(`Admin notification failed for ${adminId}:`, err))
                ));
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

        // 2. Notify the intern using the new service
        await createNotification({
            userId: data.internId,
            title: "Daily Report Reviewed",
            message: `Your daily report for ${new Date(data.reportDate).toLocaleDateString()} has been reviewed. Rating: ${data.rating}/5 stars.`,
            type: "report",
            link: `/dashboard/reports`,
            priority: data.rating >= 4 ? 'high' : 'normal',
            sound: data.rating >= 4 ? 'success' : 'notification',
            metadata: { reportId: data.reportId, rating: data.rating }
        });

        revalidatePath("/dashboard/reports");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error: any) {
        console.error("Server Action Error (reviewDailyReport):", error);
        return { success: false, error: error.message };
    }
}
