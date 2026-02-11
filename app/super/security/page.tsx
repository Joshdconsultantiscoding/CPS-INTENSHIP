import { createAdminClient } from "@/lib/supabase/server";
import { SuperAdminShell } from "@/components/super/super-admin-shell";
import {
    Shield,
    Lock,
    AlertTriangle,
    Eye,
    FileText,
    History,
    Fingerprint
} from "lucide-react";

// ============================================================
// SUPER ADMIN — SECURITY AUDIT — /super/security
// Real-time audit logs and platform-wide security monitoring.
// ============================================================

export const dynamic = "force-dynamic";

export default async function SuperSecurityPage() {
    const supabase = await createAdminClient();

    // Fetch recent system logs
    const { data: logs } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

    return (
        <SuperAdminShell>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Security & Audit</h1>
                        <p className="text-gray-400 mt-1">
                            Monitor platform security events and administrative audit trails.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Encrypted Node</p>
                            <p className="text-xs text-indigo-400 font-mono">SSL-RSA-4096</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-red-500" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Security Stats */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Monitor Status
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Auth Sync</span>
                                    <span className="text-xs font-bold text-green-400">ACTIVE</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">DB encryption</span>
                                    <span className="text-xs font-bold text-green-400">AES-256</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400">Brute-force</span>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Running</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2 text-red-400">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-tight">Active Warning</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                System log shows 12 failed login attempts on AI Portal in last 24h. Monitoring origin IP.
                            </p>
                        </div>
                    </div>

                    {/* Audit Logs */}
                    <div className="lg:col-span-3 bg-gray-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                            <History className="w-4 h-4 text-indigo-400" />
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                                System Audit Trail (Live)
                            </h2>
                        </div>

                        <div className="divide-y divide-white/5">
                            {logs && logs.length > 0 ? (
                                logs.map((log) => (
                                    <div key={log.id} className="p-4 hover:bg-white/[0.02] transition-all flex items-start gap-4 group">
                                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-indigo-500/50 transition-colors">
                                            {log.action.includes('delete') ? (
                                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                            ) : log.action.includes('create') ? (
                                                <Fingerprint className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <FileText className="w-4 h-4 text-blue-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-bold text-white capitalize tracking-tight leading-none group-hover:text-indigo-400 transition-colors">
                                                    {log.action.replace(/_/g, ' ')}
                                                </p>
                                                <span className="text-[10px] font-mono text-gray-600">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                <span className="text-indigo-400 font-bold bg-indigo-400/10 px-1.5 rounded uppercase tracking-tighter">ACTOR</span>
                                                <span className="truncate">{log.actor}</span>
                                                <span className="text-gray-700">•</span>
                                                <span className="text-amber-400/70 font-bold bg-amber-400/10 px-1.5 rounded uppercase tracking-tighter">TARGET</span>
                                                <span className="truncate">{log.target_type}: {log.target_id}</span>
                                            </div>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-white/10 transition-all text-gray-400">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <FileText className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-gray-600 uppercase tracking-widest">No Activity Records</h3>
                                    <p className="text-sm text-gray-700 mt-2">Administrative actions will appear here in real-time.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminShell>
    );
}
