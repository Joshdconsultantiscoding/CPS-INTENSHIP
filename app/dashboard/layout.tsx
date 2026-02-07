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
  const logId = Math.random().toString(36).substring(7);
  const totalLabel = `[DashboardLayout] Total Handshake (${logId})`;
  const authLabel = `[DashboardLayout] 1. Auth/Clerk Fetch (${logId})`;
  const dataLabel = `[DashboardLayout] 2. Parallel Data Fetch (${logId})`;
  const syncLabel = `[DashboardLayout] 3. Profile Sync Process (${logId})`;

  console.time(totalLabel);
  console.time(authLabel);
  const { userId } = await auth();
  if (!userId) redirect("/auth/sign-in");

  const supabase = await createAdminClient();
  console.timeEnd(authLabel);

  console.time(dataLabel);
  // Parallel Fetch: Profile + Settings + Onboarding + Terms + Latest Release
  const [clerkUser, profileRes, settingsRes, termsRes, progressRes, latestLogRes] = await Promise.all([
    currentUser(),
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("api_settings").select("setting_value").eq("setting_key", "portal_settings").maybeSingle(),
    supabase.from("terms_acceptances").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("onboarding_progress").select("is_completed").eq("user_id", userId).maybeSingle(),
    supabase.from("changelogs").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle()
  ]);
  console.timeEnd(dataLabel);

  if (settingsRes.data?.setting_value && Object.keys(settingsRes.data.setting_value).length === 0) {
    console.warn(`[DashboardLayout] (${logId}) WARNING: portal_settings came back as an EMPTY OBJECT! This hides UI cards.`);
  }

  if (!clerkUser) redirect("/auth/sign-in");

  console.time(syncLabel);
  // CRITICAL: Ensure profile is synced to Supabase as soon as they reach the dashboard
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
  console.timeEnd(syncLabel);

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

  console.timeEnd(totalLabel);

  return (
    <AblyClientProvider userId={userId}>
      <NotificationEngineProvider
        role={profileRes.data?.role}
        serverLatestLog={latestLogRes.data}
        serverSettings={settingsRes.data?.setting_value}
      >
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
