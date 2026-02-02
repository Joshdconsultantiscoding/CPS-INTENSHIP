"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
    const user = await getAuthUser();
    if (user.role !== "admin") {
        throw new Error("Forbidden: Admin access required");
    }
    const supabase = await createAdminClient();

    // Ensure Admin Profile Exists in DB (to satisfy Foreign Keys & RLS)
    await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email || "",
        full_name: user.full_name || "Admin",
        avatar_url: user.avatar_url || "",
        role: "admin",
        updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    return { userId: user.id, supabase };
}

export async function getCourseForEditor(courseId: string) {
    try {
        console.log(`[getCourseForEditor] Start resilient fetch for: ${courseId}`);
        const { supabase } = await verifyAdmin();

        // 1. Fetch base course data
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("*")
            .eq("id", courseId)
            .single();

        if (courseError) {
            console.error("[getCourseForEditor] Base Course Fetch Error:");
            console.dir(courseError, { depth: null });
            throw new Error(`Course not found: ${courseError.message}`);
        }

        // 2. Fetch related data
        // Fetch modules first
        const { data: modules, error: modulesError } = await supabase
            .from("course_modules")
            .select("*")
            .eq("course_id", courseId)
            .order('order_index', { ascending: true });

        if (modulesError) {
            console.error("[getCourseForEditor] Modules Fetch Error:", modulesError.message);
            // Fallback to empty array but continue
        }

        const assembledModules = modules || [];

        // Fetch lessons for these modules
        if (assembledModules.length > 0) {
            const moduleIds = assembledModules.map(m => m.id);
            const { data: lessons, error: lessonsError } = await supabase
                .from("course_lessons")
                .select("*")
                .in("module_id", moduleIds)
                .order('order_index', { ascending: true });

            if (lessonsError) {
                console.error("[getCourseForEditor] Lessons Fetch Error:", lessonsError.message);
            } else if (lessons) {
                // Fetch questions for these lessons in a separate step
                const lessonIds = lessons.map(l => l.id);
                const { data: questions, error: questionsError } = await supabase
                    .from("course_questions")
                    .select("*")
                    .in("lesson_id", lessonIds)
                    .order('order_index', { ascending: true });

                if (questionsError) {
                    console.warn("[getCourseForEditor] Questions Fetch Warning (Table may be missing):", questionsError.message);
                }

                const safeQuestions = questions || [];

                assembledModules.forEach(module => {
                    module.course_lessons = lessons.filter(l => l.module_id === module.id) || [];
                    module.course_lessons.forEach((l: any) => {
                        l.course_questions = safeQuestions.filter(q => q.lesson_id === l.id) || [];
                    });
                });
            }
        }

        // 3. Fetch assignments
        const { data: assignments, error: assignmentsError } = await supabase
            .from("course_assignments")
            .select("*")
            .eq("course_id", courseId);

        if (assignmentsError) {
            console.warn("[getCourseForEditor] Assignments Fetch Error:", assignmentsError.message);
        }

        // 4. Assemble the object
        const assembledCourse = {
            ...course,
            course_modules: assembledModules,
            course_assignments: assignments || []
        };

        return assembledCourse;
    } catch (err: any) {
        console.error("[getCourseForEditor] UNHANDLED EXCEPTION IN RESILIENT FETCH:");
        console.dir(err, { depth: null });
        throw err;
    }
}

export async function updateCourseAdvanced(id: string, data: any) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase
        .from("courses")
        .update(data)
        .eq("id", id);

    if (error) {
        console.error("Error updating course advanced:", error);
        throw new Error("Failed to update course");
    }

    revalidatePath(`/dashboard/admin/classroom/courses/${id}/edit`);
    return { success: true };
}

// --- MODULES ---

export async function createModule(courseId: string, title: string) {
    const { supabase } = await verifyAdmin();

    // Get max order_index
    const { data: modules } = await supabase
        .from("course_modules")
        .select("order_index")
        .eq("course_id", courseId);

    const maxOrder = modules?.reduce((max, m) => Math.max(max, m.order_index || 0), -1) ?? -1;

    const { error } = await supabase.from("course_modules").insert({
        course_id: courseId,
        title,
        order_index: maxOrder + 1
    });

    if (error) throw new Error("Failed to create module");
    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}

export async function updateModule(id: string, courseId: string, data: any) {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase.from("course_modules").update(data).eq("id", id);
    if (error) throw new Error("Failed to update module");
    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}

export async function deleteModule(id: string, courseId: string) {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    if (error) throw new Error("Failed to delete module");
    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}

// --- LESSONS ---

export async function createLesson(moduleId: string, courseId: string, title: string) {
    const { supabase } = await verifyAdmin();

    // Get max order_index
    const { data: lessons } = await supabase
        .from("course_lessons")
        .select("order_index")
        .eq("module_id", moduleId);

    const maxOrder = lessons?.reduce((max, l) => Math.max(max, l.order_index || 0), -1) ?? -1;

    const { error } = await supabase.from("course_lessons").insert({
        module_id: moduleId,
        title,
        order_index: maxOrder + 1,
        content: "",
        video_url: ""
    });

    if (error) throw new Error("Failed to create lesson");
    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}

export async function updateLessonAdvanced(id: string, courseId: string, data: any) {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase.from("course_lessons").update(data).eq("id", id);
    if (error) throw new Error("Failed to update lesson");
    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}

export async function deleteLesson(id: string, courseId: string) {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase.from("course_lessons").delete().eq("id", id);
    if (error) throw new Error("Failed to delete lesson");
    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}

// --- QUESTIONS ---

export async function createQuestion(lessonId: string, courseId: string, type: string) {
    const { supabase } = await verifyAdmin();

    // Get max order_index
    const { data: questions } = await supabase
        .from("course_questions")
        .select("order_index")
        .eq("lesson_id", lessonId);

    const maxOrder = questions?.reduce((max, q) => Math.max(max, q.order_index || 0), -1) ?? -1;

    const { error } = await supabase.from("course_questions").insert({
        lesson_id: lessonId,
        type: type,
        question_text: "New Question",
        order_index: maxOrder + 1,
        options: type === 'mcq' ? ["Option 1", "Option 2"] : (type === 'boolean' ? ["True", "False"] : []),
        correct_answers: [],
        is_required: false
    });

    if (error) throw new Error("Failed to create question");
    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}

export async function updateQuestion(id: string, courseId: string, data: any) {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase.from("course_questions").update(data).eq("id", id);
    if (error) throw new Error("Failed to update question");
    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}

export async function deleteQuestion(id: string, courseId: string) {
    const { supabase } = await verifyAdmin();
    const { error } = await supabase.from("course_questions").delete().eq("id", id);
    if (error) throw new Error("Failed to delete question");
    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}
