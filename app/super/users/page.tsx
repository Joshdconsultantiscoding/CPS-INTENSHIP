import { SuperAdminShell } from "@/components/super/super-admin-shell";
import { createAdminClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";

export default async function SuperUsersPage() {
    const supabase = await createAdminClient();

    const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

    const users = profiles || [];

    return (
        <SuperAdminShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">All Users</h1>
                    <p className="text-gray-400 mt-1">
                        View all registered users across the platform.
                    </p>
                </div>

                <div className="bg-gray-900 border border-white/5 rounded-xl p-6">
                    {users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">No Users Yet</h3>
                            <p className="text-gray-400 text-sm">Users will appear here as they sign up.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u: any) => (
                                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                                                        {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-white font-medium">
                                                        {u.full_name || "Unnamed"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-400 text-xs">{u.email || "—"}</td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600/20 text-indigo-400 capitalize">
                                                    {u.role || "unknown"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-500 text-xs">
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </SuperAdminShell>
    );
}
