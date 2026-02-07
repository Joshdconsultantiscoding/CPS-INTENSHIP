"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

// =============================================
// LMS ANALYTICS SERVER ACTIONS
// =============================================

export interface LMSAnalytics {
    overview: {
        totalInterns: number;
        activeLearnersToday: number;
        totalCourses: number;
        totalQuizzes: number;
        certificatesIssued: number;
    };
    courseStats: Array<{
        courseId: string;
        courseTitle: string;
        enrolledCount: number;
        completedCount: number;
        avgTimeSpentMinutes: number;
        avgScore: number;
        passRate: number;
    }>;
    quizStats: {
        totalAttempts: number;
        avgScore: number;
        passRate: number;
        topQuizzes: Array<{
            quizId: string;
            quizTitle: string;
            attempts: number;
            avgScore: number;
            passRate: number;
        }>;
    };
    leaderboard: Array<{
        userId: string;
        fullName: string;
        avatarUrl: string | null;
        coursesCompleted: number;
        avgScore: number;
        totalTimeMinutes: number;
        certificatesEarned: number;
    }>;
    cheatingFlags: Array<{
        attemptId: string;
        userId: string;
        userName: string;
        quizTitle: string;
        tabSwitches: number;
        idleTimeSeconds: number;
        fullscreenExits: number;
        timestamp: string;
    }>;
    recentActivity: Array<{
        type: string;
        userId: string;
        userName: string;
        details: string;
        timestamp: string;
    }>;
}

/**
 * Get comprehensive LMS analytics for admin dashboard
 */
export async function getLMSAnalytics(): Promise<LMSAnalytics> {
    const user = await getAuthUser();
    if (user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const supabase = await createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // Overview stats
    const [
        { count: totalInterns },
        { count: totalCourses },
        { count: totalQuizzes },
        { count: certificatesIssued },
        { data: activeLearners }
    ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "intern"),
        supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("quizzes").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("course_certificates").select("*", { count: "exact", head: true }),
        supabase.from("lesson_time_tracking").select("user_id").gte("last_accessed_at", today).limit(1000)
    ]);

    const uniqueActiveLearners = new Set(activeLearners?.map(l => l.user_id) || []).size;

    // Course stats
    const { data: courses } = await supabase
        .from("courses")
        .select(`
            id,
            title,
            course_progress (user_id, status),
            lesson_time_tracking (total_active_seconds, user_id)
        `)
        .eq("is_published", true);

    const courseStats = (courses || []).map(course => {
        const enrolledUsers = new Set(course.course_progress?.map((p: any) => p.user_id) || []);
        const completedUsers = (course.course_progress || []).filter((p: any) => p.status === "completed");
        const totalTime = (course.lesson_time_tracking || []).reduce((sum: number, t: any) => sum + (t.total_active_seconds || 0), 0);
        const userCount = enrolledUsers.size;

        return {
            courseId: course.id,
            courseTitle: course.title,
            enrolledCount: userCount,
            completedCount: completedUsers.length,
            avgTimeSpentMinutes: userCount > 0 ? Math.round(totalTime / userCount / 60) : 0,
            avgScore: 0, // Will be calculated from quiz attempts
            passRate: userCount > 0 ? Math.round((completedUsers.length / userCount) * 100) : 0
        };
    });

    // Quiz stats
    const { data: quizAttempts } = await supabase
        .from("quiz_attempts")
        .select(`
            id,
            quiz_id,
            score_percentage,
            passed,
            tab_switches,
            idle_time_seconds,
            fullscreen_exits,
            created_at,
            user_id,
            quizzes (title),
            profiles (full_name)
        `)
        .order("created_at", { ascending: false });

    const totalAttempts = quizAttempts?.length || 0;
    const passedAttempts = quizAttempts?.filter(a => a.passed).length || 0;
    const avgScore = totalAttempts > 0
        ? Math.round((quizAttempts?.reduce((sum, a) => sum + a.score_percentage, 0) || 0) / totalAttempts)
        : 0;

    // Group by quiz for top quizzes
    const quizGroups = new Map<string, any[]>();
    quizAttempts?.forEach(a => {
        const existing = quizGroups.get(a.quiz_id) || [];
        existing.push(a);
        quizGroups.set(a.quiz_id, existing);
    });

    const topQuizzes = Array.from(quizGroups.entries())
        .map(([quizId, attempts]) => ({
            quizId,
            quizTitle: attempts[0]?.quizzes?.title || "Unknown",
            attempts: attempts.length,
            avgScore: Math.round(attempts.reduce((sum, a) => sum + a.score_percentage, 0) / attempts.length),
            passRate: Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)
        }))
        .sort((a, b) => b.attempts - a.attempts)
        .slice(0, 5);

    // Leaderboard
    const { data: leaderboardData } = await supabase
        .from("profiles")
        .select(`
            id,
            full_name,
            avatar_url,
            course_certificates (id),
            lesson_time_tracking (total_active_seconds),
            quiz_attempts (score_percentage, passed)
        `)
        .eq("role", "intern")
        .limit(20);

    const leaderboard = (leaderboardData || [])
        .map(user => {
            const coursesCompleted = user.course_certificates?.length || 0;
            const passedAttempts = (user.quiz_attempts || []).filter((a: any) => a.passed);
            const avgScore = passedAttempts.length > 0
                ? Math.round(passedAttempts.reduce((sum: number, a: any) => sum + a.score_percentage, 0) / passedAttempts.length)
                : 0;
            const totalTime = (user.lesson_time_tracking || []).reduce((sum: number, t: any) => sum + (t.total_active_seconds || 0), 0);

            return {
                userId: user.id,
                fullName: user.full_name || "Unknown",
                avatarUrl: user.avatar_url,
                coursesCompleted,
                avgScore,
                totalTimeMinutes: Math.round(totalTime / 60),
                certificatesEarned: coursesCompleted
            };
        })
        .sort((a, b) => (b.coursesCompleted * 100 + b.avgScore) - (a.coursesCompleted * 100 + a.avgScore))
        .slice(0, 10);

    // Cheating flags
    const cheatingFlags = (quizAttempts || [])
        .filter(a => (a.tab_switches || 0) > 2 || (a.idle_time_seconds || 0) > 300 || (a.fullscreen_exits || 0) > 1)
        .slice(0, 20)
        .map(a => ({
            attemptId: a.id,
            userId: a.user_id,
            userName: a.profiles?.full_name || "Unknown",
            quizTitle: a.quizzes?.title || "Unknown",
            tabSwitches: a.tab_switches || 0,
            idleTimeSeconds: a.idle_time_seconds || 0,
            fullscreenExits: a.fullscreen_exits || 0,
            timestamp: a.created_at
        }));

    // Recent activity
    const { data: recentCertificates } = await supabase
        .from("course_certificates")
        .select(`
            id,
            user_id,
            course_title,
            created_at,
            profiles!course_certificates_user_id_fkey (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

    const { data: recentAttempts } = await supabase
        .from("quiz_attempts")
        .select(`
            id,
            user_id,
            passed,
            score_percentage,
            created_at,
            profiles (full_name),
            quizzes (title)
        `)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(10);

    const recentActivity = [
        ...(recentCertificates || []).map(c => ({
            type: "certificate",
            userId: c.user_id,
            userName: c.profiles?.full_name || "Unknown",
            details: `Earned certificate for "${c.course_title}"`,
            timestamp: c.created_at
        })),
        ...(recentAttempts || []).map(a => ({
            type: a.passed ? "quiz_passed" : "quiz_failed",
            userId: a.user_id,
            userName: a.profiles?.full_name || "Unknown",
            details: `${a.passed ? "Passed" : "Failed"} "${a.quizzes?.title}" with ${a.score_percentage}%`,
            timestamp: a.created_at
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);

    return {
        overview: {
            totalInterns: totalInterns || 0,
            activeLearnersToday: uniqueActiveLearners,
            totalCourses: totalCourses || 0,
            totalQuizzes: totalQuizzes || 0,
            certificatesIssued: certificatesIssued || 0
        },
        courseStats,
        quizStats: {
            totalAttempts,
            avgScore,
            passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
            topQuizzes
        },
        leaderboard,
        cheatingFlags,
        recentActivity
    };
}

/**
 * Export analytics data as CSV
 */
export async function exportAnalyticsCSV(type: "courses" | "quizzes" | "leaderboard" | "cheating") {
    const user = await getAuthUser();
    if (user.role !== "admin") {
        throw new Error("Unauthorized");
    }

    const analytics = await getLMSAnalytics();

    let csvContent = "";
    let filename = "";

    switch (type) {
        case "courses":
            csvContent = "Course,Enrolled,Completed,Avg Time (min),Pass Rate\n";
            analytics.courseStats.forEach(c => {
                csvContent += `"${c.courseTitle}",${c.enrolledCount},${c.completedCount},${c.avgTimeSpentMinutes},${c.passRate}%\n`;
            });
            filename = "course_analytics.csv";
            break;
        case "quizzes":
            csvContent = "Quiz,Attempts,Avg Score,Pass Rate\n";
            analytics.quizStats.topQuizzes.forEach(q => {
                csvContent += `"${q.quizTitle}",${q.attempts},${q.avgScore}%,${q.passRate}%\n`;
            });
            filename = "quiz_analytics.csv";
            break;
        case "leaderboard":
            csvContent = "Name,Courses Completed,Avg Score,Time Spent (min),Certificates\n";
            analytics.leaderboard.forEach(l => {
                csvContent += `"${l.fullName}",${l.coursesCompleted},${l.avgScore}%,${l.totalTimeMinutes},${l.certificatesEarned}\n`;
            });
            filename = "leaderboard.csv";
            break;
        case "cheating":
            csvContent = "User,Quiz,Tab Switches,Idle Time (sec),Fullscreen Exits,Timestamp\n";
            analytics.cheatingFlags.forEach(c => {
                csvContent += `"${c.userName}","${c.quizTitle}",${c.tabSwitches},${c.idleTimeSeconds},${c.fullscreenExits},"${c.timestamp}"\n`;
            });
            filename = "cheating_flags.csv";
            break;
    }

    return { csvContent, filename };
}
