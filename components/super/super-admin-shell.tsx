"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    BarChart3,
    Shield,
    Settings,
    ChevronLeft,
    UserCog,
    GraduationCap,
    Briefcase,
    UserCheck,
} from "lucide-react";

// ============================================================
// SUPER ADMIN SHELL — Upgraded with Extended Navigation
// This component now handles the full Control Center navigation.
// ============================================================

const superNavItems = [
    { title: "Overview", icon: LayoutDashboard, path: "/super" },
    { title: "Admins", icon: UserCog, path: "/super/admins" },
    { title: "Mentors", icon: GraduationCap, path: "/super/mentors" },
    { title: "Companies", icon: Briefcase, path: "/super/companies" },
    { title: "Interns", icon: UserCheck, path: "/super/interns" },
    { title: "Workspaces", icon: Building2, path: "/super/workspaces" },
    { title: "All Users", icon: Users, path: "/super/users" },
    { title: "Analytics", icon: BarChart3, path: "/super/analytics" },
    { title: "Settings", icon: Settings, path: "/super/settings" },
];

interface SuperAdminShellProps {
    children: React.ReactNode;
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-white/5 flex flex-col shrink-0">
                {/* Header */}
                <div className="px-4 py-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                            <Shield className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold">Control Center</h2>
                            <p className="text-xs text-gray-500">Super Admin</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {superNavItems.map((item) => {
                        const isActive =
                            pathname === item.path ||
                            (item.path !== "/super" && pathname.startsWith(item.path));

                        return (
                            <Link
                                key={item.title}
                                href={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                    ? "bg-red-600/20 text-red-400 shadow-sm"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <item.icon className="w-4.5 h-4.5 shrink-0" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-3 py-4 border-t border-white/5">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Admin
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center justify-between px-6 py-3 bg-gray-900/50 border-b border-white/5 shrink-0">
                    <span className="text-xs text-red-400 font-medium uppercase tracking-wider">
                        🔒 Super Admin Control Center
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            System Online
                        </span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
