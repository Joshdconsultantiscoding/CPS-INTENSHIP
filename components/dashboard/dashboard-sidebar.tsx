"use client";

import { useState, useEffect } from "react";
import { useAbly } from "@/providers/ably-provider";

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
  useSidebar,
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
  ChevronUp,
  Bell,
  Settings,
  LogOut,
  Bug,
  Send,
  Sparkles,
  Rocket,
} from "lucide-react";
import { usePortalSettings, type PortalSettings } from "@/hooks/use-portal-settings";
import Link from "next/link";
import { internNavItems, adminNavItems } from "@/lib/navigation";
import { useLoading } from "@/hooks/use-loading";
import { Badge } from "@/components/ui/badge";

interface DashboardSidebarProps {
  userId: string;
  profile: Profile | null;
}

export function DashboardSidebar({ userId, profile: initialProfile }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { settings: portalSettings } = usePortalSettings();
  const { setOpenMobile, isMobile } = useSidebar();
  const { client: ablyClient } = useAbly(); // Use global Ably hook
  const { showLoader } = useLoading();

  // Real-time Profile State
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [latestVersion, setLatestVersion] = useState<string>("v0.0.0");

  // Fetch latest version for NEW badges
  useEffect(() => {
    fetch("/api/changelogs/latest")
      .then(res => res.json())
      .then(data => {
        if (data?.version) setLatestVersion(data.version);
      })
      .catch(() => { });
  }, []);

  const hasUnseenUpdates = profile?.last_seen_version !== latestVersion;

  // Sync with initial props if they change (e.g. server revalidation)
  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  // Listen for real-time profile updates via Ably
  useEffect(() => {
    if (!ablyClient || !userId) return;

    const channel = ablyClient.channels.get("global-updates");

    const handleProfileUpdate = (message: any) => {
      const data = message.data;
      if (data.userId === userId) {
        setProfile(prev => prev ? ({ ...prev, ...data }) : null);
      }
    };

    channel.subscribe("profile-updated", handleProfileUpdate);

    return () => {
      channel.unsubscribe("profile-updated", handleProfileUpdate);
    };
  }, [ablyClient, userId]);

  const isAdmin = profile?.role === "admin";

  const navItems = (isAdmin ? adminNavItems : internNavItems).filter(item => {
    // These are handled in the Quick Actions section
    if (item.title === "Notifications" || item.title === "Settings") return false;

    if (isAdmin) return true;
    const settingKey = item.settingKey as keyof PortalSettings | undefined;
    if (settingKey && portalSettings[settingKey] === false) {
      return false;
    }
    return true;
  });

  const handleNavClick = (e: React.MouseEvent, title?: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }
    if (title === "Send Feedback") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("open-bug-report"));
    } else {
      // For normal links, show the cinematic loader
      showLoader();
    }
  };

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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-background p-1 overflow-hidden border">
                  <img src="/logo.png" alt={portalSettings.company_name} className="size-full object-contain" />
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
                    <Link
                      href={item.url}
                      onClick={(e) => handleNavClick(e, item.title)}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {item.title === "Updates" && hasUnseenUpdates && (
                        <Badge className="ml-auto px-1.5 py-0 text-[10px] bg-primary text-primary-foreground">
                          NEW
                        </Badge>
                      )}
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
                  <Link href="/dashboard/notifications" onClick={(e) => handleNavClick(e, "Notifications")}>
                    <Bell className="size-4" />
                    <span>Notifications</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Send Notification">
                    <Link href="/dashboard/notifications/send" onClick={(e) => handleNavClick(e, "Send Notification")}>
                      <Send className="size-4" />
                      <span>Send Notification</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="/dashboard/settings" onClick={(e) => handleNavClick(e, "Settings")}>
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
                  <Link href="/dashboard/settings" onClick={(e) => handleNavClick(e)}>
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
