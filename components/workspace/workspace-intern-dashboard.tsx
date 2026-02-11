"use client";

import React from "react";
import { CheckSquare, FileText, BarChart3, Clock } from "lucide-react";

// ============================================================
// WORKSPACE INTERN DASHBOARD — Independent dashboard for workspace interns
// This is a NEW component. Does NOT modify existing InternDashboard.
// ============================================================

interface WorkspaceInternDashboardProps {
    workspaceName: string;
    internName: string;
    stats: {
        totalTasks: number;
        completedTasks: number;
        pendingReports: number;
        streak: number;
    };
}

export function WorkspaceInternDashboard({
    workspaceName,
    internName,
    stats,
}: WorkspaceInternDashboardProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">
                    Hey, {internName} 👋
                </h1>
                <p className="text-gray-400 mt-1">
                    Your internship dashboard at{" "}
                    <span className="text-indigo-400 font-medium">{workspaceName}</span>
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs text-gray-400">Tasks</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.totalTasks}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {stats.completedTasks} completed
                    </p>
                </div>
                <div className="bg-gray-900 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-gray-400">Reports</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.pendingReports}</p>
                    <p className="text-xs text-gray-500 mt-0.5">pending review</p>
                </div>
                <div className="bg-gray-900 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-gray-400">Streak</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.streak} days</p>
                    <p className="text-xs text-gray-500 mt-0.5">keep it up!</p>
                </div>
                <div className="bg-gray-900 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-400">Progress</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                        {stats.totalTasks > 0
                            ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                            : 0}
                        %
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">completion rate</p>
                </div>
            </div>

            {/* Content placeholder */}
            <div className="bg-gray-900 border border-white/5 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Your Tasks</h2>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckSquare className="w-10 h-10 text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">
                        Tasks assigned to you will appear here.
                    </p>
                </div>
            </div>
        </div>
    );
}
