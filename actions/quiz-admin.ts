"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Quiz, QuizQuestion } from "@/lib/types";

// =============================================
// QUIZ ADMIN MANAGEMENT
// =============================================

/**
 * Create a new quiz
 */
export async function createQuiz(data: {
    title: string;
    description?: string;
    course_id: string;
    module_id?: string;
    lesson_id?: string;
    attachment_level: "course" | "module" | "lesson";
    time_limit_seconds?: number;
    passing_score?: number;
    attempts_allowed?: number;
    randomize_questions?: boolean;
    randomize_options?: boolean;
    show_correct_answers?: boolean;
    show_explanations?: boolean;
    strict_mode?: boolean;
    fullscreen_required?: boolean;
    detect_tab_switch?: boolean;
    auto_submit_on_cheat?: boolean;
}) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        const { data: quiz, error } = await supabase
            .from("quizzes")
            .insert({
                ...data,
                created_by: user.id,
                is_published: false
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating quiz:", error);
            return { success: false, error: "Failed to create quiz" };
        }

        revalidatePath("/dashboard/classroom");
        return { success: true, quiz };
    } catch (error: any) {
        console.error("Error in createQuiz:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Update quiz settings
 */
export async function updateQuiz(quizId: string, data: Partial<Quiz>) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("quizzes")
            .update(data)
            .eq("id", quizId);

        if (error) {
            console.error("Error updating quiz:", error);
            return { success: false, error: "Failed to update quiz" };
        }

        revalidatePath("/dashboard/classroom");
        return { success: true };
    } catch (error: any) {
        console.error("Error in updateQuiz:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(quizId: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("quizzes")
            .delete()
            .eq("id", quizId);

        if (error) {
            console.error("Error deleting quiz:", error);
            return { success: false, error: "Failed to delete quiz" };
        }

        revalidatePath("/dashboard/classroom");
        return { success: true };
    } catch (error: any) {
        console.error("Error in deleteQuiz:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Add a question to a quiz
 */
export async function addQuizQuestion(quizId: string, data: {
    type: "mcq" | "multi_select" | "boolean" | "short_answer" | "file_upload";
    question_text: string;
    question_image_url?: string;
    options?: { id: string; text: string; image_url?: string }[];
    correct_answers: string[];
    points?: number;
    partial_credit?: boolean;
    explanation?: string;
    hint?: string;
    is_required?: boolean;
}) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        // Get highest order_index
        const { data: existing } = await supabase
            .from("quiz_questions")
            .select("order_index")
            .eq("quiz_id", quizId)
            .order("order_index", { ascending: false })
            .limit(1)
            .single();

        const order_index = (existing?.order_index ?? -1) + 1;

        const { data: question, error } = await supabase
            .from("quiz_questions")
            .insert({
                quiz_id: quizId,
                ...data,
                order_index
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding question:", error);
            return { success: false, error: "Failed to add question" };
        }

        revalidatePath("/dashboard/classroom");
        return { success: true, question };
    } catch (error: any) {
        console.error("Error in addQuizQuestion:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Update a question
 */
export async function updateQuizQuestion(questionId: string, data: Partial<QuizQuestion>) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("quiz_questions")
            .update(data)
            .eq("id", questionId);

        if (error) {
            console.error("Error updating question:", error);
            return { success: false, error: "Failed to update question" };
        }

        revalidatePath("/dashboard/classroom");
        return { success: true };
    } catch (error: any) {
        console.error("Error in updateQuizQuestion:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a question
 */
export async function deleteQuizQuestion(questionId: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        const { error } = await supabase
            .from("quiz_questions")
            .delete()
            .eq("id", questionId);

        if (error) {
            console.error("Error deleting question:", error);
            return { success: false, error: "Failed to delete question" };
        }

        revalidatePath("/dashboard/classroom");
        return { success: true };
    } catch (error: any) {
        console.error("Error in deleteQuizQuestion:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Reorder questions
 */
export async function reorderQuizQuestions(quizId: string, questionIds: string[]) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        // Update order for each question
        for (let i = 0; i < questionIds.length; i++) {
            await supabase
                .from("quiz_questions")
                .update({ order_index: i })
                .eq("id", questionIds[i])
                .eq("quiz_id", quizId);
        }

        revalidatePath("/dashboard/classroom");
        return { success: true };
    } catch (error: any) {
        console.error("Error in reorderQuizQuestions:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get quiz with all questions (admin view)
 */
export async function getQuizWithQuestions(quizId: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        const { data: quiz, error } = await supabase
            .from("quizzes")
            .select(`
                *,
                quiz_questions (*)
            `)
            .eq("id", quizId)
            .single();

        if (error) {
            console.error("Error fetching quiz:", error);
            return { success: false, error: "Quiz not found" };
        }

        // Sort questions by order_index
        if (quiz.quiz_questions) {
            quiz.quiz_questions.sort((a: any, b: any) => a.order_index - b.order_index);
        }

        return { success: true, quiz };
    } catch (error: any) {
        console.error("Error in getQuizWithQuestions:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Publish/unpublish quiz
 */
export async function toggleQuizPublished(quizId: string, isPublished: boolean) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        // Check if quiz has questions before publishing
        if (isPublished) {
            const { count } = await supabase
                .from("quiz_questions")
                .select("*", { count: "exact", head: true })
                .eq("quiz_id", quizId);

            if (!count || count === 0) {
                return { success: false, error: "Cannot publish quiz without questions" };
            }
        }

        const { error } = await supabase
            .from("quizzes")
            .update({ is_published: isPublished })
            .eq("id", quizId);

        if (error) {
            console.error("Error toggling publish:", error);
            return { success: false, error: "Failed to update quiz" };
        }

        revalidatePath("/dashboard/classroom");
        return { success: true };
    } catch (error: any) {
        console.error("Error in toggleQuizPublished:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get quiz analytics
 */
export async function getQuizAnalytics(quizId: string) {
    try {
        const user = await getAuthUser();
        if (user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        const supabase = await createAdminClient();

        // Get all attempts
        const { data: attempts } = await supabase
            .from("quiz_attempts")
            .select(`
                *,
                profiles (id, full_name, email, avatar_url)
            `)
            .eq("quiz_id", quizId)
            .order("created_at", { ascending: false });

        if (!attempts) {
            return { success: true, analytics: { totalAttempts: 0, passRate: 0, averageScore: 0 } };
        }

        const totalAttempts = attempts.length;
        const passedAttempts = attempts.filter(a => a.passed).length;
        const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
        const averageScore = totalAttempts > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.score_percentage, 0) / totalAttempts)
            : 0;
        const averageTime = totalAttempts > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / totalAttempts)
            : 0;

        // Find fastest and slowest
        const completedAttempts = attempts.filter(a => a.status !== "in_progress");
        const sortedByTime = [...completedAttempts].sort((a, b) => a.time_spent_seconds - b.time_spent_seconds);
        const fastest = sortedByTime[0];
        const slowest = sortedByTime[sortedByTime.length - 1];

        return {
            success: true,
            analytics: {
                totalAttempts,
                passedAttempts,
                passRate,
                averageScore,
                averageTimeSeconds: averageTime,
                fastest: fastest ? { user: fastest.profiles, time: fastest.time_spent_seconds, score: fastest.score_percentage } : null,
                slowest: slowest ? { user: slowest.profiles, time: slowest.time_spent_seconds, score: slowest.score_percentage } : null,
                attempts
            }
        };
    } catch (error: any) {
        console.error("Error in getQuizAnalytics:", error);
        return { success: false, error: error.message };
    }
}
