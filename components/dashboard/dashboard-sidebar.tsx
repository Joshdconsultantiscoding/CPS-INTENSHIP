"use client";

import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import type { Profile } from "@/lib/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  MessageSquare,
  BarChart3,
  Trophy,
  Calendar,
  Settings,
  LogOut,
  Briefcase,
  Users,
  Users2,
  Sparkles,
  ChevronUp,
  Bell,
  CalendarDays, // New icon for Events
  GraduationCap,
} from "lucide-react";
import { usePortalSettings, type PortalSettings } from "@/hooks/use-portal-settings";
import Link from "next/link";

interface DashboardSidebarProps {
  userId: string;
  profile: Profile | null;
}

const internNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    title: "Daily Reports",
    url: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "Messages",
    url: "/dashboard/messages",
    icon: MessageSquare,
  },
  {
    title: "Community",
    url: "/dashboard/community",
    icon: Users2,
  },
  {
    title: "Classroom",
    url: "/dashboard/classroom",
    icon: GraduationCap,
  },
  {
    title: "Events",
    url: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Performance",
    url: "/dashboard/performance",
    icon: BarChart3,
  },
  {
    title: "Rewards",
    url: "/dashboard/rewards",
    icon: Trophy,
  },
  {
    title: "AI Assistant",
    url: "/dashboard/assistant",
    icon: Sparkles,
  },
];

const adminNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Interns",
    url: "/dashboard/interns",
    icon: Users,
  },
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "Messages",
    url: "/dashboard/messages",
    icon: MessageSquare,
  },
  {
    title: "Community",
    url: "/dashboard/community",
    icon: Users2,
  },
  {
    title: "Classroom",
    url: "/dashboard/classroom",
    icon: GraduationCap,
  },
  {
    title: "Events",
    url: "/dashboard/events",
    icon: CalendarDays,
  },
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Rewards",
    url: "/dashboard/rewards",
    icon: Trophy,
  },
  {
    title: "AI Assistant",
    url: "/dashboard/assistant",
    icon: Sparkles,
  },
  {
    title: "Portal Settings",
    url: "/dashboard/admin/portal-settings",
    icon: Settings,
  },
];

export function DashboardSidebar({ userId, profile }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { settings: portalSettings } = usePortalSettings();
  const isAdmin = profile?.role === "admin";

  const settingKeyMap: Record<string, keyof PortalSettings | null> = {
    "Dashboard": null,
    "Interns": null,
    "Tasks": "tasks_enabled",
    "Daily Reports": "reports_enabled",
    "Reports": "reports_enabled",
    "Messages": "messages_enabled",
    "Events": "calendar_enabled",
    "Calendar": "calendar_enabled", // Share restriction with calendar for now, or add new setting later
    "Analytics": "performance_enabled",
    "Performance": "performance_enabled",
    "Rewards": "rewards_enabled",
    "AI Assistant": "ai_assistant_enabled",
    "Portal Settings": null,
  };

  const navItems = (isAdmin ? adminNavItems : internNavItems).filter(item => {
    if (isAdmin) return true;
    const settingKey = settingKeyMap[item.title];
    if (settingKey && portalSettings[settingKey] === false) {
      return false;
    }
    return true;
  });

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/auth/sign-in" });
  };

  const getInitials = (name: string | null) => {
    if (!name) return user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
                  {portalSettings.company_logo_url ? (
                    <img src={portalSettings.company_logo_url} alt={portalSettings.company_name} className="size-full object-cover" />
                  ) : (
                    <Briefcase className="size-4" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{portalSettings.company_name || "InternHub"}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {isAdmin ? "Admin Portal" : "Intern Portal"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.url ||
                      (item.url !== "/dashboard" &&
                        pathname.startsWith(item.url))
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Notifications">
                  <Link href="/dashboard/notifications">
                    <Bell className="size-4" />
                    <span>Notifications</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="/dashboard/settings">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  suppressHydrationWarning
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={profile?.avatar_url || ""}
                      alt={profile?.full_name || "User"}
                    />
                    <AvatarFallback className="rounded-lg">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {profile?.first_name} {profile?.last_name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground" suppressHydrationWarning>
                      {user?.emailAddresses[0]?.emailAddress}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={profile?.avatar_url || ""}
                        alt={profile?.full_name || "User"}
                      />
                      <AvatarFallback className="rounded-lg">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {profile?.first_name} {profile?.last_name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {profile?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
