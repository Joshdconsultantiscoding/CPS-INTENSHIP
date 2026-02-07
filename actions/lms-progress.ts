"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { CourseWithProgress, LessonWithProgress, Quiz } from "@/lib/types";

// =============================================
// LMS-ENHANCED DATA FETCHING
// =============================================

/**
 * Get course with full progress data for LMS
 */
export async function getCourseWithProgress(courseId: string): Promise<CourseWithProgress> {
    const user = await getAuthUser();
    const supabase = await createAdminClient();

    // Fetch course with modules, lessons, quizzes, and progress
    const { data: course, error } = await supabase
        .from("courses")
        .select(`
            *,
            course_settings (*),
            course_modules (
                *,
                course_lessons (
                    *,
                    quizzes (id, title, passing_score, attempts_allowed, is_published, time_limit_seconds, strict_mode)
                )
            ),
            quizzes (id, title, passing_score, attempts_allowed, is_published, time_limit_seconds, strict_mode, attachment_level)
        `)
        .eq("id", courseId)
        .single();

    if (error || !course) {
        throw new Error("Course not found");
    }

    // Fetch user progress for all lessons
    const { data: progress } = await supabase
        .from("course_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId);

    // Fetch time tracking
    const { data: timeTracking } = await supabase
        .from("lesson_time_tracking")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId);

    // Fetch quiz attempts
    const { data: quizAttempts } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, status, passed, score_percentage")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    // Fetch certificate
    const { data: certificate } = await supabase
        .from("course_certificates")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single();

    // Sort and enhance modules/lessons
    const progressMap = new Map(progress?.map(p => [p.lesson_id, p]) || []);
    const timeMap = new Map(timeTracking?.map(t => [t.lesson_id, t]) || []);
    const quizAttemptMap = new Map<string, any>();
    quizAttempts?.forEach(a => {
        if (!quizAttemptMap.has(a.quiz_id) || a.passed) {
            quizAttemptMap.set(a.quiz_id, a);
        }
    });

    let totalLessons = 0;
    let completedLessons = 0;
    let totalTimeSpent = 0;

    const enhancedModules = (course.course_modules || [])
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .map((module: any) => {
            const enhancedLessons = (module.course_lessons || [])
                .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                .map((lesson: any) => {
                    totalLessons++;
                    const lessonProgress = progressMap.get(lesson.id);
                    const lessonTime = timeMap.get(lesson.id);
                    const lessonQuiz = lesson.quizzes?.[0];
                    const quizAttempt = lessonQuiz ? quizAttemptMap.get(lessonQuiz.id) : null;

                    if (lessonProgress?.status === "completed") {
                        completedLessons++;
                    }
                    if (lessonTime?.total_active_seconds) {
                        totalTimeSpent += lessonTime.total_active_seconds;
                    }

                    return {
                        ...lesson,
                        completed: lessonProgress?.status === "completed",
                        progress_percentage: lessonProgress?.progress_percentage || 0,
                        time_spent_seconds: lessonTime?.total_active_seconds || 0,
                        quiz_id: lessonQuiz?.id,
                        quiz: lessonQuiz,
                        quiz_attempt: quizAttempt
                    } as LessonWithProgress;
                });

            const moduleCompleted = enhancedLessons.every((l: LessonWithProgress) => l.completed);

            return {
                ...module,
                course_lessons: enhancedLessons,
                completed: moduleCompleted,
                progress_percentage: enhancedLessons.length > 0
                    ? Math.round((enhancedLessons.filter((l: LessonWithProgress) => l.completed).length / enhancedLessons.length) * 100)
                    : 0
            };
        });

    const overallProgress = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    // Normalize course_settings from array to single object if needed
    const settingsRaw = (course as any).course_settings;
    const settings = Array.isArray(settingsRaw) ? settingsRaw[0] : settingsRaw;

    return {
        ...course,
        course_settings: settings || undefined,
        course_modules: enhancedModules,
        progress_percentage: overallProgress,
        completed_lessons: completedLessons,
        total_lessons: totalLessons,
        total_time_spent_seconds: totalTimeSpent,
        certificate: certificate || undefined,
        is_completed: overallProgress === 100 && !!certificate
    } as CourseWithProgress;
}

/**
 * Get a single lesson with progress data
 */
export async function getLessonWithProgress(lessonId: string): Promise<LessonWithProgress & { course: any; module: any }> {
    const user = await getAuthUser();
    const supabase = await createAdminClient();

    // Fetch lesson with module and course info
    const { data: lesson, error } = await supabase
        .from("course_lessons")
        .select(`
            *,
            course_modules (
                id,
                title,
                course_id,
                courses (id, title, course_settings (*))
            ),
            quizzes (*)
        `)
        .eq("id", lessonId)
        .single();

    if (error || !lesson) {
        throw new Error("Lesson not found");
    }

    const courseId = lesson.course_modules?.course_id;

    // Fetch progress
    const { data: progress } = await supabase
        .from("course_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .single();

    // Fetch time tracking
    const { data: timeTracking } = await supabase
        .from("lesson_time_tracking")
        .select("*")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .single();

    // Fetch quiz attempt if quiz exists
    let quizAttempt = null;
    const lessonQuiz = lesson.quizzes?.[0];
    if (lessonQuiz) {
        const { data: attempt } = await supabase
            .from("quiz_attempts")
            .select("*")
            .eq("user_id", user.id)
            .eq("quiz_id", lessonQuiz.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
        quizAttempt = attempt;
    }

    return {
        ...lesson,
        completed: progress?.status === "completed",
        progress_percentage: progress?.progress_percentage || 0,
        time_spent_seconds: timeTracking?.total_active_seconds || 0,
        quiz_id: lessonQuiz?.id,
        quiz: lessonQuiz,
        quiz_attempt: quizAttempt,
        course: lesson.course_modules?.courses,
        module: { id: lesson.course_modules?.id, title: lesson.course_modules?.title }
    } as LessonWithProgress & { course: any; module: any };
}

/**
 * Get next/previous lessons
 */
export async function getLessonNavigation(courseId: string, currentLessonId: string) {
    const supabase = await createAdminClient();

    const { data: modules } = await supabase
        .from("course_modules")
        .select(`
            id,
            order_index,
            course_lessons (id, title, order_index)
        `)
        .eq("course_id", courseId)
        .order("order_index");

    if (!modules) return { prev: null, next: null };

    // Flatten lessons
    const allLessons = modules
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .flatMap(m =>
            (m.course_lessons || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        );

    const currentIndex = allLessons.findIndex((l: any) => l.id === currentLessonId);

    return {
        prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
        next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
        isLast: currentIndex === allLessons.length - 1,
        isFirst: currentIndex === 0,
        currentIndex,
        totalLessons: allLessons.length
    };
}

/**
 * Get resume point for a course
 */
export async function getResumePoint(courseId: string, existingCourse?: CourseWithProgress) {
    const user = await getAuthUser();
    const supabase = await createAdminClient();

    // Find last accessed lesson
    const { data: lastAccessed } = await supabase
        .from("lesson_time_tracking")
        .select("lesson_id, last_accessed_at, completed")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .order("last_accessed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lastAccessed && !lastAccessed.completed) {
        return { lessonId: lastAccessed.lesson_id, type: "continue" };
    }

    // Find first incomplete lesson
    const course = existingCourse || await getCourseWithProgress(courseId);
    for (const module of course.course_modules || []) {
        for (const lesson of module.course_lessons || []) {
            if (!lesson.completed) {
                return { lessonId: lesson.id, type: "next" };
            }
        }
    }

    // All complete, return first lesson
    const firstLesson = course.course_modules?.[0]?.course_lessons?.[0];
    return { lessonId: firstLesson?.id, type: "completed" };
}

/**
 * Get quizzes for course/module/lesson
 */
export async function getQuizzesForContext(contextType: "course" | "module" | "lesson", contextId: string) {
    const supabase = await createAdminClient();

    const column = contextType === "course" ? "course_id" :
        contextType === "module" ? "module_id" : "lesson_id";

    const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq(column, contextId)
        .eq("is_published", true)
        .order("created_at");

    if (error) {
        console.error("Error fetching quizzes:", error);
        return [];
    }

    return data;
}
