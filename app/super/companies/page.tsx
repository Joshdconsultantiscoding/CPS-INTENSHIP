import { createAdminClient } from "@/lib/supabase/server";
import { SuperAdminShellV2 } from "@/components/super/super-admin-shell-v2";
import { CompaniesTable } from "@/components/super/companies-table";
import { Briefcase } from "lucide-react";

// ============================================================
// SUPER ADMIN — COMPANIES PAGE — /super/companies
// This is a NEW route. Does NOT modify any existing routes.
// ============================================================

export const dynamic = "force-dynamic";

export default async function SuperCompaniesPage() {
    let companies: any[] = [];

    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from("companies")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) companies = data;
    } catch (err) {
        console.error("[SuperCompanies] Fetch error:", err);
    }

    return (
        <SuperAdminShellV2>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Company Management</h1>
                        <p className="text-gray-400 mt-1">Manage companies that hire interns from the platform.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Total Companies</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white">{companies.length}</p>
                    </div>
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <span className="text-sm text-gray-400">Active</span>
                        <p className="text-2xl font-bold text-green-400 mt-2">{companies.filter((c) => c.is_active).length}</p>
                    </div>
                    <div className="bg-gray-900 border border-white/5 rounded-xl p-5">
                        <span className="text-sm text-gray-400">Total Hires</span>
                        <p className="text-2xl font-bold text-amber-400 mt-2">{companies.reduce((sum, c) => sum + (c.total_hires || 0), 0)}</p>
                    </div>
                </div>

                <div className="bg-gray-900 border border-white/5 rounded-xl p-6">
                    <CompaniesTable companies={companies} />
                </div>
            </div>
        </SuperAdminShellV2>
    );
}
