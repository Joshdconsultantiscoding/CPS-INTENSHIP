"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

// =============================================
// LMS EMAIL NOTIFICATIONS
// =============================================

interface EmailData {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    templateType: "certificate_issued" | "course_completed" | "quiz_passed" | "quiz_failed";
    data: Record<string, any>;
}

/**
 * Send email notification (stores in notifications table for now)
 * In production, integrate with email service like Resend, SendGrid, etc.
 */
async function sendEmailNotification(emailData: EmailData) {
    const supabase = await createAdminClient();

    // Store notification in database
    const { error } = await supabase.from("notifications").insert({
        user_id: emailData.data.userId,
        title: emailData.subject,
        message: getEmailMessage(emailData),
        notification_type: emailData.templateType.includes("passed") || emailData.templateType.includes("completed")
            ? "success"
            : emailData.templateType.includes("failed")
                ? "warning"
                : "info",
        reference_type: emailData.templateType.includes("certificate") ? "certificate" : "course",
        reference_id: emailData.data.referenceId
    });

    if (error) {
        console.error("Error storing notification:", error);
    }

    // TODO: Integrate with email service
    // Example with Resend:
    // await resend.emails.send({
    //     from: 'Cospronos Media <no-reply@cospronos.com>',
    //     to: emailData.recipientEmail,
    //     subject: emailData.subject,
    //     html: generateEmailHtml(emailData)
    // });

    return { success: true };
}

function getEmailMessage(emailData: EmailData): string {
    switch (emailData.templateType) {
        case "certificate_issued":
            return `Congratulations! Your certificate for "${emailData.data.courseTitle}" has been issued. Certificate #${emailData.data.certificateNumber}. You can view and download it from your dashboard.`;
        case "course_completed":
            return `Great job! You have completed "${emailData.data.courseTitle}". Your certificate is being generated.`;
        case "quiz_passed":
            return `Excellent! You passed "${emailData.data.quizTitle}" with a score of ${emailData.data.score}%.`;
        case "quiz_failed":
            return `You scored ${emailData.data.score}% on "${emailData.data.quizTitle}". The passing score is ${emailData.data.passingScore}%. Please review the material and try again.`;
        default:
            return "You have a new notification from Cospronos Media LMS.";
    }
}

/**
 * Send certificate issued notification
 */
export async function sendCertificateNotification(
    userId: string,
    courseTitle: string,
    certificateNumber: string,
    certificateId: string
) {
    const supabase = await createAdminClient();

    // Get user info
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

    if (!profile) return { success: false, error: "User not found" };

    await sendEmailNotification({
        recipientEmail: profile.email || "",
        recipientName: profile.full_name || "Learner",
        subject: `🎉 Certificate Issued: ${courseTitle}`,
        templateType: "certificate_issued",
        data: {
            userId,
            courseTitle,
            certificateNumber,
            referenceId: certificateId
        }
    });

    return { success: true };
}

/**
 * Send course completed notification
 */
export async function sendCourseCompletedNotification(
    userId: string,
    courseId: string,
    courseTitle: string
) {
    const supabase = await createAdminClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

    if (!profile) return { success: false, error: "User not found" };

    await sendEmailNotification({
        recipientEmail: profile.email || "",
        recipientName: profile.full_name || "Learner",
        subject: `✅ Course Completed: ${courseTitle}`,
        templateType: "course_completed",
        data: {
            userId,
            courseTitle,
            referenceId: courseId
        }
    });

    return { success: true };
}

/**
 * Send quiz result notification
 */
export async function sendQuizResultNotification(
    userId: string,
    quizTitle: string,
    score: number,
    passed: boolean,
    passingScore: number,
    quizId: string
) {
    const supabase = await createAdminClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

    if (!profile) return { success: false, error: "User not found" };

    await sendEmailNotification({
        recipientEmail: profile.email || "",
        recipientName: profile.full_name || "Learner",
        subject: passed
            ? `🎯 Quiz Passed: ${quizTitle}`
            : `📝 Quiz Results: ${quizTitle}`,
        templateType: passed ? "quiz_passed" : "quiz_failed",
        data: {
            userId,
            quizTitle,
            score,
            passingScore,
            referenceId: quizId
        }
    });

    return { success: true };
}

/**
 * Notify admin of new certificate
 */
export async function notifyAdminOfCertificate(
    internName: string,
    courseTitle: string,
    certificateId: string
) {
    const supabase = await createAdminClient();

    // Get admin users
    const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

    if (!admins || admins.length === 0) return { success: false };

    // Notify all admins
    const notifications = admins.map(admin => ({
        user_id: admin.id,
        title: "New Certificate Issued",
        message: `${internName} has earned a certificate for completing "${courseTitle}".`,
        notification_type: "info",
        reference_type: "certificate",
        reference_id: certificateId
    }));

    await supabase.from("notifications").insert(notifications);

    return { success: true };
}
