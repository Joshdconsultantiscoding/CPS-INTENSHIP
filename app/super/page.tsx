import { getAllWorkspaces } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase/server";
import { SuperAdminShell } from "@/components/super/super-admin-shell";
import {
    Building2,
    Users,
    Activity,
    Shield,
    UserCog,
    GraduationCap,
    Briefcase,
    UserCheck,
} from "lucide-react";
import Link from "next/link";

// ============================================================
// SUPER ADMIN DASHBOARD — /super
// Upgraded to show all platform components.
// ============================================================

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
    const supabase = await createAdminClient();

    // Fetch platform-wide stats in parallel
    const [
        workspaces,
        { count: totalUsers },
        { count: totalAdmins },
        { count: totalMentors },
        { count: totalCompanies },
        { count: totalInterns },
    ] = await Promise.all([
        getAllWorkspaces(),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("admins").select("*", { count: "exact", head: true }),
        supabase.from("mentors").select("*", { count: "exact", head: true }),
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("intern_pool").select("*", { count: "exact", head: true }),
    ]);

    const stats = [
        { label: "Total Users", value: totalUsers || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
        { label: "Admins", value: totalAdmins || 0, icon: UserCog, color: "text-red-400", bg: "bg-red-400/10" },
        { label: "Workspaces", value: workspaces.length, icon: Building2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        { label: "Intern Pool", value: totalInterns || 0, icon: UserCheck, color: "text-purple-400", bg: "bg-purple-400/10" },
    ];

    return (
        <SuperAdminShell>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Platform Control Center</h1>
                        <p className="text-gray-400 mt-1">
                            Operational overview of the global CPS InternHub network.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">System Live</span>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-gray-900 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <Activity className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Workspaces */}
                    <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                                Active Workspaces
                            </h2>
                            <Link
                                href="/super/workspaces"
                                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                            >
                                View Detailed List →
                            </Link>
                        </div>

                        {workspaces.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="w-10 h-10 text-gray-800 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No workspaces active at this time.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-white/5">
                                            <th className="text-left py-3 px-6 text-gray-400 font-bold uppercase tracking-tight">Entity</th>
                                            <th className="text-left py-3 px-6 text-gray-400 font-bold uppercase tracking-tight">Access Key</th>
                                            <th className="text-left py-3 px-6 text-gray-400 font-bold uppercase tracking-tight">Classification</th>
                                            <th className="text-left py-3 px-6 text-gray-400 font-bold uppercase tracking-tight">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {workspaces.slice(0, 7).map((ws) => (
                                            <tr key={ws.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center font-bold text-gray-500 uppercase">
                                                            {ws.name.charAt(0)}
                                                        </div>
                                                        <span className="text-white font-medium group-hover:text-indigo-400 transition-colors">{ws.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-gray-500 font-mono italic">/w/{ws.slug}</td>
                                                <td className="py-4 px-6">
                                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize font-medium">
                                                        {ws.type}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1.5 ${ws.is_active ? "text-green-400" : "text-red-400"}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${ws.is_active ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-red-400"}`} />
                                                        {ws.is_active ? "Live" : "Locked"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Quick Access Grid */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Management Hub</h2>
                        <div className="grid grid-cols-1 gap-3">
                            <Link href="/super/admins" className="flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 transition-all group">
                                <div className="p-2 rounded-lg bg-red-400/10 group-hover:bg-red-400/20 transition-colors text-red-400">
                                    <UserCog className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">Admin Portals</p>
                                    <p className="text-[10px] text-gray-500">Manage high-level access</p>
                                </div>
                            </Link>

                            <Link href="/super/mentors" className="flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                                <div className="p-2 rounded-lg bg-emerald-400/10 group-hover:bg-emerald-400/20 transition-colors text-emerald-400">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Mentor Hub</p>
                                    <p className="text-[10px] text-gray-500">Coordinate platform educators</p>
                                </div>
                            </Link>

                            <Link href="/super/companies" className="flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
                                <div className="p-2 rounded-lg bg-blue-400/10 group-hover:bg-blue-400/20 transition-colors text-blue-400">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Company Partners</p>
                                    <p className="text-[10px] text-gray-500">Manage recruitment partners</p>
                                </div>
                            </Link>

                            <Link href="/super/interns" className="flex items-center gap-4 p-4 rounded-xl bg-gray-900 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
                                <div className="p-2 rounded-lg bg-purple-400/10 group-hover:bg-purple-400/20 transition-colors text-purple-400">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Intern Pool</p>
                                    <p className="text-[10px] text-gray-500">Global talent management</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminShell>
    );
}
