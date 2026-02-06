import {
    LayoutDashboard,
    CheckSquare,
    FileText,
    MessageSquare,
    BarChart3,
    Trophy,
    Calendar,
    Settings,
    Briefcase,
    Users,
    Users2,
    Sparkles,
    Bell,
    CalendarDays,
    GraduationCap,
    Bug,
    Home,
    LucideIcon,
} from "lucide-react";

export interface NavItem {
    title: string;
    url: string;
    icon: LucideIcon;
    settingKey?: string; // Corresponds to keyof PortalSettings
}

export const internNavItems: NavItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Tasks",
        url: "/dashboard/tasks",
        icon: CheckSquare,
        settingKey: "tasks_enabled",
    },
    {
        title: "Daily Reports",
        url: "/dashboard/reports",
        icon: FileText,
        settingKey: "reports_enabled",
    },
    {
        title: "Messages",
        url: "/dashboard/messages",
        icon: MessageSquare,
        settingKey: "messages_enabled",
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
        settingKey: "calendar_enabled",
    },
    {
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: Calendar,
        settingKey: "calendar_enabled",
    },
    {
        title: "Performance",
        url: "/dashboard/performance",
        icon: BarChart3,
        settingKey: "performance_enabled",
    },
    {
        title: "Rewards",
        url: "/dashboard/rewards",
        icon: Trophy,
        settingKey: "rewards_enabled",
    },
    {
        title: "AI Assistant",
        url: "/dashboard/assistant",
        icon: Sparkles,
        settingKey: "ai_assistant_enabled",
    },
    {
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
    },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
    {
        title: "Send Feedback",
        url: "#",
        icon: Bug,
    },
];



export const adminNavItems: NavItem[] = [
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
        settingKey: "tasks_enabled",
    },
    {
        title: "Reports",
        url: "/dashboard/reports",
        icon: FileText,
        settingKey: "reports_enabled",
    },
    {
        title: "Messages",
        url: "/dashboard/messages",
        icon: MessageSquare,
        settingKey: "messages_enabled",
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
        settingKey: "calendar_enabled",
    },
    {
        title: "Calendar",
        url: "/dashboard/calendar",
        icon: Calendar,
        settingKey: "calendar_enabled",
    },
    {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
        settingKey: "performance_enabled",
    },
    {
        title: "Rewards",
        url: "/dashboard/rewards",
        icon: Trophy,
        settingKey: "rewards_enabled",
    },
    {
        title: "AI Assistant",
        url: "/dashboard/assistant",
        icon: Sparkles,
        settingKey: "ai_assistant_enabled",
    },
    {
        title: "Portal Settings",
        url: "/dashboard/admin/portal-settings",
        icon: Settings,
    },
    {
        title: "Bug Reports",
        url: "/dashboard/admin/bug-reports",
        icon: Bug,
    },
    {
        title: "Community Mgmt",
        url: "/dashboard/admin/community",
        icon: Home,
    },
    {
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
    },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
    {
        title: "Send Feedback",
        url: "#",
        icon: Bug,
    },
];

