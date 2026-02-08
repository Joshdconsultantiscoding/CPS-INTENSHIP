import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { ProfileSetupWizard } from "./profile-setup-wizard";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Complete Your Profile | CPS Intern",
    description: "Set up your professional profile on CPS Intern",
};

export default async function SetupProfilePage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/auth/sign-in");
    }

    const supabase = await createAdminClient();

    // Get current profile data
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    // If profile is already complete, redirect to dashboard
    if (profile?.profile_completed) {
        redirect("/dashboard");
    }

    // Get existing skills
    const { data: skills } = await supabase
        .from("profile_skills")
        .select("*")
        .eq("profile_id", userId);

    return (
        <ProfileSetupWizard
            userId={userId}
            initialProfile={profile || null}
            initialSkills={skills || []}
        />
    );
}
