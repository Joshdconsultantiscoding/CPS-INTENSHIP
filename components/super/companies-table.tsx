"use client";

import React, { useState } from "react";
import {
    ToggleLeft,
    ToggleRight,
    Trash2,
    Briefcase,
    Plus,
    Loader2,
    Globe,
} from "lucide-react";

// ============================================================
// COMPANIES TABLE — Client component for company management
// This is a NEW component. Does NOT modify any existing code.
// ============================================================

interface CompanyRecord {
    id: string;
    company_name: string;
    email: string | null;
    industry: string | null;
    website: string | null;
    total_hires: number;
    is_active: boolean;
    created_at: string;
}

interface CompaniesTableProps {
    companies: CompanyRecord[];
}

export function CompaniesTable({ companies: initialCompanies }: CompaniesTableProps) {
    const [companies, setCompanies] = useState(initialCompanies);
    const [loading, setLoading] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ companyName: "", email: "", industry: "", website: "" });
    const [error, setError] = useState<string | null>(null);

    const handleToggle = async (id: string, active: boolean) => {
        setLoading(id);
        try {
            const res = await fetch("/api/super/companies", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId: id, isActive: !active }),
            });
            if (res.ok) {
                setCompanies((p) => p.map((c) => (c.id === id ? { ...c, is_active: !active } : c)));
            }
        } catch { }
        setLoading(null);
    };

    const handleDelete = async (id: string) => {
        setLoading(id);
        try {
            const res = await fetch("/api/super/companies", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId: id }),
            });
            if (res.ok) setCompanies((p) => p.filter((c) => c.id !== id));
        } catch { }
        setLoading(null);
        setConfirmDelete(null);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);
        try {
            const res = await fetch("/api/super/companies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            setShowCreate(false);
            setForm({ companyName: "", email: "", industry: "", website: "" });
            window.location.reload();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Company
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="mb-6 bg-gray-800 border border-white/10 rounded-xl p-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text" placeholder="Company Name *" value={form.companyName}
                            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                            required
                            className="px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <input
                            type="email" placeholder="Email *" value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            required
                            className="px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <input
                            type="text" placeholder="Industry" value={form.industry}
                            onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                            className="px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <input
                            type="url" placeholder="Website" value={form.website}
                            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                            className="px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">⚠️ {error}</p>}
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
                        <button type="submit" disabled={creating} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Create
                        </button>
                    </div>
                </form>
            )}

            {companies.length === 0 ? (
                <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Companies Yet</h3>
                    <p className="text-gray-400 text-sm">Add companies that hire interns from the platform.</p>
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Company</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Industry</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Hires</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Joined</th>
                            <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map((c) => (
                            <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-xs font-bold text-blue-400">
                                            {c.company_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{c.company_name}</p>
                                            <p className="text-gray-500 text-xs">{c.email || "—"}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    {c.industry ? (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-600/20 text-blue-400">{c.industry}</span>
                                    ) : (
                                        <span className="text-gray-500 text-xs">—</span>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-white font-medium">{c.total_hires}</td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1.5 text-xs ${c.is_active ? "text-green-400" : "text-red-400"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? "bg-green-400" : "bg-red-400"}`} />
                                        {c.is_active ? "Active" : "Disabled"}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {c.website && (
                                            <a href={c.website} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5">
                                                <Globe className="w-4 h-4" />
                                            </a>
                                        )}
                                        <button onClick={() => handleToggle(c.id, c.is_active)} disabled={loading === c.id} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5 disabled:opacity-50">
                                            {c.is_active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                                        </button>
                                        {confirmDelete === c.id ? (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleDelete(c.id)} disabled={loading === c.id} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Confirm</button>
                                                <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs bg-gray-700 text-white rounded">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-white/5">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
