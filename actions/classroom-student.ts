"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

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
                course_lessons (*)
            ),
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
                instructor:profiles!classes_instructor_id_fkey(full_name, avatar_url)
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

export async function getClassMembers(classId: string) {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("class_enrollments")
        .select("*, profile:profiles(id, full_name, avatar_url, role)")
        .eq("class_id", classId);

    if (error) {
        console.error("Error fetching class members:", error);
        return [];
    }
    return data;
}
