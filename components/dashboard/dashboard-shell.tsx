"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { MobileNav } from "./mobile-nav";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import type { Profile } from "@/lib/types";
import { type PortalSettings } from "@/hooks/use-portal-settings";
import { TermsModal } from "@/components/onboarding/terms-modal";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

interface DashboardShellProps {
  children: React.ReactNode;
  serverProfile?: Profile | null;
  serverSettings?: PortalSettings;
}

type OnboardingState = "checking" | "terms" | "welcome" | "flow" | "completed";

export function DashboardShell({
  children,
  serverProfile,
  serverSettings,
}: DashboardShellProps) {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = React.useState<Profile | null>(serverProfile || null);
  const [onboardingStatus, setOnboardingStatus] = React.useState<OnboardingState>("checking");
  const [sessionTermsAccepted, setSessionTermsAccepted] = React.useState(false);
  const [isReturningUser, setIsReturningUser] = React.useState(false);

  // Presence is now handled globally by AblyClientProvider

  // Check Onboarding & Fetch Profile
  React.useEffect(() => {
    async function initDashboardData() {
      if (!user?.id) return;

      const supabase = createClient();
      const ADMIN_EMAIL = config.adminEmail;
      const isAdminEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // Consolidate all initial checks into parallel requests
      const [termsRes, progressRes, profileRes] = await Promise.all([
        supabase.from("terms_acceptances").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("onboarding_progress").select("is_completed").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).single()
      ]);

      // 1. Handle Terms
      if (!termsRes.data) {
        setOnboardingStatus("terms");
      } else {
        setSessionTermsAccepted(true);
      }

      // 2. Handle Onboarding
      const progress = progressRes.data;
      if (!progress || !progress.is_completed) {
        setIsReturningUser(false);
        if (termsRes.data) setOnboardingStatus("welcome");
      } else {
        setIsReturningUser(true);
        if (termsRes.data) setOnboardingStatus("completed");
      }

      // 3. Handle Profile
      if (profileRes.data) {
        if (isAdminEmail) {
          setProfile({ ...profileRes.data, role: "admin" });
        } else {
          setProfile(profileRes.data);
        }
      } else if (isAdminEmail) {
        setProfile({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress || "",
          first_name: user.firstName || "Admin",
          last_name: user.lastName || "",
          role: "admin",
          avatar_url: user.imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          online_status: 'online'
        } as any as Profile);
      }
    }

    if (isLoaded && user) {
      initDashboardData();
    }
  }, [user, isLoaded]);

  // Consolidated into the Effect above

  const isAdmin = profile?.role === "admin";
  const userId = user?.id || "";

  // Don't render until loaded to prevent hydration mismatch
  if (!isLoaded || onboardingStatus === "checking") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Terms must be accepted once per session for interns
  const showTerms = !sessionTermsAccepted && !isAdmin;

  if (showTerms) {
    return <TermsModal userId={userId} onAccepted={() => setSessionTermsAccepted(true)} />;
  }

  if (onboardingStatus === "welcome") {
    return (
      <WelcomeScreen
        userName={profile?.first_name || user?.firstName || "there"}
        isReturningUser={isReturningUser}
        onNext={() => {
          if (isReturningUser) {
            setOnboardingStatus("completed");
          } else {
            setOnboardingStatus("flow");
          }
        }}
      />
    );
  }

  if (onboardingStatus === "flow") {
    return <OnboardingFlow userId={userId} onComplete={() => setOnboardingStatus("completed")} />;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <DashboardSidebar userId={userId} profile={profile} />
      <SidebarInset className="flex flex-col min-h-screen">
        <DashboardHeader userId={userId} profile={profile} />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </SidebarInset>
      <MobileNav isAdmin={isAdmin} />
    </SidebarProvider>
  );
}
