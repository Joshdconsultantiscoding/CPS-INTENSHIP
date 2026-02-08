"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { publishGlobalUpdate } from "@/lib/ably-server";
import { getLessonWithProgress } from "@/actions/lms-progress";

// =============================================
// LESSON TIME TRACKING
// =============================================

/**
 * Start tracking time for a lesson
 */
export async function startLessonTracking(lessonId: string, courseId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        if (!lessonId || !courseId) {
            console.error(`[startLessonTracking] Missing IDs: lessonId=${lessonId}, courseId=${courseId}`);
            return { success: false, error: "Invalid lesson or course identification" };
        }

        // Relaxed UUID validation regex (allows any UUID v1-v5)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(lessonId) || !uuidRegex.test(courseId)) {
            console.error(`[startLessonTracking] Invalid UUID format: lessonId="${lessonId}", courseId="${courseId}"`);
            return { success: false, error: "Invalid ID format" };
        }

        const now = new Date().toISOString();

        // Upsert time tracking record
        console.log(`[startLessonTracking] UPSERT: user=${user.id} lesson=${lessonId} course=${courseId}`);
        const { data, error } = await supabase
            .from("lesson_time_tracking")
            .upsert({
                user_id: user.id,
                lesson_id: lessonId,
                course_id: courseId,
                first_accessed_at: now,
                last_accessed_at: now,
                current_session_start: now,
                is_paused: false
            }, {
                onConflict: "user_id,lesson_id",
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error("[startLessonTracking] Database error:", JSON.stringify(error, null, 2));
            return { success: false, error: error.message || "Failed to start tracking" };
        }

        const trackingData = data && data.length > 0 ? data[0] : null;
        console.log(`[startLessonTracking] SUCCESS: lesson=${lessonId}, tracking_id=${trackingData?.id}`);
        return { success: true, tracking: trackingData };
    } catch (error: any) {
        console.error("CRITICAL ERROR in startLessonTracking:", error);
        return { success: false, error: error.message || "Internal server error" };
    }
}

/**
 * Pause time tracking (on tab blur, idle, etc.)
 */
export async function pauseLessonTracking(
    lessonId: string,
    reason: "tab_blur" | "idle" | "manual" = "manual"
) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // Get current tracking
        const { data: tracking } = await supabase
            .from("lesson_time_tracking")
            .select("*")
            .eq("user_id", user.id)
            .eq("lesson_id", lessonId)
            .single();

        if (!tracking || tracking.is_paused) {
            return { success: true }; // Already paused or not tracking
        }

        // Calculate time since session start
        const sessionStart = new Date(tracking.current_session_start).getTime();
        const now = Date.now();
        const sessionSeconds = Math.floor((now - sessionStart) / 1000);

        // Update tracking
        const { error } = await supabase
            .from("lesson_time_tracking")
            .update({
                is_paused: true,
                pause_reason: reason,
                total_active_seconds: tracking.total_active_seconds + sessionSeconds,
                last_accessed_at: new Date().toISOString()
            })
            .eq("user_id", user.id)
            .eq("lesson_id", lessonId);

        if (error) {
            console.error("Error pausing tracking:", error);
            return { success: false, error: "Failed to pause tracking" };
        }

        return { success: true, addedSeconds: sessionSeconds };
    } catch (error: any) {
        console.error("Error in pauseLessonTracking:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Resume time tracking
 */
export async function resumeLessonTracking(lessonId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const now = new Date().toISOString();

        const { error } = await supabase
            .from("lesson_time_tracking")
            .update({
                is_paused: false,
                pause_reason: null,
                current_session_start: now,
                last_accessed_at: now
            })
            .eq("user_id", user.id)
            .eq("lesson_id", lessonId);

        if (error) {
            console.error("Error resuming tracking:", error);
            return { success: false, error: "Failed to resume tracking" };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error in resumeLessonTracking:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Update progress percentage (video position, scroll, etc.)
 */
export async function updateLessonProgress(
    lessonId: string,
    progress: {
        video_watched_seconds?: number;
        content_scroll_percentage?: number;
        completion_percentage?: number;
    }
) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const updates: any = {
            last_accessed_at: new Date().toISOString()
        };

        if (progress.video_watched_seconds !== undefined) {
            updates.video_watched_seconds = progress.video_watched_seconds;
        }
        if (progress.content_scroll_percentage !== undefined) {
            updates.content_scroll_percentage = progress.content_scroll_percentage;
        }
        if (progress.completion_percentage !== undefined) {
            updates.completion_percentage = progress.completion_percentage;
        }

        const { error } = await supabase
            .from("lesson_time_tracking")
            .update(updates)
            .eq("user_id", user.id)
            .eq("lesson_id", lessonId);

        if (error) {
            console.error("Error updating progress:", error);
            return { success: false, error: "Failed to update progress" };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error in updateLessonProgress:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Mark lesson as complete
 * Checks required time and updates course progress
 */
export async function completeLessonTracking(lessonId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // 1. Security Check: Is the lesson locked?
        // We use the central logic from lms-progress to determine lock status
        try {
            const lessonWithStatus = await getLessonWithProgress(lessonId);
            if (lessonWithStatus.is_locked) {
                return {
                    success: false,
                    error: "You cannot complete a locked lesson. Please complete previous lessons first."
                };
            }
        } catch (error) {
            // If lesson not found or other error, let the underlying checks handle it or fail safe
            console.error("Error checking lock status:", error);
        }

        // Get lesson and tracking
        const [{ data: lesson }, { data: tracking }] = await Promise.all([
            supabase.from("course_lessons").select("*, course_modules(course_id)").eq("id", lessonId).single(),
            supabase.from("lesson_time_tracking").select("*").eq("user_id", user.id).eq("lesson_id", lessonId).single()
        ]);

        if (!lesson) {
            return { success: false, error: "Lesson not found" };
        }

        const courseId = lesson.course_modules?.course_id;

        // Get Course Settings
        const { data: course } = await supabase
            .from("courses")
            .select("*, course_settings(*)")
            .eq("id", courseId)
            .single();

        const settingsRaw = (course as any)?.course_settings;
        const settings = Array.isArray(settingsRaw) ? settingsRaw[0] : settingsRaw;

        // Calculate Required Time
        // Priority: Lesson override > Course Setting > Default
        const requiredTimePercentage = settings?.required_time_percentage || 0;
        let requiredTime = lesson.required_time_seconds || 0;

        console.log(`[completeLessonTracking] Checking time: lesson_required=${lesson.required_time_seconds}, course_pct=${requiredTimePercentage}, duration=${lesson.duration_minutes}`);

        // If lesson has no specific time set, but course has a percentage requirement
        if (requiredTime === 0 && lesson.duration_minutes > 0 && requiredTimePercentage > 0) {
            requiredTime = Math.ceil((lesson.duration_minutes * 60) * (requiredTimePercentage / 100));
        }

        const totalTime = tracking?.total_active_seconds || 0;
        console.log(`[completeLessonTracking] Result: required=${requiredTime}, actual=${totalTime}`);

        // Strict Check
        if (requiredTime > 0 && totalTime < requiredTime && !lesson.allow_skip) {
            const remainingSeconds = requiredTime - totalTime;
            const remainingMinutes = Math.ceil(remainingSeconds / 60);

            // If less than a minute, show seconds
            const timeString = remainingSeconds > 60 ? `${remainingMinutes} more minutes` : `${remainingSeconds} more seconds`;

            return {
                success: false,
                error: `You need to spend at least ${timeString} on this lesson to complete it. (Goal: ${Math.ceil(requiredTime / 60)}m)`
            };
        }

        const now = new Date().toISOString();

        // Update time tracking
        await supabase
            .from("lesson_time_tracking")
            .update({
                completed: true,
                completed_at: now,
                completion_percentage: 100
            })
            .eq("user_id", user.id)
            .eq("lesson_id", lessonId);

        // Update course progress
        await supabase
            .from("course_progress")
            .upsert({
                user_id: user.id,
                lesson_id: lessonId,
                course_id: courseId,
                status: "completed",
                completed_at: now,
                time_spent_seconds: totalTime
            }, { onConflict: "user_id,lesson_id" });

        // Check for course completion
        await checkCourseCompletion(user.id, courseId);

        // Broadcast update
        await publishGlobalUpdate("lesson-completed", {
            userId: user.id,
            lessonId,
            courseId
        });

        revalidatePath("/dashboard/classroom");

        return { success: true };
    } catch (error: any) {
        console.error("Error in completeLessonTracking:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Sync active time (batch update from client)
 */
export async function syncActiveTime(
    lessonId: string,
    additionalSeconds: number,
    idleSeconds: number = 0
) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const { data: tracking } = await supabase
            .from("lesson_time_tracking")
            .select("*")
            .eq("user_id", user.id)
            .eq("lesson_id", lessonId)
            .single();

        if (!tracking) {
            return { success: false, error: "Tracking not found" };
        }

        const { error } = await supabase
            .from("lesson_time_tracking")
            .update({
                total_active_seconds: tracking.total_active_seconds + additionalSeconds,
                total_idle_seconds: tracking.total_idle_seconds + idleSeconds,
                last_accessed_at: new Date().toISOString()
            })
            .eq("user_id", user.id)
            .eq("lesson_id", lessonId);

        if (error) {
            console.error("Error syncing time:", error);
            return { success: false, error: "Failed to sync time" };
        }

        return { success: true, total: tracking.total_active_seconds + additionalSeconds };
    } catch (error: any) {
        console.error("Error in syncActiveTime:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get time stats for a course
 */
export async function getCourseTimeStats(courseId: string, userId?: string) {
    try {
        const user = await getAuthUser();
        const targetUserId = userId && user.role === "admin" ? userId : user.id;
        const supabase = await createAdminClient();

        const { data: tracking, error } = await supabase
            .from("lesson_time_tracking")
            .select("*, course_lessons(title, duration_minutes)")
            .eq("course_id", courseId)
            .eq("user_id", targetUserId);

        if (error) {
            console.error("Error fetching time stats:", error);
            return { success: false, error: "Failed to fetch stats" };
        }

        const totalActiveSeconds = tracking?.reduce((sum, t) => sum + t.total_active_seconds, 0) || 0;
        const totalIdleSeconds = tracking?.reduce((sum, t) => sum + t.total_idle_seconds, 0) || 0;
        const completedLessons = tracking?.filter(t => t.completed).length || 0;
        const totalLessons = tracking?.length || 0;

        return {
            success: true,
            stats: {
                totalActiveSeconds,
                totalActiveMinutes: Math.round(totalActiveSeconds / 60),
                totalIdleSeconds,
                completedLessons,
                totalLessons,
                progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
                lessonStats: tracking
            }
        };
    } catch (error: any) {
        console.error("Error in getCourseTimeStats:", error);
        return { success: false, error: error.message };
    }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

async function checkCourseCompletion(userId: string, courseId: string) {
    const supabase = await createAdminClient();

    // Get all lessons in course
    const { data: modules } = await supabase
        .from("course_modules")
        .select("id, course_lessons(id)")
        .eq("course_id", courseId);

    const allLessons = modules?.flatMap(m => m.course_lessons?.map((l: any) => l.id) || []) || [];

    // Get completed lessons
    const { data: progress } = await supabase
        .from("course_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .eq("status", "completed");

    const completedLessons = progress?.map(p => p.lesson_id) || [];

    // Check if all lessons completed
    const allCompleted = allLessons.every(id => completedLessons.includes(id));

    if (allCompleted && allLessons.length > 0) {
        // Get course settings
        const { data: settings } = await supabase
            .from("course_settings")
            .select("*")
            .eq("course_id", courseId)
            .single();

        // Get course info
        const { data: course } = await supabase
            .from("courses")
            .select("*")
            .eq("id", courseId)
            .single();

        // Check if quiz required
        if (settings?.quiz_required_for_completion) {
            // Get quiz attempts
            const { data: quizzes } = await supabase
                .from("quizzes")
                .select("id")
                .eq("course_id", courseId);

            if (quizzes && quizzes.length > 0) {
                const { data: attempts } = await supabase
                    .from("quiz_attempts")
                    .select("quiz_id, passed")
                    .eq("user_id", userId)
                    .in("quiz_id", quizzes.map(q => q.id))
                    .eq("passed", true);

                const passedQuizzes = attempts?.map(a => a.quiz_id) || [];
                const allQuizzesPassed = quizzes.every(q => passedQuizzes.includes(q.id));

                if (!allQuizzesPassed) {
                    return; // Not all quizzes passed
                }
            }
        }

        // Issue certificate if enabled
        if (settings?.certificate_on_completion || course?.certificate_enabled) {
            await issueCertificate(userId, courseId);
        }
    }
}

async function issueCertificate(userId: string, courseId: string) {
    const supabase = await createAdminClient();

    // Check if certificate already exists
    const { data: existing } = await supabase
        .from("course_certificates")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

    if (existing) {
        return; // Already issued
    }

    // Get user and course info
    const [{ data: user }, { data: course }, { data: timeStats }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase.from("lesson_time_tracking").select("total_active_seconds").eq("user_id", userId).eq("course_id", courseId)
    ]);

    if (!user || !course) {
        return;
    }

    // Calculate total time and score
    const totalTime = timeStats?.reduce((sum, t) => sum + t.total_active_seconds, 0) || 0;

    // Get quiz scores
    const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("score_percentage")
        .eq("user_id", userId)
        .eq("passed", true);

    const avgScore = attempts && attempts.length > 0
        ? attempts.reduce((sum, a) => sum + a.score_percentage, 0) / attempts.length
        : null;

    // Generate certificate ID
    const year = new Date().getFullYear();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const certificateId = `CERT-${year}-${randomPart}`;

    // Create certificate
    await supabase
        .from("course_certificates")
        .insert({
            certificate_id: certificateId,
            user_id: userId,
            course_id: courseId,
            intern_name: user.full_name || `${user.first_name} ${user.last_name}`.trim() || "Intern",
            course_title: course.title,
            completion_date: new Date().toISOString().split("T")[0],
            final_score: avgScore,
            total_time_spent_seconds: totalTime,
            template_used: "default",
            verification_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificateId}`,
            is_valid: true
        });

    // Broadcast
    await publishGlobalUpdate("certificate-issued", {
        userId,
        courseId,
        certificateId
    });
}
