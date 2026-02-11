import { createAdminClient } from "@/lib/supabase/server";
import { SuperAdminShell } from "@/components/super/super-admin-shell";
import {
    Users,
    Building2,
    TrendingUp,
    Clock,
    UserCog,
    GraduationCap,
    Briefcase,
    UserCheck,
    BarChart
} from "lucide-react";

// ============================================================
// SUPER ADMIN — ANALYTICS — /super/analytics
// Real-time metrics and growth tracking for the platform.
// This page is now synced with the functional V2 implementation.
// ============================================================

export const dynamic = "force-dynamic";

export default async function SuperAnalyticsPage() {
    const supabase = await createAdminClient();

    // 1. Fetch High Level Totals
    const [
        { count: totalUsers },
        { count: totalWorkspaces },
        { count: totalAdmins },
        { count: totalMentors },
        { count: totalCompanies },
        { count: totalInterns },
    ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("workspaces").select("*", { count: "exact", head: true }),
        supabase.from("admins").select("*", { count: "exact", head: true }),
        supabase.from("mentors").select("*", { count: "exact", head: true }),
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("intern_pool").select("*", { count: "exact", head: true }),
    ]);

    // 2. Fetch Workspace Type Breakdown
    const { data: workspaceData } = await supabase
        .from("workspaces")
        .select("type");

    const wsTypeCounts = (workspaceData || []).reduce((acc: any, ws) => {
        acc[ws.type] = (acc[ws.type] || 0) + 1;
        return acc;
    }, {});

    // 3. Fetch Recent Platform Activity (System Logs)
    const { data: recentLogs } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

    // 4. User Acquisition (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentUsers } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString());

    const dailyGrowth = (recentUsers || []).reduce((acc: any, u) => {
        const date = new Date(u.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const stats = [
        { label: "Total Users", value: totalUsers || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
        { label: "Workspaces", value: totalWorkspaces || 0, icon: Building2, color: "text-indigo-400", bg: "bg-indigo-400/10" },
        { label: "Admins", value: totalAdmins || 0, icon: UserCog, color: "text-red-400", bg: "bg-red-400/10" },
        { label: "Interns", value: totalInterns || 0, icon: UserCheck, color: "text-purple-400", bg: "bg-purple-400/10" },
    ];

    return (
        <SuperAdminShell>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-white">Platform Insights</h1>
                    <p className="text-gray-400 mt-1">
                        Real-time tracking of growth, engagement, and system health.
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-gray-900 border border-white/5 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <span className="text-xs text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Live
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Workspace Distribution */}
                    <div className="lg:col-span-1 bg-gray-900 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <BarChart className="w-5 h-5 text-indigo-400" />
                            Workspace Types
                        </h3>
                        <div className="space-y-5">
                            {['admin', 'mentor', 'company', 'recruiter', 'ai'].map((type) => {
                                const count = wsTypeCounts[type] || 0;
                                const total = totalWorkspaces || 1;
                                const percentage = Math.round((count / total) * 100);

                                const getIcon = (t: string) => {
                                    if (t === 'admin') return UserCog;
                                    if (t === 'mentor') return GraduationCap;
                                    if (t === 'company') return Briefcase;
                                    return Building2;
                                };
                                const Icon = getIcon(type);

                                return (
                                    <div key={type} className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2 text-gray-300 capitalize">
                                                <Icon className="w-4 h-4 opacity-50" />
                                                {type}
                                            </div>
                                            <span className="text-white font-medium">{count}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-red-400" />
                                System Activity
                            </h3>
                            <span className="text-xs text-gray-500">Auto-updating</span>
                        </div>
                        <div className="space-y-4">
                            {recentLogs && recentLogs.length > 0 ? (
                                recentLogs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.action.includes('delete') ? 'bg-red-500' :
                                            log.action.includes('create') || log.action.includes('add') ? 'bg-green-500' : 'bg-blue-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white">
                                                {log.action.replace(/_/g, ' ')}
                                                <span className="text-gray-500 font-normal ml-2">by {log.actor}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate uppercase tracking-tight">
                                                {log.target_type}: {log.target_id}
                                            </p>
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-medium shrink-0">
                                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    No recent logs found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Growth Chart */}
                <div className="bg-gray-900 border border-white/5 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-white">User Growth</h3>
                            <p className="text-sm text-gray-500 mt-1">Daily registration volume across all portals.</p>
                        </div>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {Object.entries(dailyGrowth).slice(-7).map(([date, count]: [string, any]) => {
                            const max = Math.max(...Object.values(dailyGrowth) as number[]) || 1;
                            const height = Math.max(10, Math.round((count / max) * 100));
                            return (
                                <div key={date} className="flex-1 flex flex-col items-center gap-3">
                                    <div
                                        className="w-full bg-gradient-to-t from-indigo-600/20 to-indigo-500 rounded-t-lg transition-all duration-1000 ease-out flex items-center justify-center"
                                        style={{ height: `${height}%` }}
                                    >
                                        <span className="text-[10px] font-bold text-white mb-auto mt-2">{count}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-medium rotate-45 sm:rotate-0 mt-2">{date.split('/')[0]}/{date.split('/')[1]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </SuperAdminShell>
    );
}
