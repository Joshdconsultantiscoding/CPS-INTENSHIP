"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import type {
    Profile,
    Experience,
    Education,
    ProfileSkill,
    Project,
    Recommendation,
    FeaturedItem,
    FullProfile,
    ProfileCompletion,
    ExperienceForm,
    EducationForm,
    ProjectForm,
} from "@/lib/types/profile";

// =============================================
// PROFILE COMPLETION CALCULATION
// =============================================
export async function calculateProfileCompletion(profileId: string): Promise<ProfileCompletion> {
    const supabase = await createAdminClient();

    const [profileRes, expRes, eduRes, skillsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", profileId).single(),
        supabase.from("experiences").select("id").eq("profile_id", profileId).limit(1),
        supabase.from("education").select("id").eq("profile_id", profileId).limit(1),
        supabase.from("profile_skills").select("id").eq("profile_id", profileId).limit(1),
    ]);

    const profile = profileRes.data;
    if (!profile) {
        return {
            percentage: 0,
            sections: {
                photo: false,
                cover: false,
                headline: false,
                about: false,
                location: false,
                skills: false,
                experience: false,
                education: false,
            },
            isComplete: false,
        };
    }

    const sections = {
        photo: !!profile.avatar_url,
        cover: !!profile.cover_url,
        headline: !!profile.headline && profile.headline.length > 0,
        about: !!profile.about && profile.about.length > 20,
        location: !!profile.location,
        skills: (skillsRes.data?.length || 0) > 0,
        experience: (expRes.data?.length || 0) > 0,
        education: (eduRes.data?.length || 0) > 0,
    };

    // Weight each section
    const weights = {
        photo: 20,
        cover: 5,
        headline: 15,
        about: 20,
        location: 5,
        skills: 15,
        experience: 10,
        education: 10,
    };

    let percentage = 0;
    for (const [key, completed] of Object.entries(sections)) {
        if (completed) {
            percentage += weights[key as keyof typeof weights];
        }
    }

    return {
        percentage,
        sections,
        isComplete: percentage >= 70,
    };
}

// =============================================
// PROFILE CRUD
// =============================================
export async function getProfile(profileId: string): Promise<Profile | null> {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

    if (error) return null;
    return data;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

    if (error) return null;
    return data;
}

export async function getFullProfile(profileId: string): Promise<FullProfile | null> {
    const supabase = await createAdminClient();

    const [profileRes, expRes, eduRes, skillsRes, projectsRes, recsRes, featuredRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", profileId).single(),
        supabase.from("experiences").select("*").eq("profile_id", profileId).order("current", { ascending: false }).order("start_date", { ascending: false }),
        supabase.from("education").select("*").eq("profile_id", profileId).order("end_year", { ascending: false }),
        supabase.from("profile_skills").select("*").eq("profile_id", profileId).order("endorsements_count", { ascending: false }),
        supabase.from("profile_projects").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }),
        supabase.from("recommendations").select("*").eq("profile_id", profileId).eq("status", "approved").order("created_at", { ascending: false }),
        supabase.from("featured_items").select("*").eq("profile_id", profileId).order("display_order", { ascending: true }),
    ]);

    if (!profileRes.data) return null;

    return {
        ...profileRes.data,
        experiences: expRes.data || [],
        education: eduRes.data || [],
        skills: skillsRes.data || [],
        projects: projectsRes.data || [],
        recommendations: recsRes.data || [],
        featured_items: featuredRes.data || [],
    };
}

export async function updateProfile(
    profileId: string,
    updates: Partial<Profile>
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", profileId);

    if (error) return { success: false, error: error.message };

    // Check and update profile_completed status
    const completion = await calculateProfileCompletion(profileId);
    if (completion.isComplete) {
        await supabase
            .from("profiles")
            .update({ profile_completed: true })
            .eq("id", profileId);
    }

    revalidatePath(`/profile/${profileId}`);
    revalidatePath("/dashboard");
    return { success: true };
}

export async function checkUsernameAvailable(
    username: string,
    currentUserId: string
): Promise<boolean> {
    const supabase = await createAdminClient();
    const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", currentUserId)
        .single();

    return !data;
}

// =============================================
// EXPERIENCE CRUD
// =============================================
export async function addExperience(
    profileId: string,
    experience: ExperienceForm
): Promise<{ success: boolean; data?: Experience; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("experiences")
        .insert({
            profile_id: profileId,
            ...experience,
        })
        .select()
        .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true, data };
}

export async function updateExperience(
    experienceId: string,
    profileId: string,
    updates: Partial<ExperienceForm>
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("experiences")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", experienceId)
        .eq("profile_id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

export async function deleteExperience(
    experienceId: string,
    profileId: string
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("experiences")
        .delete()
        .eq("id", experienceId)
        .eq("profile_id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

// =============================================
// EDUCATION CRUD
// =============================================
export async function addEducation(
    profileId: string,
    education: EducationForm
): Promise<{ success: boolean; data?: Education; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("education")
        .insert({
            profile_id: profileId,
            ...education,
        })
        .select()
        .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true, data };
}

export async function updateEducation(
    educationId: string,
    profileId: string,
    updates: Partial<EducationForm>
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("education")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", educationId)
        .eq("profile_id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

export async function deleteEducation(
    educationId: string,
    profileId: string
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("education")
        .delete()
        .eq("id", educationId)
        .eq("profile_id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

// =============================================
// SKILLS CRUD
// =============================================
export async function addSkill(
    profileId: string,
    skillName: string
): Promise<{ success: boolean; data?: ProfileSkill; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("profile_skills")
        .insert({
            profile_id: profileId,
            skill_name: skillName,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            return { success: false, error: "Skill already added" };
        }
        return { success: false, error: error.message };
    }

    revalidatePath(`/profile/${profileId}`);
    return { success: true, data };
}

export async function removeSkill(
    skillId: string,
    profileId: string
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("profile_skills")
        .delete()
        .eq("id", skillId)
        .eq("profile_id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

export async function endorseSkill(
    skillId: string
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();

    // Add endorsement
    const { error: endorseError } = await supabase
        .from("skill_endorsements")
        .insert({
            skill_id: skillId,
            endorser_id: userId,
        });

    if (endorseError) {
        if (endorseError.code === "23505") {
            return { success: false, error: "You already endorsed this skill" };
        }
        return { success: false, error: endorseError.message };
    }

    // Increment count
    await supabase.rpc("increment_endorsement_count", { skill_uuid: skillId });

    return { success: true };
}

// =============================================
// PROJECTS CRUD
// =============================================
export async function addProject(
    profileId: string,
    project: ProjectForm
): Promise<{ success: boolean; data?: Project; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("profile_projects")
        .insert({
            profile_id: profileId,
            ...project,
        })
        .select()
        .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true, data };
}

export async function updateProject(
    projectId: string,
    profileId: string,
    updates: Partial<ProjectForm>
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("profile_projects")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", projectId)
        .eq("profile_id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

export async function deleteProject(
    projectId: string,
    profileId: string
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("profile_projects")
        .delete()
        .eq("id", projectId)
        .eq("profile_id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

// =============================================
// RECOMMENDATIONS
// =============================================
export async function addRecommendation(
    profileId: string,
    authorName: string,
    authorTitle: string,
    message: string,
    relationship: string
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("recommendations")
        .insert({
            profile_id: profileId,
            author_id: userId || null,
            author_name: authorName,
            author_title: authorTitle,
            message,
            relationship,
            status: "pending",
        });

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

export async function approveRecommendation(
    recommendationId: string,
    profileId: string
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("recommendations")
        .update({ status: "approved" })
        .eq("id", recommendationId)
        .eq("profile_id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

export async function deleteRecommendation(
    recommendationId: string,
    profileId: string
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("recommendations")
        .delete()
        .eq("id", recommendationId)
        .eq("profile_id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

// =============================================
// FEATURED ITEMS
// =============================================
export async function addFeaturedItem(
    profileId: string,
    item: Omit<FeaturedItem, "id" | "profile_id" | "created_at">
): Promise<{ success: boolean; data?: FeaturedItem; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("featured_items")
        .insert({
            profile_id: profileId,
            ...item,
        })
        .select()
        .single();

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true, data };
}

export async function deleteFeaturedItem(
    itemId: string,
    profileId: string
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("featured_items")
        .delete()
        .eq("id", itemId)
        .eq("profile_id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/profile/${profileId}`);
    return { success: true };
}

// =============================================
// PROFILE SETUP COMPLETION
// =============================================
export async function markProfileComplete(
    profileId: string
): Promise<{ success: boolean; error?: string }> {
    const { userId } = await auth();
    if (!userId || userId !== profileId) {
        return { success: false, error: "Unauthorized" };
    }

    const completion = await calculateProfileCompletion(profileId);
    if (!completion.isComplete) {
        return {
            success: false,
            error: `Profile only ${completion.percentage}% complete. Need at least 70%.`
        };
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
        .from("profiles")
        .update({ profile_completed: true })
        .eq("id", profileId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
}
