import { AblyClientProvider } from "@/providers/ably-provider";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/auth/sign-in");

  const supabase = await createAdminClient();

  // Parallel Fetch: Profile + Settings + Onboarding + Terms + Clerk User to maximize speed
  const [clerkUser, profileRes, settingsRes, termsRes, progressRes] = await Promise.all([
    currentUser(),
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("api_settings").select("setting_value").eq("setting_key", "portal_settings").maybeSingle(),
    supabase.from("terms_acceptances").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("onboarding_progress").select("is_completed").eq("user_id", userId).maybeSingle()
  ]);

  if (!clerkUser) redirect("/auth/sign-in");

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
      <DashboardShell
        serverProfile={profileRes.data}
        serverSettings={settingsRes.data?.setting_value}
        serverOnboarding={serverOnboarding}
        serverUser={serverUser}
      >
        {children}
      </DashboardShell>
    </AblyClientProvider>
  );
}
