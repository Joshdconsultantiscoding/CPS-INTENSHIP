"use client";

import React, { useState } from "react";
import {
    ToggleLeft,
    ToggleRight,
    Trash2,
    UserCheck,
    Plus,
    Loader2,
    Award,
} from "lucide-react";

// ============================================================
// INTERNS TABLE — Client component for intern pool management
// This is a NEW component. Does NOT modify any existing code.
// ============================================================

interface InternRecord {
    id: string;
    full_name: string | null;
    email: string | null;
    skills: string[];
    points: number;
    certificates: number;
    assigned_workspace_id: string | null;
    is_active: boolean;
    created_at: string;
    assigned_workspace?: {
        id: string;
        name: string;
        slug: string;
    } | null;
}

interface InternsTableProps {
    interns: InternRecord[];
}

export function InternsTable({ interns: initialInterns }: InternsTableProps) {
    const [interns, setInterns] = useState(initialInterns);
    const [loading, setLoading] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ fullName: "", email: "", skills: "" });
    const [error, setError] = useState<string | null>(null);

    const handleToggle = async (id: string, active: boolean) => {
        setLoading(id);
        try {
            const res = await fetch("/api/super/interns", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ internId: id, isActive: !active }),
            });
            if (res.ok) {
                setInterns((p) => p.map((i) => (i.id === id ? { ...i, is_active: !active } : i)));
            }
        } catch { }
        setLoading(null);
    };

    const handleDelete = async (id: string) => {
        setLoading(id);
        try {
            const res = await fetch("/api/super/interns", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ internId: id }),
            });
            if (res.ok) setInterns((p) => p.filter((i) => i.id !== id));
        } catch { }
        setLoading(null);
        setConfirmDelete(null);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);
        try {
            const res = await fetch("/api/super/interns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: form.fullName,
                    email: form.email,
                    skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); return; }
            setShowCreate(false);
            setForm({ fullName: "", email: "", skills: "" });
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
                    Add Intern
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="mb-6 bg-gray-800 border border-white/10 rounded-xl p-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                            type="text" placeholder="Full Name *" value={form.fullName}
                            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
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
                            type="text" placeholder="Skills (comma separated)" value={form.skills}
                            onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
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

            {interns.length === 0 ? (
                <div className="text-center py-12">
                    <UserCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Interns in Pool</h3>
                    <p className="text-gray-400 text-sm">Interns will appear here when added or when they sign up.</p>
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Intern</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Skills</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Points</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Certs</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Workspace</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                            <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {interns.map((i) => (
                            <tr key={i.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-xs font-bold text-purple-400">
                                            {(i.full_name || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{i.full_name || "Unnamed"}</p>
                                            <p className="text-gray-500 text-xs">{i.email || "—"}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(i.skills || []).slice(0, 3).map((s, idx) => (
                                            <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-purple-600/20 text-purple-400">{s}</span>
                                        ))}
                                        {(i.skills || []).length > 3 && (
                                            <span className="text-xs text-gray-500">+{i.skills.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-amber-400 font-medium">{i.points}</td>
                                <td className="py-3 px-4">
                                    <span className="inline-flex items-center gap-1 text-yellow-400 text-xs">
                                        <Award className="w-3.5 h-3.5" />
                                        {i.certificates}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    {i.assigned_workspace ? (
                                        <code className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                            {i.assigned_workspace.slug}
                                        </code>
                                    ) : (
                                        <span className="text-gray-500 text-xs">Unassigned</span>
                                    )}
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1.5 text-xs ${i.is_active ? "text-green-400" : "text-red-400"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${i.is_active ? "bg-green-400" : "bg-red-400"}`} />
                                        {i.is_active ? "Active" : "Disabled"}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleToggle(i.id, i.is_active)} disabled={loading === i.id} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5 disabled:opacity-50">
                                            {i.is_active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                                        </button>
                                        {confirmDelete === i.id ? (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleDelete(i.id)} disabled={loading === i.id} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Confirm</button>
                                                <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs bg-gray-700 text-white rounded">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmDelete(i.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-white/5">
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
