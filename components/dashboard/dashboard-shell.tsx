"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { MobileNav } from "./mobile-nav";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

  // Check Onboarding Progress
  React.useEffect(() => {
    async function checkOnboarding() {
      if (!user?.id) return;

      const supabase = createClient();

      // 1. Check Terms
      const { data: terms } = await supabase
        .from("terms_acceptances")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!terms) {
        setOnboardingStatus("terms");
        return;
      }

      // 2. Check Onboarding
      const { data: progress } = await supabase
        .from("onboarding_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!progress || !progress.is_completed) {
        setIsReturningUser(false);
        setOnboardingStatus("welcome");
      } else {
        setIsReturningUser(true);
        setOnboardingStatus("welcome");
      }
    }

    if (isLoaded && user) {
      checkOnboarding();
    }
  }, [user, isLoaded]);

  React.useEffect(() => {
    if (serverProfile) {
      if (profile !== serverProfile) setProfile(serverProfile);
      return;
    }

    async function fetchProfile() {
      if (!user?.id) return;

      const ADMIN_EMAIL = "agbojoshua2005@gmail.com";
      const isAdminEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        if (isAdminEmail) {
          setProfile({ ...data, role: "admin" });
        } else {
          setProfile(data);
        }
      } else if (isAdminEmail) {
        // Fallback if profile doesn't exist yet but email is admin
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
      fetchProfile();
    }
  }, [user, isLoaded]);

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
