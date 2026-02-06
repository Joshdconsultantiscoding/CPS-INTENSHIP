"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ensureProfileSync } from "@/lib/profile-sync";
import { numberToWords } from "@/lib/utils";

async function verifyAdmin() {
    const user = await getAuthUser();
    if (user.role !== "admin") {
        throw new Error("Forbidden: Admin access required");
    }
    const supabase = await createAdminClient();

    // Ensure Admin Profile Exists Safely (Don't overwrite custom avatars)
    await ensureProfileSync(user, supabase);

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

                // Attach questions to lessons
                assembledModules.forEach(module => {
                    module.course_lessons = lessons.filter(l => l.module_id === module.id) || [];
                    module.course_lessons.forEach((l: any) => {
                        l.course_questions = safeQuestions.filter(q => q.lesson_id === l.id) || [];
                    });
                });
            }
        }

        // 2b. Fetch Module & Course Level Questions for the Editor
        // We need to fetch questions where module_id IN moduleIds OR course_id = courseId.
        // Doing this in parallel to lesson fetching might be cleaner, but let's append it here for safety.

        // Fetch Course Level Questions
        const { data: courseQuestions } = await supabase
            .from("course_questions")
            .select("*")
            .eq("course_id", courseId)
            .order("order_index", { ascending: true });

        // Fetch Module Level Questions
        let moduleQuestions: any[] = [];
        if (assembledModules.length > 0) {
            const { data: mq } = await supabase
                .from("course_questions")
                .select("*")
                .in("module_id", assembledModules.map(m => m.id))
                .order("order_index", { ascending: true });
            moduleQuestions = mq || [];
        }

        // Attach to Course
        (course as any).course_questions = courseQuestions || [];

        // Attach to Modules
        assembledModules.forEach(module => {
            module.course_questions = moduleQuestions.filter(q => q.module_id === module.id) || [];
        });


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

    // Sanitize JSONB fields if necessary, or just pass data directly if it's clean.
    // Ensure numbers are numbers, etc.
    const cleanData = { ...data };
    if (cleanData.price) cleanData.price = parseFloat(cleanData.price);

    const { error } = await supabase
        .from("courses")
        .update(cleanData)
        .eq("id", id);

    if (error) {
        console.error("Error updating course advanced:", error);
        throw new Error("Failed to update course: " + error.message);
    }

    revalidatePath(`/dashboard/admin/classroom`);
    revalidatePath(`/dashboard/admin/classroom/courses/${id}/edit`);
    return { success: true };
}

// --- ASSIGNMENTS ---

export async function assignCourseToUser(courseId: string, userId: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase.from("course_assignments").insert({
        course_id: courseId,
        user_id: userId,
        assigned_at: new Date().toISOString()
    });

    if (error) {
        // Ignore duplicate key errors if already assigned
        if (error.code === '23505') return { success: true };
        throw new Error("Failed to assign course to user");
    }

    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}

export async function unassignCourseFromUser(courseId: string, userId: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase.from("course_assignments").delete().match({
        course_id: courseId,
        user_id: userId
    });

    if (error) throw new Error("Failed to unassign course from user");

    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true };
}

export async function assignCourseToClass(courseId: string, classId: string) {
    const { supabase } = await verifyAdmin();

    // 1. Get all students in the class
    const { data: students, error: fetchError } = await supabase
        .from("profiles")
        .select("id")
        .eq("class_id", classId);

    if (fetchError) throw new Error("Failed to fetch class students");
    if (!students || students.length === 0) return { success: true, count: 0 };

    // 2. Prepare bulk insert
    const assignments = students.map(s => ({
        course_id: courseId,
        user_id: s.id,
        assigned_at: new Date().toISOString()
    }));

    // 3. Upsert to handle duplicates
    const { error: insertError } = await supabase
        .from("course_assignments")
        .upsert(assignments, { onConflict: 'course_id, user_id' });

    if (insertError) throw new Error("Failed to assign course to class");

    revalidatePath(`/dashboard/admin/classroom/courses/${courseId}/edit`);
    return { success: true, count: students.length };
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
    const moduleNumber = maxOrder + 2;
    const defaultTitle = `MODULE ${numberToWords(moduleNumber)}`;

    const { error } = await supabase.from("course_modules").insert({
        course_id: courseId,
        title: !title || ["new module", "new", ""].includes(title.trim().toLowerCase()) ? "New Module" : title,
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
    const lessonNumber = maxOrder + 2;
    const defaultTitle = `LESSON ${numberToWords(lessonNumber)}`;

    const { error } = await supabase.from("course_lessons").insert({
        module_id: moduleId,
        title: !title || ["new lesson", "new", ""].includes(title.trim().toLowerCase()) ? "New Lesson" : title,
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
    if (error) {
        console.error("Error updating lesson:", error);
        throw new Error("Failed to update lesson: " + error.message);
    }
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

export async function createQuestion(
    contextId: string,
    courseId: string,
    type: string,
    contextType: 'course' | 'module' | 'lesson' = 'lesson'
) {
    const { supabase } = await verifyAdmin();

    // Determine column to check for ordering
    const foreignKeyColumn = contextType === 'course' ? 'course_id' : (contextType === 'module' ? 'module_id' : 'lesson_id');

    // Get max order_index
    const { data: questions } = await supabase
        .from("course_questions")
        .select("order_index")
        .eq(foreignKeyColumn, contextId);

    const maxOrder = questions?.reduce((max, q) => Math.max(max, q.order_index || 0), -1) ?? -1;

    // Construct insert payload
    const payload: any = {
        type: type,
        question_text: "New Question",
        order_index: maxOrder + 1,
        options: type === 'mcq' ? ["Option 1", "Option 2"] : (type === 'boolean' ? ["True", "False"] : []),
        correct_answers: [],
        is_required: false
    };

    // Set the correct foreign key
    if (contextType === 'course') payload.course_id = contextId;
    else if (contextType === 'module') payload.module_id = contextId;
    else payload.lesson_id = contextId;

    const { error } = await supabase.from("course_questions").insert(payload);

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

export async function issueCertificate(data: {
    userId: string;
    courseId: string;
    type: 'system' | 'upload';
    customUrl?: string | null;
}) {
    const { supabase } = await verifyAdmin();

    const certificateUrl = data.type === 'system'
        ? `/api/certificates/generate?u=${data.userId}&c=${data.courseId}` // Placeholder for generation API
        : data.customUrl;

    const { error } = await supabase.from("certificates").insert({
        user_id: data.userId,
        course_id: data.courseId,
        certificate_url: certificateUrl,
        is_uploaded: data.type === 'upload',
        issued_at: new Date().toISOString()
    });

    if (error) throw new Error("Failed to issue certificate");

    // Notify Intern
    const { data: course } = await supabase.from("courses").select("title").eq("id", data.courseId).single();

    await supabase.from("notifications").insert({
        user_id: data.userId,
        title: "Certificate Issued! 🎓",
        message: `Congratulations! Your certificate for "${course?.title}" has been issued. You can view it in your dashboard.`,
        notification_type: 'success',
        reference_type: 'certificate',
        reference_id: data.courseId
    });

    revalidatePath("/dashboard/admin/classroom/performance");
    return { success: true };
}
