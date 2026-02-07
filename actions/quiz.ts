"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { publishGlobalUpdate } from "@/lib/ably-server";
import type { Quiz, QuizQuestion, QuizAttempt, QuizAnswer } from "@/lib/types";

// =============================================
// QUIZ ATTEMPT MANAGEMENT
// =============================================

/**
 * Start a new quiz attempt
 * Creates attempt record and returns questions (without correct answers)
 */
export async function startQuizAttempt(quizId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // 1. Get quiz settings
        const { data: quiz, error: quizError } = await supabase
            .from("quizzes")
            .select("*, quiz_questions(*)")
            .eq("id", quizId)
            .eq("is_published", true)
            .single();

        if (quizError || !quiz) {
            return { success: false, error: "Quiz not found or not published" };
        }

        // 2. Check attempts allowed
        if (quiz.attempts_allowed > 0) {
            const { count } = await supabase
                .from("quiz_attempts")
                .select("*", { count: "exact", head: true })
                .eq("quiz_id", quizId)
                .eq("user_id", user.id);

            if ((count || 0) >= quiz.attempts_allowed) {
                return { success: false, error: "Maximum attempts reached" };
            }
        }

        // 3. Check for in-progress attempt
        const { data: existingAttempt } = await supabase
            .from("quiz_attempts")
            .select("*")
            .eq("quiz_id", quizId)
            .eq("user_id", user.id)
            .eq("status", "in_progress")
            .single();

        if (existingAttempt) {
            // Resume existing attempt
            return {
                success: true,
                attempt: existingAttempt,
                questions: sanitizeQuestionsForIntern(quiz.quiz_questions, quiz.randomize_questions, quiz.randomize_options),
                quiz: { ...quiz, quiz_questions: undefined }
            };
        }

        // 4. Calculate attempt number
        const { count: attemptCount } = await supabase
            .from("quiz_attempts")
            .select("*", { count: "exact", head: true })
            .eq("quiz_id", quizId)
            .eq("user_id", user.id);

        // 5. Create new attempt
        const { data: attempt, error: attemptError } = await supabase
            .from("quiz_attempts")
            .insert({
                quiz_id: quizId,
                user_id: user.id,
                attempt_number: (attemptCount || 0) + 1,
                status: "in_progress",
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (attemptError) {
            console.error("Error creating attempt:", attemptError);
            return { success: false, error: "Failed to start quiz" };
        }

        return {
            success: true,
            attempt,
            questions: sanitizeQuestionsForIntern(quiz.quiz_questions, quiz.randomize_questions, quiz.randomize_options),
            quiz: { ...quiz, quiz_questions: undefined }
        };
    } catch (error: any) {
        console.error("Error in startQuizAttempt:", error);
        return { success: false, error: error.message || "Failed to start quiz" };
    }
}

/**
 * Save an answer during the quiz
 * Auto-grades MCQ, boolean, and multi_select types
 */
export async function saveQuizAnswer(
    attemptId: string,
    questionId: string,
    answer: {
        selected_options?: string[];
        text_answer?: string;
        file_url?: string;
    }
) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // 1. Verify attempt ownership and status
        const { data: attempt } = await supabase
            .from("quiz_attempts")
            .select("*, quizzes(*)")
            .eq("id", attemptId)
            .eq("user_id", user.id)
            .eq("status", "in_progress")
            .single();

        if (!attempt) {
            return { success: false, error: "Invalid or completed attempt" };
        }

        // 2. Get question with correct answers
        const { data: question } = await supabase
            .from("quiz_questions")
            .select("*")
            .eq("id", questionId)
            .single();

        if (!question) {
            return { success: false, error: "Question not found" };
        }

        // 3. Auto-grade if applicable
        const grading = autoGradeAnswer(question, answer);

        // 4. Upsert answer
        const { error } = await supabase
            .from("quiz_answers")
            .upsert({
                attempt_id: attemptId,
                question_id: questionId,
                selected_options: answer.selected_options || [],
                text_answer: answer.text_answer || null,
                file_url: answer.file_url || null,
                is_correct: grading.is_correct,
                points_earned: grading.points_earned,
                auto_graded: grading.auto_graded,
                answered_at: new Date().toISOString()
            }, {
                onConflict: "attempt_id,question_id"
            });

        if (error) {
            console.error("Error saving answer:", error);
            return { success: false, error: "Failed to save answer" };
        }

        return { success: true, grading };
    } catch (error: any) {
        console.error("Error in saveQuizAnswer:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Submit completed quiz attempt
 * Calculates final score and marks pass/fail
 */
export async function submitQuizAttempt(attemptId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // 1. Get attempt with answers
        const { data: attempt } = await supabase
            .from("quiz_attempts")
            .select("*, quiz_answers(*), quizzes(*)")
            .eq("id", attemptId)
            .eq("user_id", user.id)
            .single();

        if (!attempt || attempt.status !== "in_progress") {
            return { success: false, error: "Invalid or already submitted attempt" };
        }

        // 2. Calculate score
        const { data: questions } = await supabase
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", attempt.quiz_id);

        const totalPoints = questions?.reduce((sum, q) => sum + q.points, 0) || 0;
        const earnedPoints = attempt.quiz_answers?.reduce((sum: number, a: any) => sum + (a.points_earned || 0), 0) || 0;
        const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100 * 100) / 100 : 0;
        const passed = scorePercentage >= (attempt.quizzes?.passing_score || 70);

        // 3. Calculate time spent
        const startTime = new Date(attempt.started_at).getTime();
        const endTime = Date.now();
        const timeSpentSeconds = Math.floor((endTime - startTime) / 1000);

        // 4. Update attempt
        const { error } = await supabase
            .from("quiz_attempts")
            .update({
                status: "submitted",
                ended_at: new Date().toISOString(),
                time_spent_seconds: timeSpentSeconds,
                total_points: totalPoints,
                earned_points: earnedPoints,
                score_percentage: scorePercentage,
                passed
            })
            .eq("id", attemptId);

        if (error) {
            console.error("Error submitting attempt:", error);
            return { success: false, error: "Failed to submit quiz" };
        }

        // 5. Update course progress if quiz passed
        if (passed && attempt.quizzes) {
            await updateCourseProgressAfterQuiz(user.id, attempt.quizzes, scorePercentage);
        }

        // 6. Broadcast update
        await publishGlobalUpdate("quiz-submitted", {
            userId: user.id,
            quizId: attempt.quiz_id,
            attemptId,
            passed,
            score: scorePercentage
        });

        revalidatePath("/dashboard/classroom");

        return {
            success: true,
            result: {
                total_points: totalPoints,
                earned_points: earnedPoints,
                score_percentage: scorePercentage,
                passed,
                time_spent_seconds: timeSpentSeconds
            }
        };
    } catch (error: any) {
        console.error("Error in submitQuizAttempt:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Auto-submit on timeout
 */
export async function autoSubmitTimedOut(attemptId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        // Get attempt
        const { data: attempt } = await supabase
            .from("quiz_attempts")
            .select("*")
            .eq("id", attemptId)
            .eq("user_id", user.id)
            .eq("status", "in_progress")
            .single();

        if (!attempt) {
            return { success: false, error: "Attempt not found" };
        }

        // Update status to timed_out and submit
        await supabase
            .from("quiz_attempts")
            .update({ status: "timed_out" })
            .eq("id", attemptId);

        // Calculate and save final score
        return await submitQuizAttempt(attemptId);
    } catch (error: any) {
        console.error("Error in autoSubmitTimedOut:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Report anti-cheat violation
 */
export async function reportAntiCheatViolation(
    attemptId: string,
    violationType: "tab_switch" | "idle" | "fullscreen_exit"
) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const { data: attempt } = await supabase
            .from("quiz_attempts")
            .select("*, quizzes(*)")
            .eq("id", attemptId)
            .eq("user_id", user.id)
            .eq("status", "in_progress")
            .single();

        if (!attempt) {
            return { success: false, error: "Attempt not found" };
        }

        const updates: any = {};
        if (violationType === "tab_switch") {
            updates.tab_switches = (attempt.tab_switches || 0) + 1;
        } else if (violationType === "fullscreen_exit") {
            updates.fullscreen_exits = (attempt.fullscreen_exits || 0) + 1;
        }

        await supabase
            .from("quiz_attempts")
            .update(updates)
            .eq("id", attemptId);

        // Check if auto-submit on cheat
        if (attempt.quizzes?.auto_submit_on_cheat) {
            const totalViolations = (updates.tab_switches || attempt.tab_switches || 0) +
                (updates.fullscreen_exits || attempt.fullscreen_exits || 0);

            if (totalViolations >= 3) {
                await supabase
                    .from("quiz_attempts")
                    .update({
                        status: "flagged",
                        flagged_reason: "Multiple anti-cheat violations"
                    })
                    .eq("id", attemptId);

                return { success: true, flagged: true, message: "Quiz flagged for review" };
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error in reportAntiCheatViolation:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Get quiz results for completed attempt
 */
export async function getQuizResults(attemptId: string) {
    try {
        const user = await getAuthUser();
        const supabase = await createAdminClient();

        const { data: attempt, error } = await supabase
            .from("quiz_attempts")
            .select(`
                *,
                quizzes (
                    *,
                    show_correct_answers,
                    show_explanations
                ),
                quiz_answers (
                    *,
                    quiz_questions (*)
                )
            `)
            .eq("id", attemptId)
            .single();

        if (error || !attempt) {
            return { success: false, error: "Results not found" };
        }

        // Verify ownership or admin
        if (attempt.user_id !== user.id && user.role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        // Sanitize correct answers if not allowed to show
        const sanitizedAttempt = { ...attempt };
        if (!attempt.quizzes?.show_correct_answers && attempt.user_id === user.id) {
            sanitizedAttempt.quiz_answers = attempt.quiz_answers?.map((a: any) => ({
                ...a,
                quiz_questions: {
                    ...a.quiz_questions,
                    correct_answers: undefined,
                    explanation: attempt.quizzes?.show_explanations ? a.quiz_questions.explanation : undefined
                }
            }));
        }

        return { success: true, attempt: sanitizedAttempt };
    } catch (error: any) {
        console.error("Error in getQuizResults:", error);
        return { success: false, error: error.message };
    }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function sanitizeQuestionsForIntern(
    questions: QuizQuestion[],
    randomizeQuestions: boolean,
    randomizeOptions: boolean
): Omit<QuizQuestion, "correct_answers">[] {
    let sanitized = questions.map(q => {
        const { correct_answers, ...rest } = q;

        // Randomize options if enabled
        if (randomizeOptions && rest.options && Array.isArray(rest.options)) {
            rest.options = shuffleArray([...rest.options]);
        }

        return rest;
    });

    // Randomize question order if enabled
    if (randomizeQuestions) {
        sanitized = shuffleArray(sanitized);
    }

    return sanitized;
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function autoGradeAnswer(
    question: QuizQuestion,
    answer: { selected_options?: string[]; text_answer?: string }
): { is_correct: boolean | null; points_earned: number; auto_graded: boolean } {
    const { type, correct_answers, points, partial_credit } = question;

    // Cannot auto-grade these types
    if (type === "short_answer" || type === "file_upload") {
        return { is_correct: null, points_earned: 0, auto_graded: false };
    }

    const selectedOptions = answer.selected_options || [];

    if (type === "mcq" || type === "boolean") {
        const isCorrect = selectedOptions.length === 1 &&
            correct_answers.includes(selectedOptions[0]);
        return {
            is_correct: isCorrect,
            points_earned: isCorrect ? points : 0,
            auto_graded: true
        };
    }

    if (type === "multi_select") {
        const correctSet = new Set(correct_answers);
        const selectedSet = new Set(selectedOptions);

        const correctCount = selectedOptions.filter(o => correctSet.has(o)).length;
        const incorrectCount = selectedOptions.filter(o => !correctSet.has(o)).length;
        const missedCount = correct_answers.filter(o => !selectedSet.has(o)).length;

        const isFullyCorrect = correctCount === correct_answers.length && incorrectCount === 0;

        if (partial_credit) {
            // Calculate partial points
            const partialPoints = Math.max(0,
                Math.round((correctCount / correct_answers.length) * points - (incorrectCount * (points / correct_answers.length)))
            );
            return {
                is_correct: isFullyCorrect,
                points_earned: isFullyCorrect ? points : partialPoints,
                auto_graded: true
            };
        } else {
            return {
                is_correct: isFullyCorrect,
                points_earned: isFullyCorrect ? points : 0,
                auto_graded: true
            };
        }
    }

    return { is_correct: null, points_earned: 0, auto_graded: false };
}

async function updateCourseProgressAfterQuiz(
    userId: string,
    quiz: Quiz,
    scorePercentage: number
) {
    const supabase = await createAdminClient();

    // Update based on attachment level
    if (quiz.lesson_id) {
        await supabase
            .from("course_progress")
            .upsert({
                user_id: userId,
                lesson_id: quiz.lesson_id,
                course_id: quiz.course_id,
                quiz_score: scorePercentage,
                quiz_passed: true,
                status: "completed",
                completed_at: new Date().toISOString()
            }, { onConflict: "user_id,lesson_id" });
    }

    revalidatePath("/dashboard/classroom");
}
