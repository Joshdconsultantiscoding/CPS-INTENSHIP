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
import { BugReportFab } from "@/components/bug-reports/bug-report-fab";
import { RealTimeStatsSync } from "./real-time-stats-sync";
import { useLoading } from "@/hooks/use-loading";

interface DashboardShellProps {
  children: React.ReactNode;
  serverProfile?: Profile | null;
  serverSettings?: PortalSettings;
  serverOnboarding?: {
    hasAcceptedTerms: boolean;
    isCompleted: boolean;
  };
  serverUser?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string;
  };
}

type OnboardingState = "checking" | "terms" | "welcome" | "flow" | "completed";

export function DashboardShell({
  children,
  serverProfile,
  serverSettings,
  serverOnboarding,
  serverUser
}: DashboardShellProps) {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = React.useState<Profile | null>(serverProfile || null);

  // Initialize state from server data if available
  const [onboardingStatus, setOnboardingStatus] = React.useState<OnboardingState>(() => {
    if (serverOnboarding) {
      if (!serverOnboarding.hasAcceptedTerms) return "terms";
      if (!serverOnboarding.isCompleted) return "welcome";
      return "completed";
    }
    return "checking";
  });

  const [sessionTermsAccepted, setSessionTermsAccepted] = React.useState(false); // Alway false on mount to force per-session check for interns
  const [isReturningUser, setIsReturningUser] = React.useState(serverOnboarding?.isCompleted || false);
  const { setIsLoading } = useLoading();

  // Presence is now handled globally by AblyClientProvider

  // Check Onboarding & Fetch Profile
  React.useEffect(() => {
    async function initDashboardData() {
      if (!user?.id) return;

      const supabase = createClient();
      const ADMIN_EMAIL = config.adminEmail;
      const isAdminEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // Use server data where possible, only fetch what's missing
      const checks = [];

      if (!serverProfile) {
        checks.push(supabase.from("profiles").select("*").eq("id", user.id).single());
      }

      if (!serverOnboarding) {
        checks.push(supabase.from("terms_acceptances").select("user_id").eq("user_id", user.id).maybeSingle());
        checks.push(supabase.from("onboarding_progress").select("is_completed").eq("user_id", user.id).maybeSingle());
      }

      const results = await Promise.all(checks);
      let profileRes = null;
      let termsRes = null;
      let progressRes = null;

      if (!serverProfile) {
        profileRes = results[0];
        if (!serverOnboarding) {
          termsRes = results[1];
          progressRes = results[2];
        }
      } else if (!serverOnboarding) {
        termsRes = results[0];
        progressRes = results[1];
      }

      // 1. Handle Terms
      if (termsRes) {
        if (!termsRes.data) {
          setOnboardingStatus("terms");
        }
      }
      // Note: We no longer setSessionTermsAccepted(true) here because it's per-session.
      // Acceptance is tracked by the local state and updated via the TermsModal onAccepted callback.

      // 2. Handle Onboarding
      if (progressRes) {
        const progress = progressRes.data;
        if (!progress || !progress.is_completed) {
          setIsReturningUser(false);
          if (termsRes?.data || serverOnboarding?.hasAcceptedTerms) {
            setOnboardingStatus("welcome");
          }
        } else {
          setIsReturningUser(true);
          setOnboardingStatus("completed");
        }
      }

      // 3. Handle Profile
      if (profileRes?.data) {
        if (isAdminEmail) {
          setProfile({ ...profileRes.data, role: "admin" });
        } else {
          setProfile(profileRes.data);
        }
      } else if (isAdminEmail && !profile) {
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
  }, [user, isLoaded, serverProfile]);

  const userId = serverUser?.id || profile?.id || user?.id || "";

  // Consolidate admin check to use profile or serverUser primarily for instant rendering
  const ADMIN_EMAIL = config.adminEmail;
  const userEmail = serverUser?.email || user?.emailAddresses[0]?.emailAddress;
  const isAdmin = profile?.role === "admin" || (userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  // Sync Global Loading State
  React.useEffect(() => {
    // Only show loader if we have NO server data and are waiting for Clerk
    // AND we don't even have a server profile to show
    const shouldShowLoader = (!isLoaded && !serverProfile) || onboardingStatus === "checking";

    if (shouldShowLoader) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }

    return () => setIsLoading(false);
  }, [isLoaded, onboardingStatus, setIsLoading, serverProfile]);

  // Don't render ONLY if we have absolutely no data yet (no clerk AND no server profile)
  if ((!isLoaded && !serverProfile) || onboardingStatus === "checking") {
    return null; // The global LoadingOverlay in root layout will handle the UI
  }

  // Terms must be accepted once per session for interns
  const showTerms = !sessionTermsAccepted && !isAdmin;

  if (showTerms) {
    return (
      <TermsModal
        userId={userId}
        onAccepted={() => {
          setSessionTermsAccepted(true);
          if (onboardingStatus === "terms") {
            setOnboardingStatus(serverOnboarding?.isCompleted ? "completed" : "welcome");
          }
        }}
      />
    );
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
      <RealTimeStatsSync />
      <DashboardSidebar userId={userId} profile={profile} />
      <SidebarInset className="flex flex-col min-h-screen">
        <DashboardHeader userId={userId} profile={profile} />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </SidebarInset>
      <MobileNav isAdmin={isAdmin} />
      <BugReportFab userId={userId} role={profile?.role || 'intern'} />
    </SidebarProvider>
  );
}
