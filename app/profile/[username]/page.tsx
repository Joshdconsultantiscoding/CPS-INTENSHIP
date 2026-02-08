import { getAuthUserOptional } from "@/lib/auth";
import { getFullProfile, getProfileByUsername } from "@/actions/profile";
import { redirect, notFound } from "next/navigation";
import { ProfilePageClient } from "./profile-page-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const { username } = await params;
    const profile = await getProfileByUsername(username);

    if (!profile) {
        return { title: "Profile Not Found" };
    }

    return {
        title: `${profile.full_name || "User"} | CPS Intern`,
        description: profile.headline || profile.about?.slice(0, 160) || `${profile.full_name}'s profile on CPS Intern`,
        openGraph: {
            title: `${profile.full_name || "User"} | CPS Intern`,
            description: profile.headline || "CPS Intern Profile",
            images: profile.avatar_url ? [profile.avatar_url] : [],
        },
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;

    // Try to find by username first
    let profile = await getProfileByUsername(username);

    // If not found by username, try by ID (for backwards compatibility)
    if (!profile) {
        const { getFullProfile } = await import("@/actions/profile");
        profile = await getFullProfile(username);
    }

    if (!profile) {
        notFound();
    }

    // Get full profile with all related data
    const fullProfile = await getFullProfile(profile.id);

    if (!fullProfile) {
        notFound();
    }

    // Get current user to determine if they're the owner
    const currentUser = await getAuthUserOptional();
    const isOwner = currentUser?.id === profile.id;
    const isAdmin = currentUser?.role === "admin";

    // Fetch dashboard requirement data if user is logged in
    let dashboardProps = null;

    if (currentUser) {
        const { createAdminClient } = await import("@/lib/supabase/server");
        const { currentUser: getClerkUser } = await import("@clerk/nextjs/server");

        // Use Admin Client to ensure we can fetch system settings/changelogs regardless of RLS
        const supabase = await createAdminClient();
        const clerkUser = await getClerkUser();

        if (clerkUser) {
            // Fetch concurrent data for dashboard shell
            const [settingsRes, termsRes, progressRes, currentProfileRes, latestLogRes] = await Promise.all([
                supabase.from("api_settings").select("setting_value").eq("setting_key", "portal_settings").maybeSingle(),
                supabase.from("terms_acceptances").select("user_id").eq("user_id", currentUser.id).maybeSingle(),
                supabase.from("onboarding_progress").select("is_completed").eq("user_id", currentUser.id).maybeSingle(),
                supabase.from("profiles").select("*").eq("id", currentUser.id).single(),
                supabase.from("changelogs").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()
            ]);

            dashboardProps = {
                serverProfile: currentProfileRes.data,
                serverSettings: settingsRes.data?.setting_value,
                serverOnboarding: {
                    hasAcceptedTerms: !!termsRes.data,
                    isCompleted: !!progressRes.data?.is_completed,
                },
                serverUser: {
                    id: clerkUser.id,
                    email: clerkUser.emailAddresses[0]?.emailAddress || "",
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    imageUrl: clerkUser.imageUrl
                },
                serverLatestLog: latestLogRes.data
            };
        }
    }

    return (
        <ProfilePageClient
            profile={fullProfile}
            isOwner={isOwner}
            isAdmin={isAdmin}
            currentUserId={currentUser?.id}
            dashboardProps={dashboardProps}
        />
    );
}
