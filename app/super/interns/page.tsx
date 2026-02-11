import { createAdminClient } from "@/lib/supabase/server";
import { SuperAdminShellV2 } from "@/components/super/super-admin-shell-v2";
import { InternsTable } from "@/components/super/interns-table";
import { UserCheck, Award } from "lucide-react";

// ============================================================
// SUPER ADMIN — INTERNS PAGE — /super/interns
// This is a NEW route. Does NOT modify any existing routes.
// ============================================================

export const dynamic = "force-dynamic";

export default async function SuperInternsPage() {
    let interns: any[] = [];

    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("intern_pool")
            .select("*, assigned_workspace:workspaces(*)")
            .order("created_at", { ascending: false });

        if (!error && data) interns = data;
    } catch (err) {
        console.error("[SuperInterns] Fetch error:", err);
    }

    const totalPoints = interns.reduce((sum, i) => sum + (i.points || 0), 0);
    const totalCerts = interns.reduce((sum, i) => sum + (i.certificates || 0), 0);
    const assignedCount = interns.filter((i) => i.assigned_workspace_id).length;

    return (
        <SuperAdminShellV2>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Intern Pool</h1>
                        <p className="text-gray-400 mt-1">Global talent pool — manage, assign, and track all interns.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Total Interns</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                                <UserCheck className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{interns.length}</p>
                    </div>
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <span className="text-sm text-gray-400">Assigned</span>
                        <p className="text-2xl font-bold text-indigo-400 mt-2">{assignedCount}</p>
                    </div>
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <span className="text-sm text-gray-400">Total Points</span>
                        <p className="text-2xl font-bold text-amber-400 mt-2">{totalPoints}</p>
                    </div>
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Certificates</span>
                            <Award className="w-4 h-4 text-yellow-400" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-400">{totalCerts}</p>
                    </div>
                </div>

                <div className="bg-gray-900 border border-white/5 rounded-xl p-6">
                    <InternsTable interns={interns} />
                </div>
            </div>
        </SuperAdminShellV2>
    );
}
