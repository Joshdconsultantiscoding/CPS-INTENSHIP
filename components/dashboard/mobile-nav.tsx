"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MoreHorizontal, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { internNavItems, adminNavItems } from "@/lib/navigation";
import { useLoading } from "@/hooks/use-loading";
import { usePortalSettings, type PortalSettings } from "@/hooks/use-portal-settings";

interface MobileNavProps {
  isAdmin: boolean;
}

export function MobileNav({ isAdmin }: MobileNavProps) {
  const pathname = usePathname();
  const { settings: portalSettings } = usePortalSettings();
  const { showLoader } = useLoading();

  // Define which items should be in the primary bottom bar
  const primaryTitles = isAdmin
    ? ["Home", "Dashboard", "Interns", "Reports", "Messages"]
    : ["Home", "Dashboard", "Tasks", "Messages"];

  // Get full list of nav items and filter by portal settings
  const allItems = (isAdmin ? adminNavItems : internNavItems).filter(item => {
    if (isAdmin) return true;
    const settingKey = item.settingKey as keyof PortalSettings | undefined;
    if (settingKey && portalSettings[settingKey] === false) {
      return false;
    }
    return true;
  });

  // Items for the bottom bar (limited to 4 to leave room for "More")
  const primaryNavItems = allItems
    .filter(item => primaryTitles.includes(item.title))
    .slice(0, 4);

  // Everything else goes to "More"
  const moreItems = allItems.filter(item => !primaryNavItems.some(p => p.title === item.title));

  const handleNavClick = (e: React.MouseEvent, title: string) => {
    if (title === "Send Feedback") {
      window.dispatchEvent(new CustomEvent("open-bug-report"));
    } else {
      // For normal links, show the cinematic loader
      showLoader();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-inset">
      <div className="flex items-center justify-around h-16 px-2">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.url ||
            (item.url !== "/dashboard" && pathname.startsWith(item.url));

          return (
            <Link
              key={item.title}
              href={item.url}
              onClick={(e) => handleNavClick(e, item.title)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-target transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{item.title === "Dashboard" ? "Home" : item.title}</span>
            </Link>
          );
        })}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-target text-muted-foreground hover:text-foreground transition-colors"
              suppressHydrationWarning
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-56 mb-2 rounded-xl p-1 shadow-2xl border-zinc-200"
          >
            {moreItems.map((item) => (
              <DropdownMenuItem key={item.title} asChild className="rounded-lg focus:bg-zinc-100 focus:text-zinc-900 py-2.5">
                <Link
                  href={item.url}
                  onClick={(e) => handleNavClick(e, item.title)}
                  className="w-full cursor-pointer flex items-center gap-3"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{item.title}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            <div className="h-px bg-border my-1" />
            <DropdownMenuItem asChild className="rounded-lg focus:bg-zinc-100 focus:text-zinc-900 py-2.5">
              <Link
                href="/profile/me"
                onClick={(e) => handleNavClick(e, "My Profile")}
                className="w-full cursor-pointer flex items-center gap-3"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">My Profile</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

