"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { MobileNav } from "./mobile-nav";
import { usePresence } from "@/hooks/use-presence";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({
  children,
}: DashboardShellProps) {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = React.useState<Profile | null>(null);

  // Use presence hook only when we have a userId
  usePresence(user?.id || "");

  React.useEffect(() => {
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
          full_name: user.fullName || "Admin",
          role: "admin",
          avatar_url: user.imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active',
          online_status: 'online'
        } as Profile);
      }
    }

    if (isLoaded && user) {
      fetchProfile();
    }
  }, [user, isLoaded]);

  const isAdmin = profile?.role === "admin";
  const userId = user?.id || "";

  // Don't render until loaded to prevent hydration mismatch
  if (!isLoaded) {
    return null;
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
