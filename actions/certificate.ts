"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { publishGlobalUpdate } from "@/lib/ably-server";
import { sendCertificateNotification, notifyAdminOfCertificate } from "./lms-notifications";
import type { CourseCertificate } from "@/lib/types";

// =============================================
// CERTIFICATE MANAGEMENT
// =============================================

/**
 * Generate a certificate for a user
 */
export async function generateCertificate(userId: string, courseId: string, overrideData?: {
    intern_name?: string;
    admin_signature?: string;
}) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        // Check if certificate already exists
        const { data: existing } = await supabase
            .from("course_certificates")
            .select("*")
            .eq("user_id", userId)
            .eq("course_id", courseId)
            .single();

        if (existing) {
            return { success: false, error: "Certificate already exists for this user" };
        }

        // Get user and course info
        const [{ data: intern }, { data: course }, { data: timeStats }] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", userId).single(),
            supabase.from("courses").select("*").eq("id", courseId).single(),
            supabase.from("lesson_time_tracking").select("total_active_seconds").eq("user_id", userId).eq("course_id", courseId)
        ]);

        if (!intern || !course) {
            return { success: false, error: "User or course not found" };
        }

        const totalTime = timeStats?.reduce((sum, t) => sum + t.total_active_seconds, 0) || 0;

        // Get quiz scores
        const { data: attempts } = await supabase
            .from("quiz_attempts")
            .select("score_percentage")
            .eq("user_id", userId)
            .eq("passed", true);

        const avgScore = attempts && attempts.length > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.score_percentage, 0) / attempts.length * 100) / 100
            : null;

        // Generate unique certificate ID
        const year = new Date().getFullYear();
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const certificateId = `CERT-${year}-${randomPart}`;

        const internName = overrideData?.intern_name ||
            intern.full_name ||
            [intern.first_name, intern.last_name].filter(Boolean).join(" ") ||
            "Intern";

        // Create certificate record
        const { data: certificate, error } = await supabase
            .from("course_certificates")
            .insert({
                certificate_id: certificateId,
                user_id: userId,
                course_id: courseId,
                intern_name: internName,
                course_title: course.title,
                completion_date: new Date().toISOString().split("T")[0],
                final_score: avgScore,
                total_time_spent_seconds: totalTime,
                template_used: "default",
                verification_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificateId}`,
                is_valid: true,
                issued_by: user.id,
                admin_signature: overrideData?.admin_signature || user.full_name || "Administrator"
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating certificate:", error);
            return { success: false, error: "Failed to create certificate" };
        }

        // Send notifications
        await Promise.all([
            sendCertificateNotification(userId, course.title, certificateId, certificate.id),
            notifyAdminOfCertificate(internName, course.title, certificate.id)
        ]);

        // Broadcast
        await publishGlobalUpdate("certificate-issued", {
            userId,
            courseId,
            certificateId
        });

        revalidatePath("/dashboard/classroom");
        revalidatePath("/dashboard/certificates");

        return { success: true, certificate };
    } catch (error: any) {
        console.error("Error in generateCertificate:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all certificates for a user
 */
export async function getUserCertificates(userId?: string) {
    try {
        const user = await getAuthUser();
        const targetUserId = userId && user.role === "admin" ? userId : user.id;

        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from("course_certificates")
            .select(`
                *,
                courses (title, thumbnail_url)
            `)
            .eq("user_id", targetUserId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching certificates:", error);
            return { success: false, error: "Failed to fetch certificates" };
        }

        return { success: true, certificates: data };
    } catch (error: any) {
        console.error("Error in getUserCertificates:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Verify a certificate by ID
 */
export async function verifyCertificate(certificateId: string) {
    try {
        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from("course_certificates")
            .select(`
                *,
                courses (title, description, thumbnail_url),
                profiles!course_certificates_user_id_fkey (full_name, avatar_url)
            `)
            .eq("certificate_id", certificateId)
            .single();

        if (error || !data) {
            return { success: false, error: "Certificate not found" };
        }

        return {
            success: true,
            certificate: data,
            isValid: data.is_valid && !data.revoked_at
        };
    } catch (error: any) {
        console.error("Error in verifyCertificate:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Revoke a certificate
 */
export async function revokeCertificate(certificateId: string, reason: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("course_certificates")
            .update({
                is_valid: false,
                revoked_at: new Date().toISOString(),
                revoked_reason: reason
            })
            .eq("certificate_id", certificateId);

        if (error) {
            console.error("Error revoking certificate:", error);
            return { success: false, error: "Failed to revoke certificate" };
        }

        revalidatePath("/dashboard/certificates");

        return { success: true };
    } catch (error: any) {
        console.error("Error in revokeCertificate:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all certificates (admin)
 */
export async function getAllCertificates() {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        const { data, error } = await supabase
            .from("course_certificates")
            .select(`
                *,
                courses (title),
                profiles!course_certificates_user_id_fkey (full_name, email, avatar_url)
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching all certificates:", error);
            return { success: false, error: "Failed to fetch certificates" };
        }

        return { success: true, certificates: data };
    } catch (error: any) {
        console.error("Error in getAllCertificates:", error);
        return { success: false, error: error.message };
    }
}
