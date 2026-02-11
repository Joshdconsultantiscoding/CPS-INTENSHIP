"use client";

import React from "react";
import { Users, CheckSquare, FileText, TrendingUp, Clock } from "lucide-react";

// ============================================================
// WORKSPACE ADMIN DASHBOARD — Independent dashboard for workspace admins
// This is a NEW component. Does NOT modify existing AdminDashboard.
// ============================================================

interface WorkspaceAdminDashboardProps {
    workspaceName: string;
    workspaceSlug: string;
    stats: {
        totalInterns: number;
        totalTasks: number;
        pendingReports: number;
        completedTasks: number;
    };
}

function StatCard({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}) {
    return (
        <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">{title}</span>
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className="w-4.5 h-4.5 text-white" />
                </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    );
}

export function WorkspaceAdminDashboard({
    workspaceName,
    workspaceSlug,
    stats,
}: WorkspaceAdminDashboardProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Welcome back 👋
                </h1>
                <p className="text-gray-400 mt-1">
                    Your workspace overview for{" "}
                    <span className="text-indigo-400 font-medium">{workspaceName}</span>
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Interns"
                    value={stats.totalInterns}
                    icon={Users}
                    color="bg-indigo-600"
                />
                <StatCard
                    title="Active Tasks"
                    value={stats.totalTasks}
                    icon={CheckSquare}
                    color="bg-emerald-600"
                />
                <StatCard
                    title="Pending Reports"
                    value={stats.pendingReports}
                    icon={FileText}
                    color="bg-amber-600"
                />
                <StatCard
                    title="Completed Tasks"
                    value={stats.completedTasks}
                    icon={TrendingUp}
                    color="bg-blue-600"
                />
            </div>

            {/* Getting Started Guide */}
            <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">
                    🚀 Getting Started
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                            1
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Invite Interns</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Share your workspace link to onboard interns
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                            2
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Create Tasks</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Assign tasks and track progress in real-time
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                            3
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Review Reports</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Monitor daily reports and provide feedback
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-gray-900 border border-white/5 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Recent Activity
                </h2>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="w-10 h-10 text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">
                        Activity will appear here as your workspace grows.
                    </p>
                </div>
            </div>
        </div>
    );
}
