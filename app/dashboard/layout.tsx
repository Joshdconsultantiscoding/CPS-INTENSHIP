import { AblyClientProvider } from "@/providers/ably-provider";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ensureProfileSync } from "@/lib/profile-sync";
import { redirect } from "next/navigation";
import React from "react";
import { NotificationEngineProvider } from "@/components/notifications/notification-engine";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/auth/sign-in");

  const supabase = await createAdminClient();

  // Parallel Fetch: Profile + Settings + Onboarding + Terms + Clerk User to maximize speed
  let [clerkUser, profileRes, settingsRes, termsRes, progressRes] = await Promise.all([
    currentUser(),
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("api_settings").select("setting_value").eq("setting_key", "portal_settings").maybeSingle(),
    supabase.from("terms_acceptances").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("onboarding_progress").select("is_completed").eq("user_id", userId).maybeSingle()
  ]);

  if (!clerkUser) redirect("/auth/sign-in");

  // CRITICAL: Ensure profile is synced to Supabase as soon as they reach the dashboard
  // This handles the gap where new interns don't appear until they perform a specific action
  if (!profileRes.data) {
    console.log(`[DashboardLayout] Profile missing for ${userId}, ensuring sync...`);
    const syncRes = await ensureProfileSync({
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      full_name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.emailAddresses[0]?.emailAddress,
      avatar_url: clerkUser.imageUrl,
      role: "intern" // Default role
    }, supabase);

    if (syncRes.success) {
      // Re-fetch profile to have the complete data for the shell
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      profileRes.data = updatedProfile;
    }
  }

  const serverOnboarding = {
    hasAcceptedTerms: !!termsRes.data,
    isCompleted: !!progressRes.data?.is_completed,
  };

  // Minimal user data to pass to the client for instant identity rendering
  const serverUser = {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || "",
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl
  };

  return (
    <AblyClientProvider userId={userId}>
      <NotificationEngineProvider>
        <DashboardShell
          serverProfile={profileRes.data}
          serverSettings={settingsRes.data?.setting_value}
          serverOnboarding={serverOnboarding}
          serverUser={serverUser}
        >
          {children}
        </DashboardShell>
      </NotificationEngineProvider>
    </AblyClientProvider>
  );
}
