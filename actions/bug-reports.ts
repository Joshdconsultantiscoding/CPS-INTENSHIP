"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Helper to verify Admin access
async function verifyAdmin() {
    const user = await getAuthUser();
    if (user.role !== "admin") {
        throw new Error("Forbidden: Admin access required");
    }
    const supabase = await createAdminClient();
    return { userId: user.id, supabase };
}

// Action for interns to submit a report
export async function submitBugReport(report: {
    description: string;
    screenshot_urls: string[];
}) {
    const user = await getAuthUser();
    const supabase = await createAdminClient();

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

    if (reportError) throw reportError;

    // 2. Fetch all admins to notify them
    // We use admin client to fetch all profiles even if they are not visible to current user
    const adminSupabase = await createAdminClient();
    const { data: admins } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

    if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
            user_id: admin.id,
            title: "New Bug Report 🐛",
            message: `A site feedback report has been submitted by an intern.`,
            notification_type: 'warning',
            reference_type: 'bug_report',
            reference_id: bugReport.id
        }));

        await adminSupabase.from("notifications").insert(notifications);
    }

    revalidatePath("/dashboard/admin/bug-reports");
    return { success: true };
}

// Action for admins to fetch all reports
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

// Action for admins to update status
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
