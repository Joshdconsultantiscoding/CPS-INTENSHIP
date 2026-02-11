"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    FileText,
    GraduationCap,
    BarChart3,
    Settings,
    Menu,
    X,
    ChevronLeft,
} from "lucide-react";

// ============================================================
// WORKSPACE SHELL — Independent dashboard shell for workspace portals
// This is a NEW component. Does NOT reuse or modify DashboardShell.
// ============================================================

interface WorkspaceShellProps {
    workspaceName: string;
    workspaceSlug: string;
    memberRole: string;
    children: React.ReactNode;
}

const adminNavItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "" },
    { title: "Interns", icon: Users, path: "/interns" },
    { title: "Tasks", icon: CheckSquare, path: "/tasks" },
    { title: "Reports", icon: FileText, path: "/reports" },
    { title: "Classroom", icon: GraduationCap, path: "/classroom" },
    { title: "Analytics", icon: BarChart3, path: "/analytics" },
    { title: "Settings", icon: Settings, path: "/settings" },
];

export function WorkspaceShell({
    workspaceName,
    workspaceSlug,
    memberRole,
    children,
}: WorkspaceShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const basePath = `/w/${workspaceSlug}/admin`;

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-white/5 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-5 border-b border-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                                {workspaceName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold truncate">
                                    {workspaceName}
                                </h2>
                                <p className="text-xs text-gray-500 capitalize">{memberRole}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {adminNavItems.map((item) => {
                            const href = `${basePath}${item.path}`;
                            const isActive =
                                item.path === ""
                                    ? pathname === basePath
                                    : pathname.startsWith(href);

                            return (
                                <Link
                                    key={item.title}
                                    href={href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? "bg-indigo-600/20 text-indigo-400"
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
                            href="/portal-router"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Switch Portal
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-white/5 lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 text-gray-400 hover:text-white"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 hidden sm:block">
                            Workspace Portal
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
