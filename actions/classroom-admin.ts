"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth"; // Use centralized auth logic
import { revalidatePath } from "next/cache";

// Helper to verify Admin access
async function verifyAdmin() {
    const user = await getAuthUser();

    if (user.role !== "admin") {
        throw new Error("Forbidden: Admin access required");
    }

    const supabase = await createAdminClient();

    // Trusting the sync layer for speed-of-light performance
    return { userId: user.id, supabase };
}

// --- INTERN MANAGEMENT ---

export async function getInternsList() {
    const { supabase } = await verifyAdmin();

    // Fetch profiles that are NOT admins
    const { data: interns, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url")
        .neq("role", "admin")
        .order("full_name");

    if (error) {
        console.error("Error fetching interns:", error);
        throw new Error("Failed to fetch interns list");
    }

    return interns;
}

export async function assignInternToClass(classId: string, userId: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase
        .from("class_enrollments")
        .insert({
            class_id: classId,
            user_id: userId,
            role: "student"
        });

    if (error) {
        // Check for duplicate key error aka already enrolled
        if (error.code === '23505') {
            return { success: false, message: "Intern is already enrolled in this class." };
        }
        console.error("Error assigning intern to class:", error);
        throw new Error("Failed to assign intern to class");
    }

    revalidatePath("/dashboard/admin/classroom");
    return { success: true, message: "Intern assigned successfully." };
}

export async function removeInternFromClass(classId: string, userId: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase.from('class_enrollments')
        .delete()
        .match({ class_id: classId, user_id: userId });

    if (error) throw new Error("Failed to remove intern from class");

    revalidatePath("/dashboard/admin/classroom");
    return { success: true };
}


// --- CLASS MANAGEMENT ---

export async function getClassesList() {
    const { supabase } = await verifyAdmin();

    const { data, error } = await supabase.from("classes").select("*").order("name");

    if (error) throw new Error("Failed to fetch classes");
    return data;
}

export async function createClass(name: string, description: string) {
    const { supabase, userId } = await verifyAdmin();

    const { data, error } = await supabase.from("classes").insert({
        name,
        description,
        instructor_id: userId
    }).select("id").single();

    if (error) {
        console.error("Create Class Error:", error);
        throw new Error(`Failed to create class: ${error.message} (${error.code})`);
    }
    revalidatePath("/dashboard/admin/classroom");
    return { success: true, id: data.id };
}

export async function updateClass(id: string, name: string, description: string, icon_url?: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase.from("classes").update({
        name,
        description,
        icon_url,
        updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (error) {
        console.error("Update Class Error:", error);
        throw new Error(`Failed to update class: ${error.message}`);
    }
    revalidatePath("/dashboard/admin/classroom");
    revalidatePath(`/dashboard/admin/classroom/classes/${id}/edit`);
    return { success: true };
}

export async function assignCourseToClass(classId: string, courseId: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase.from("class_courses").insert({
        class_id: classId,
        course_id: courseId
    });

    if (error) {
        if (error.code === '23505') return { success: false, message: "Course already assigned." };
        throw new Error("Failed to assign course to class");
    }

    revalidatePath(`/dashboard/admin/classroom/classes/${classId}/edit`);
    return { success: true };
}

export async function removeCourseFromClass(classId: string, courseId: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase.from("class_courses")
        .delete()
        .match({ class_id: classId, course_id: courseId });

    if (error) throw new Error("Failed to remove course from class");

    revalidatePath(`/dashboard/admin/classroom/classes/${classId}/edit`);
    return { success: true };
}

export async function deleteClass(id: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase.from("classes").delete().eq("id", id);

    if (error) {
        console.error("Delete Class Error:", error);
        throw new Error(`Failed to delete class: ${error.message}`);
    }
    revalidatePath("/dashboard/admin/classroom");
    return { success: true };
}


// --- COURSE MANAGEMENT ---

export async function getCoursesList() {
    const { supabase } = await verifyAdmin();

    const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });

    if (error) throw new Error("Failed to fetch courses");
    return data;
}

export async function createCourse(courseData: {
    title: string,
    description: string,
    price: number,
    assignment_type: string,
    is_published: boolean,
    level: "beginner" | "intermediate" | "advanced",
    duration_minutes: number,
    thumbnail_url?: string
}) {
    const { supabase } = await verifyAdmin();

    const { data, error } = await supabase.from("courses").insert(courseData).select("id").single();

    if (error) {
        console.error("Create Course Error:", error);
        throw new Error("Failed to create course");
    }
    revalidatePath("/dashboard/admin/classroom");
    return { success: true, id: data.id };
}

export async function updateCourse(id: string, data: {
    title: string,
    description: string,
    price: number,
    assignment_type: string,
    is_published: boolean,
    level: "beginner" | "intermediate" | "advanced",
    duration_minutes: number,
    thumbnail_url?: string
}) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase.from("courses").update(data).eq("id", id);

    if (error) {
        console.error("Update Course Error:", error);
        throw new Error("Failed to update course");
    }
    revalidatePath("/dashboard/admin/classroom");
    return { success: true };
}

export async function deleteCourse(id: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
        console.error("Delete Course Error:", error);
        throw new Error("Failed to delete course");
    }
    revalidatePath("/dashboard/admin/classroom");
    return { success: true };
}
export async function getClassDetails(id: string) {
    const { supabase } = await verifyAdmin();

    const [classRes, enrollmentsRes, coursesRes, tasksRes, announcementsRes] = await Promise.all([
        supabase.from("classes").select("*").eq("id", id).single(),
        supabase.from("class_enrollments").select("*, profiles(*)").eq("class_id", id),
        supabase.from("class_courses").select("*, courses(*)").eq("class_id", id),
        supabase.from("class_tasks").select("*").eq("class_id", id).order("created_at", { ascending: false }),
        supabase.from("class_announcements").select("*, author:profiles(full_name, avatar_url)").eq("class_id", id).order("created_at", { ascending: false }),
    ]);

    if (classRes.error) throw new Error("Failed to fetch class details");

    return {
        classData: classRes.data,
        enrollments: enrollmentsRes.data || [],
        classCourses: coursesRes.data || [],
        classTasks: tasksRes.data || [],
        announcements: announcementsRes.data || [],
    };
}

// --- CLASS TASKS ---

export async function getClassTasks(classId: string) {
    const { supabase } = await verifyAdmin();

    const { data: tasks, error } = await supabase
        .from("class_tasks")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching class tasks:", error);
        throw new Error("Failed to fetch class tasks");
    }

    return tasks;
}

export async function createClassTask(data: {
    classId: string;
    title: string;
    description: string;
    deadline?: string;
    submissionType: 'text' | 'link' | 'file' | 'all';
}) {
    const { supabase, userId } = await verifyAdmin();

    // 1. Insert Task
    const { data: task, error: taskError } = await supabase
        .from("class_tasks")
        .insert({
            class_id: data.classId,
            title: data.title,
            description: data.description,
            deadline: data.deadline,
            submission_type: data.submissionType,
            created_by: userId
        })
        .select()
        .single();

    if (taskError) {
        console.error("Error creating class task:", taskError);
        throw new Error("Failed to create task");
    }

    // 2. Notify all enrolled interns
    const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("user_id")
        .eq("class_id", data.classId);

    if (enrollments && enrollments.length > 0) {
        const notifications = enrollments.map(e => ({
            user_id: e.user_id,
            title: "New Class Task! 📝",
            message: `New task assigned: "${data.title}"`,
            notification_type: 'task',
            reference_type: 'class_task',
            reference_id: task.id
        }));

        await supabase.from("notifications").insert(notifications);
    }

    revalidatePath(`/dashboard/admin/classroom/classes/${data.classId}/edit`);
    revalidatePath(`/dashboard/classroom/classes/${data.classId}`);
    return { success: true, task };
}

export async function deleteClassTask(id: string, classId: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase
        .from("class_tasks")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting class task:", error);
        throw new Error("Failed to delete task");
    }

    revalidatePath(`/dashboard/admin/classroom/classes/${classId}/edit`);
    revalidatePath(`/dashboard/classroom/classes/${classId}`);
    return { success: true };
}

// --- COMMUNICATION & ANNOUNCEMENTS ---

export async function createAnnouncement(data: {
    classId: string;
    title: string;
    content: string;
}) {
    const { supabase, userId } = await verifyAdmin();

    // 1. Insert Announcement
    const { data: announcement, error: announceError } = await supabase
        .from("class_announcements")
        .insert({
            class_id: data.classId,
            author_id: userId,
            title: data.title,
            content: data.content
        })
        .select()
        .single();

    if (announceError) {
        console.error("Error creating announcement:", announceError);
        throw new Error("Failed to create announcement");
    }

    // 2. Notify all enrolled interns
    const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("user_id")
        .eq("class_id", data.classId);

    if (enrollments && enrollments.length > 0) {
        const notifications = enrollments.map(e => ({
            user_id: e.user_id,
            title: "New Announcement! 📢",
            message: data.title,
            notification_type: 'system',
            reference_type: 'announcement',
            reference_id: announcement.id
        }));

        await supabase.from("notifications").insert(notifications);
    }

    revalidatePath(`/dashboard/admin/classroom/classes/${data.classId}/edit`);
    revalidatePath(`/dashboard/classroom/classes/${data.classId}`);
    return { success: true, announcement };
}

export async function deleteAnnouncement(id: string, classId: string) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase
        .from("class_announcements")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting announcement:", error);
        throw new Error("Failed to delete announcement");
    }

    revalidatePath(`/dashboard/admin/classroom/classes/${classId}/edit`);
    revalidatePath(`/dashboard/classroom/classes/${classId}`);
    return { success: true };
}

/**
 * Updates communication settings for a class
 */
export async function updateClassSettings(classId: string, settings: {
    chat_enabled?: boolean;
    announcements_enabled?: boolean;
    posting_permissions?: 'all' | 'mentors' | 'staff';
}) {
    const { supabase } = await verifyAdmin();

    const { error } = await supabase
        .from("classes")
        .update(settings)
        .eq("id", classId);

    if (error) {
        console.error("Error updating class settings:", error);
        throw new Error("Failed to update class settings");
    }

    revalidatePath(`/dashboard/admin/classroom/classes/${classId}/edit`);
    revalidatePath(`/dashboard/classroom/classes/${classId}`);
    return { success: true };
}

/**
 * Fetches a report of all submissions for all interns in a class
 */
export async function getClassSubmissionsReport(classId: string) {
    const { supabase } = await verifyAdmin();

    // 1. Fetch all tasks for this class
    const { data: tasks, error: tasksError } = await supabase
        .from("class_tasks")
        .select("id, title, deadline")
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

    if (tasksError) throw new Error("Failed to fetch class tasks");

    // 2. Fetch all enrolled interns
    const { data: enrollments, error: enrollError } = await supabase
        .from("class_enrollments")
        .select("user_id, profile:profiles(full_name, avatar_url)")
        .eq("class_id", classId);

    if (enrollError) throw new Error("Failed to fetch class enrollments");

    // 3. Fetch all submissions for these tasks
    const { data: submissions, error: submissionsError } = await supabase
        .from("class_submissions")
        .select("*")
        .in("task_id", tasks.length > 0 ? tasks.map(t => t.id) : ['none']);

    if (submissionsError) throw new Error("Failed to fetch submissions");

    // 4. Transform data into a report
    const report = enrollments.map(enroll => {
        const internSubmissions = tasks.map(task => {
            const submission = submissions.find(s => s.task_id === task.id && s.user_id === enroll.user_id);
            return {
                taskId: task.id,
                taskTitle: task.title,
                status: submission ? submission.status : 'not_started',
                submittedAt: submission ? submission.submitted_at : null,
                fileUrl: submission ? submission.file_url : null,
                content: submission ? submission.content : null
            };
        });

        const completedCount = internSubmissions.filter(s => s.status !== 'not_started').length;

        return {
            userId: enroll.user_id,
            fullName: (enroll.profile as any)?.full_name || "Unknown Intern",
            avatarUrl: (enroll.profile as any)?.avatar_url,
            submissions: internSubmissions,
            stats: {
                total: tasks.length,
                completed: completedCount,
                pending: tasks.length - completedCount
            }
        };
    });

    return {
        tasks,
        report
    };
}
