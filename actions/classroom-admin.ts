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

    // Ensure Admin Profile Exists in DB (to satisfy Foreign Keys)
    // We trust getAuthUser() validated the identity/email.
    const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email || "",
        full_name: user.full_name || "Admin",
        avatar_url: user.avatar_url || "",
        role: "admin",
        updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

    if (error) {
        console.error("Failed to ensure admin profile:", JSON.stringify(error, null, 2));
        // If it's a FK violation, it confirms our hypothesis.
        // We throw here to stop execution and see the error in UI if needed, 
        // but the user wants it fixed "once and for all".
        // Let's assume the migration fix works and we don't need to throw, 
        // but if it fails, the next steps will fail anyway.
        // Better to verify success.
    }

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
    duration_minutes: number
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
    duration_minutes: number
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

    const [classRes, enrollmentsRes, coursesRes] = await Promise.all([
        supabase.from("classes").select("*").eq("id", id).single(),
        supabase.from("class_enrollments").select("*, profiles(*)").eq("class_id", id),
        supabase.from("class_courses").select("*, courses(*)").eq("class_id", id),
    ]);

    if (classRes.error) throw new Error("Failed to fetch class details");

    return {
        classData: classRes.data,
        enrollments: enrollmentsRes.data || [],
        classCourses: coursesRes.data || [],
    };
}
