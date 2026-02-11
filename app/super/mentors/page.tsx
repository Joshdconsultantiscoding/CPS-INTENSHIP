import { createAdminClient } from "@/lib/supabase/server";
import { SuperAdminShellV2 } from "@/components/super/super-admin-shell-v2";
import { MentorsTable } from "@/components/super/mentors-table";
import { GraduationCap } from "lucide-react";

// ============================================================
// SUPER ADMIN — MENTORS PAGE — /super/mentors
// This is a NEW route. Does NOT modify any existing routes.
// ============================================================

export const dynamic = "force-dynamic";

export default async function SuperMentorsPage() {
    let mentors: any[] = [];

    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("mentors")
            .select("*, workspace:workspaces(*)")
            .order("created_at", { ascending: false });

        if (!error && data) mentors = data;
    } catch (err) {
        console.error("[SuperMentors] Fetch error:", err);
    }

    return (
        <SuperAdminShellV2>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Mentor Management</h1>
                        <p className="text-gray-400 mt-1">Manage platform mentors and their workspace assignments.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Total Mentors</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{mentors.length}</p>
                    </div>
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <span className="text-sm text-gray-400">Active</span>
                        <p className="text-2xl font-bold text-green-400 mt-2">{mentors.filter((m) => m.is_active).length}</p>
                    </div>
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <span className="text-sm text-gray-400">Disabled</span>
                        <p className="text-2xl font-bold text-red-400 mt-2">{mentors.filter((m) => !m.is_active).length}</p>
                    </div>
                </div>

                <div className="bg-gray-900 border border-white/5 rounded-xl p-6">
                    <MentorsTable mentors={mentors} />
                </div>
            </div>
        </SuperAdminShellV2>
    );
}
