"use client";

import { useState, useEffect } from "react";
import { useAbly } from "@/providers/ably-provider";

import type { Profile } from "@/lib/types";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";

import { version } from "../../package.json";

interface DashboardHeaderProps {
  userId: string;
  profile: Profile | null;
}

const pathTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/tasks": "Tasks",
  "/dashboard/reports": "Daily Reports",
  "/dashboard/reports/new": "New Report",
  "/dashboard/messages": "Messages",
  "/dashboard/events": "Events",
  "/dashboard/calendar": "Calendar",
  "/dashboard/performance": "Performance",
  "/dashboard/analytics": "Analytics",
  "/dashboard/referrals": "Referrals",
  "/dashboard/rewards": "Rewards",
  "/dashboard/assistant": "AI Assistant",
  "/dashboard/interns": "Interns",
  "/dashboard/notifications": "Notifications",
  "/dashboard/community": "Communities",
  "/dashboard/settings": "Settings",
  "/dashboard/classroom": "Classroom",
  "/dashboard/classroom/courses": "Course Marketplace",
  "/dashboard/updates": "Product Updates",
  "/dashboard/admin/classroom": "Class Management Center",
  "/dashboard/admin/portal-settings": "Portal Settings",
  "/dashboard/admin/community": "Communities",
  "/dashboard/admin/releases": "Manage Updates",
  "/dashboard/certificates": "Certificate Management",
  "/dashboard/admin/ai-engine": "AI Engine",
};

import { useNotifications } from "@/components/notifications/notification-engine";
import { Rocket } from "lucide-react";


export function DashboardHeader({ userId, profile: initialProfile }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { client: ablyClient } = useAbly();
  const { latestChangelog } = useNotifications();

  // Real-time Profile State
  const [profile, setProfile] = useState<Profile | null>(initialProfile);

  // Sync with initial props
  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  // Listen for real-time profile updates via Ably
  useEffect(() => {
    if (!ablyClient || !userId) return;

    const channel = ablyClient.channels.get("global-updates");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleProfileUpdate = (message: any) => {
      const data = message.data;
      if (data.userId === userId) {
        setProfile((prev) => prev ? ({ ...prev, ...data }) : null);
      }
    };

    channel.subscribe("profile-updated", handleProfileUpdate);

    return () => {
      channel.unsubscribe("profile-updated", handleProfileUpdate);
    };
  }, [ablyClient, userId]);

  // Custom logic for dynamic or deep paths
  const getDynamicTitle = (path: string) => {
    if (pathTitles[path]) return pathTitles[path];

    if (path.startsWith("/dashboard/admin/classroom/classes/") && path.endsWith("/edit")) {
      return "Class Management Dashboard";
    }
    if (path.startsWith("/dashboard/admin/classroom/courses/") && path.endsWith("/edit")) {
      return "Course Editor";
    }

    if (path.includes("/tasks/")) return "Task Details";
    if (path.includes("/reports/")) return "Report Details";
    if (path.includes("/classroom/courses/") && path !== "/dashboard/classroom/courses") return "Course Details";
    if (path.includes("/classroom/lessons/")) return "Learning Session";
    if (path.includes("/classroom/lessons/")) return "Learning Session";
    if (path.startsWith("/dashboard/community/")) return "Communities";
    if (path.startsWith("/profile/")) return "Profile";

    return "Dashboard";
  };

  const currentTitle = getDynamicTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-3 sm:px-4">
      <SidebarTrigger className="-ml-1 h-9 w-9 touch-target" />
      <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
      <Breadcrumb className="flex-1 min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:block">
            <BreadcrumbLink href="/dashboard" className="text-sm">
              {profile?.role?.toLowerCase() === "admin" ? "Admin" : "Intern"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathname !== "/dashboard" && (
            <>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate text-sm font-medium">
                  {currentTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {pathname === "/dashboard" && (
            <BreadcrumbItem className="sm:hidden">
              <BreadcrumbPage className="text-sm font-medium">
                {profile?.role?.toLowerCase() === "admin" ? "Admin Dashboard" : "Dashboard"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-3">
        {/* Version Badge & PWA Status Sync */}
        <div className="flex flex-col items-end justify-center">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
            <Rocket className="h-3 w-3 text-primary/60" />
            <span className="text-[10px] font-bold tracking-tight text-primary/80">
              {(() => {
                const v = latestChangelog?.version || version;
                return v.startsWith('v') ? v : `v${v}`;
              })()}
            </span>
          </div>
          <span className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground/40 mt-0.5 hidden sm:block">
            PWA Sync Pending
          </span>
        </div>

        <Separator orientation="vertical" className="h-4 mx-1" />
        <NotificationBell />
        <ModeToggle />
      </div>
    </header>
  );
}
