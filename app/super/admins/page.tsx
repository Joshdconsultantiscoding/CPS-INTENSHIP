import { createAdminClient } from "@/lib/supabase/server";
import { SuperAdminShellV2 } from "@/components/super/super-admin-shell-v2";
import { AdminTable } from "@/components/super/admin-table";
import { CreateAdminDialog } from "@/components/super/create-admin-dialog";
import { UserCog } from "lucide-react";

// ============================================================
// SUPER ADMIN — ADMINS PAGE — /super/admins
// This is a NEW route. Does NOT modify any existing routes.
// ============================================================

export const dynamic = "force-dynamic";

export default async function SuperAdminsPage() {
    let admins: any[] = [];

    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("admins")
            .select("*, workspace:workspaces(*)")
            .order("created_at", { ascending: false });

        if (!error && data) {
            admins = data;
        }
    } catch (err) {
        // Table might not exist yet — safe fallback
        console.error("[SuperAdmins] Fetch error:", err);
    }

    return (
        <SuperAdminShellV2>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Admin Management
                        </h1>
                        <p className="text-gray-400 mt-1">
                            Create and manage admin accounts with auto-generated workspace
                            portals.
                        </p>
                    </div>
                    <CreateAdminDialog />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Total Admins</span>
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                <UserCog className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{admins.length}</p>
                    </div>
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Active</span>
                        </div>
                        <p className="text-2xl font-bold text-green-400">
                            {admins.filter((a) => a.is_active).length}
                        </p>
                    </div>
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Disabled</span>
                        </div>
                        <p className="text-2xl font-bold text-red-400">
                            {admins.filter((a) => !a.is_active).length}
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-gray-900 border border-white/5 rounded-xl p-6">
                    <AdminTable admins={admins} />
                </div>
            </div>
        </SuperAdminShellV2>
    );
}
