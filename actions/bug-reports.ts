"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/navigation";
import { createBulkNotifications } from "@/lib/notifications/notification-service";

/**
 * Helper to verify Admin access for protected actions
 */
async function verifyAdmin() {
    const user = await getAuthUser();
    if (user.role !== "admin") {
        throw new Error("Forbidden: Admin access required");
    }
    const supabase = await createAdminClient();
    return { userId: user.id, supabase };
}

/**
 * Action for interns (or any user) to submit a bug report/feedback
 */
export async function submitBugReport(report: {
    description: string;
    screenshot_urls: string[];
}) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        console.log(`[BugReport] User ${user.email} submitting report...`);

        // 1. Insert the report
        const { data: bugReport, error: reportError } = await supabase
            .from("bug_reports")
            .insert({
                user_id: user.id,
                description: report.description,
                screenshot_urls: report.screenshot_urls,
                status: 'pending'
            })
            .select()
            .single();

        if (reportError) {
            console.error("[BugReport] Database error:", reportError);
            throw new Error(`Failed to save report: ${reportError.message}`);
        }

        // 2. Fetch all admins to notify them
        const { data: admins, error: adminFetchError } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "admin");

        if (adminFetchError) {
            console.error("[BugReport] Error fetching admins for notification:", adminFetchError);
        }

        if (admins && admins.length > 0) {
            const adminIds = admins.map(admin => admin.id);

            try {
                await createBulkNotifications(adminIds, {
                    title: "New Bug Report 🐛",
                    message: `A new feedback report has been submitted by ${user.full_name || user.email}.`,
                    type: 'warning',
                    link: '/dashboard/admin/bug-reports',
                    priority: 'high',
                    metadata: {
                        reference_type: 'bug_report',
                        reference_id: bugReport.id
                    }
                });
            } catch (notifError) {
                console.error("[BugReport] Notification delivery failed:", notifError);
            }
        }

        revalidatePath("/dashboard/admin/bug-reports");
        return { success: true };
    } catch (error: any) {
        if (isRedirectError(error)) throw error;
        console.error("[BugReport] Unexpected error:", error);
        throw error;
    }
}

/**
 * Action for admins to fetch all reports
 */
export async function getBugReports() {
    const { supabase } = await verifyAdmin();

    const { data, error } = await supabase
        .from("bug_reports")
        .select(`
            *,
            profile:profiles(full_name, avatar_url, email)
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Action for admins to update report status
 */
export async function updateBugReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'fixed') {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase
        .from("bug_reports")
        .update({ status })
        .eq("id", reportId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/bug-reports");
    return { success: true };
}
