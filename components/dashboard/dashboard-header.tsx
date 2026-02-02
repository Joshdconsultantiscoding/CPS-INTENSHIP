"use client";

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
  "/dashboard/rewards": "Rewards",
  "/dashboard/assistant": "AI Assistant",
  "/dashboard/interns": "Interns",
  "/dashboard/notifications": "Notifications",
  "/dashboard/community": "Community",
  "/dashboard/settings": "Settings",
  "/dashboard/classroom": "Classroom",
  "/dashboard/classroom/courses": "Course Marketplace",
  "/dashboard/admin/classroom": "Class Management Center",
  "/dashboard/admin/portal-settings": "Portal Settings",
};

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  const pathname = usePathname();

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

    return "Dashboard";
  };

  const currentTitle = getDynamicTitle(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-3 sm:px-4">
      <SidebarTrigger className="-ml-1 h-9 w-9 touch-target" />
      <Separator orientation="vertical" className="mr-2 h-4" />
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
    </header>
  );
}
