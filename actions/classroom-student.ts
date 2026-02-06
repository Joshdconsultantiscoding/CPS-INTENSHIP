"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getStudentClasses() {
    const { userId } = await auth();
    if (!userId) return [];

    const supabase = await createAdminClient();

    // Use Admin Client but strictly filter by enrollment for this specific user
    const { data, error } = await supabase
        .from("classes")
        .select(`
            id,
            name,
            description,
            instructor:profiles!classes_instructor_id_fkey(full_name),
            class_enrollments!inner(user_id) 
        `)
        .eq("class_enrollments.user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching student classes:", error);
        return [];
    }

    return data;
}

export async function getStudentCourses(query?: string) {
    const { userId } = await auth();
    if (!userId) return [];

    const supabase = await createAdminClient();

    // Fetch all published courses and their assignments for this user
    // We use Admin Client, so we must manually filter for Global vs Assigned
    let baseQuery = supabase
        .from("courses")
        .select("*, course_assignments(user_id)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

    if (query) {
        baseQuery = baseQuery.ilike("title", `%${query}%`);
    }

    const { data, error } = await baseQuery;

    if (error) {
        console.error("Error fetching student courses:", error);
        return [];
    }

    // Filter: Global OR (Selective AND Assigned to User)
    const visibleCourses = data.filter((course: any) => {
        if (course.assignment_type === 'global') return true;

        // Check if user is in the assignments list
        // course_assignments will be an array of objects { user_id: ... }
        return course.course_assignments?.some((assignment: any) => assignment.user_id === userId);
    });

    return visibleCourses;
}

export async function getCourseDetail(courseId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const supabase = await createAdminClient();

    // Fetch course with modules and lessons
    const { data: course, error } = await supabase
        .from("courses")
        .select(`
            *,
            course_modules (
                *,
                course_lessons (
                    *,
                    course_questions(count)
                ),
                course_questions(count)
            ),
            course_questions(count),
            course_assignments (user_id)
        `)
        .eq("id", courseId)
        .single();

    if (error || !course) {
        console.error("Error fetching course detail:", error);
        throw new Error("Course not found");
    }

    // Security Check: Must be published AND (Global OR Assigned)
    if (!course.is_published) {
        throw new Error("This course is not yet published.");
    }

    if (course.assignment_type === 'selective') {
        const isAssigned = course.course_assignments?.some((a: any) => a.user_id === userId);
        if (!isAssigned) {
            throw new Error("You do not have access to this course.");
        }
    }

    // Sort modules and lessons by order_index
    if (course.course_modules) {
        course.course_modules.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
        course.course_modules.forEach((module: any) => {
            if (module.course_lessons) {
                module.course_lessons.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
            }
        });
    }

    return course;
}

export async function getClassDetails(classId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const supabase = await createAdminClient();

    // Verify access and fetch class details in one go
    const { data: enrollment, error: enrollError } = await supabase
        .from("class_enrollments")
        .select(`
            class:classes (
                *,
                instructor:profiles!classes_instructor_id_fkey(full_name, avatar_url),
                class_courses(
                    course:courses(*)
                )
            )
        `)
        .eq("class_id", classId)
        .eq("user_id", userId)
        .single();

    if (enrollError || !enrollment) {
        console.error("Error verifying class access:", enrollError);
        return null;
    }

    return enrollment.class;
}

export async function getClassAnnouncements(classId: string) {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("class_announcements")
        .select("*, author:profiles(full_name, avatar_url)")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching announcements:", error);
        return [];
    }
    return data;
}

export async function getQuestionsForStudent(contextId: string, contextType: 'lesson' | 'module' | 'course') {
    const supabase = await createAdminClient();

    const foreignKey = contextType === 'course' ? 'course_id' : (contextType === 'module' ? 'module_id' : 'lesson_id');

    const { data, error } = await supabase
        .from("course_questions")
        .select("*")
        .eq(foreignKey, contextId)
        .order("order_index", { ascending: true });

    if (error) throw new Error("Failed to fetch questions");
    return data;
}

export async function submitAssessment(data: {
    courseId: string;
    contextId: string;
    contextType: string;
    answers: Record<string, any>;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const supabase = await createAdminClient();

    // 1. Fetch correct answers and reference answers
    const foreignKey = data.contextType === 'course' ? 'course_id' : (data.contextType === 'module' ? 'module_id' : 'lesson_id');
    const { data: questions, error } = await supabase
        .from("course_questions")
        .select("id, type, correct_answers, reference_answer, is_required")
        .eq(foreignKey, data.contextId);

    if (error) throw new Error("Validation failed");

    // 2. Advanced Grading
    let correctCount = 0;
    const wrongQuestions: string[] = [];

    questions.forEach(q => {
        const userAnswer = data.answers[q.id]?.toString().trim() || "";

        if (q.type === 'mcq' || q.type === 'boolean') {
            const isCorrect = q.correct_answers?.includes(userAnswer);
            if (isCorrect) correctCount++;
            else wrongQuestions.push(q.id);
        } else if (q.type === 'short') {
            // Strict case-insensitive match for short answers
            const isCorrect = userAnswer.toLowerCase() === (q.reference_answer || "").toLowerCase().trim();
            if (isCorrect) correctCount++;
            else wrongQuestions.push(q.id);
        } else if (q.type === 'long') {
            // Fuzzy match / Keyword check for long answers
            const reference = (q.reference_answer || "").toLowerCase().trim();
            if (!reference) {
                if (userAnswer.length > 20) correctCount++;
                else if (q.is_required) wrongQuestions.push(q.id);
            } else {
                // Basic keyword coverage check
                const keywords = reference.split(/\s+/).filter((w: string) => w.length > 3);
                const matchCount = keywords.filter((w: string) => userAnswer.toLowerCase().includes(w)).length;
                const coverage = keywords.length > 0 ? matchCount / keywords.length : 1;

                if (coverage >= 0.6 || userAnswer.toLowerCase().includes(reference)) {
                    correctCount++;
                } else if (q.is_required) {
                    wrongQuestions.push(q.id);
                }
            }
        }
    });

    const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 100;
    const passed = score >= 70;

    // 3. Record attempt in DB
    await supabase.from("course_attempts").insert({
        user_id: userId,
        course_id: data.courseId,
        context_id: data.contextId,
        context_type: data.contextType,
        score,
        passed,
        answers: data.answers
    });

    // 4. If passed and it's a course assessment, record completion
    if (passed && data.contextType === 'course') {
        await supabase.from("course_completions").upsert({
            user_id: userId,
            course_id: data.courseId
        });

        // Notify Admin
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
        const { data: course } = await supabase.from("courses").select("title").eq("id", data.courseId).single();

        await supabase.from("notifications").insert({
            user_id: 'SYSTEM_ADMIN', // Placeholder for admin recipient
            title: "Course Completed",
            message: `${profile?.full_name || 'An intern'} has completed "${course?.title || 'a course'}" with a score of ${score}%`,
            notification_type: 'success',
            reference_type: 'course',
            reference_id: data.courseId
        });
    }

    return {
        passed,
        score,
        total: questions.length,
        correct: correctCount,
        wrongQuestions
    };
}
export async function getClassMembers(classId: string) {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("class_enrollments")
        .select(`
            user_id,
            role,
            profile:profiles(full_name, avatar_url)
        `)
        .eq("class_id", classId);

    if (error) {
        console.error("Error fetching class members:", error);
        return [];
    }
    return data;
}

export async function getClassTasks(classId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const supabase = await createAdminClient();

    // 1. Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
        .from("class_tasks")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

    if (tasksError) {
        console.error("Error fetching class tasks:", tasksError);
        return [];
    }

    // 2. Fetch submissions for this specific user
    const { data: submissions, error: submissionsError } = await supabase
        .from("class_submissions")
        .select("*")
        .in("task_id", tasks.map(t => t.id))
        .eq("user_id", userId);

    if (submissionsError) {
        console.error("Error fetching task submissions:", submissionsError);
    }

    // 3. Merge submissions into tasks
    return tasks.map(task => ({
        ...task,
        submission: submissions?.find(s => s.task_id === task.id) || null
    }));
}

export async function submitClassTask(data: {
    taskId: string;
    content?: string;
    fileUrl?: string;
}) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const supabase = await createAdminClient();

    const { error } = await supabase
        .from("class_submissions")
        .upsert({
            task_id: data.taskId,
            user_id: userId,
            content: data.content,
            file_url: data.fileUrl,
            status: 'submitted',
            submitted_at: new Date().toISOString()
        }, { onConflict: 'task_id, user_id' });

    if (error) {
        console.error("Error submitting class task:", error);
        throw new Error("Failed to submit task");
    }

    // Fetch classId for revalidation
    const { data: task } = await supabase.from("class_tasks").select("class_id").eq("id", data.taskId).single();
    if (task) {
        revalidatePath(`/dashboard/classroom/classes/${task.class_id}`);
    }

    return { success: true };
}
