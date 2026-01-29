"use client";

import React from "react";

import type { Profile } from "@/lib/types";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { MobileNav } from "./mobile-nav";
import { usePresence } from "@/hooks/use-presence";

interface DashboardShellProps {
  userId: string;
  profile: Profile | null;
  children: React.ReactNode;
}

export function DashboardShell({
  userId,
  profile,
  children,
}: DashboardShellProps) {
  usePresence(userId);
  const isAdmin = profile?.role === "admin";

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
