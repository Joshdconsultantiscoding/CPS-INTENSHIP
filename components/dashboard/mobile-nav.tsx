"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  User,
  MoreHorizontal,
  Users,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileNavProps {
  isAdmin: boolean;
}

const internNavItems = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tasks", url: "/dashboard/tasks", icon: CheckSquare },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Profile", url: "/dashboard/settings", icon: User },
];

const adminNavItems = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Interns", url: "/dashboard/interns", icon: Users },
  { title: "Reports", url: "/dashboard/reports", icon: FileText },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
];

const internMoreItems = [
  { title: "Daily Reports", url: "/dashboard/reports", icon: FileText },
  { title: "Calendar", url: "/dashboard/calendar" },
  { title: "Performance", url: "/dashboard/performance" },
  { title: "Rewards", url: "/dashboard/rewards" },
  { title: "AI Assistant", url: "/dashboard/assistant" },
  { title: "Settings", url: "/dashboard/settings" },
];

const adminMoreItems = [
  { title: "Tasks", url: "/dashboard/tasks", icon: CheckSquare },
  { title: "Calendar", url: "/dashboard/calendar" },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Rewards", url: "/dashboard/rewards" },
  { title: "AI Assistant", url: "/dashboard/assistant" },
  { title: "Portal Settings", url: "/dashboard/admin/portal-settings" },
  { title: "Settings", url: "/dashboard/settings" },
];

export function MobileNav({ isAdmin }: MobileNavProps) {
  const pathname = usePathname();
  const navItems = isAdmin ? adminNavItems : internNavItems;
  const moreItems = isAdmin ? adminMoreItems : internMoreItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-inset">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.url ||
            (item.url !== "/dashboard" && pathname.startsWith(item.url));

          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-target transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{item.title}</span>
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
            className="w-48 mb-2"
          >
            {moreItems.map((item) => (
              <DropdownMenuItem key={item.title} asChild>
                <Link href={item.url} className="w-full cursor-pointer">
                  {item.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
