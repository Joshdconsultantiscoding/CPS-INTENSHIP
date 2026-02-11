"use client";

import React, { useState } from "react";
import {
    ToggleLeft,
    ToggleRight,
    Trash2,
    GraduationCap,
    Plus,
    Loader2,
    X,
} from "lucide-react";

// ============================================================
// MENTORS TABLE — Client component for mentor management
// This is a NEW component. Does NOT modify any existing code.
// ============================================================

interface MentorRecord {
    id: string;
    full_name: string | null;
    email: string | null;
    skills: string[];
    rating: number;
    is_active: boolean;
    created_at: string;
}

interface MentorsTableProps {
    mentors: MentorRecord[];
}

export function MentorsTable({ mentors: initialMentors }: MentorsTableProps) {
    const [mentors, setMentors] = useState(initialMentors);
    const [loading, setLoading] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ fullName: "", email: "", skills: "" });
    const [error, setError] = useState<string | null>(null);

    const handleToggle = async (id: string, active: boolean) => {
        setLoading(id);
        try {
            const res = await fetch("/api/super/mentors", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mentorId: id, isActive: !active }),
            });
            if (res.ok) {
                setMentors((p) => p.map((m) => (m.id === id ? { ...m, is_active: !active } : m)));
            }
        } catch { }
        setLoading(null);
    };

    const handleDelete = async (id: string) => {
        setLoading(id);
        try {
            const res = await fetch("/api/super/mentors", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mentorId: id }),
            });
            if (res.ok) setMentors((p) => p.filter((m) => m.id !== id));
        } catch { }
        setLoading(null);
        setConfirmDelete(null);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);
        try {
            const res = await fetch("/api/super/mentors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: form.fullName,
                    email: form.email,
                    skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
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
            {/* Create form */}
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Mentor
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="mb-6 bg-gray-800 border border-white/10 rounded-xl p-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                            type="text"
                            placeholder="Full Name *"
                            value={form.fullName}
                            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                            required
                            className="px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <input
                            type="email"
                            placeholder="Email *"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            required
                            className="px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <input
                            type="text"
                            placeholder="Skills (comma separated)"
                            value={form.skills}
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

            {mentors.length === 0 ? (
                <div className="text-center py-12">
                    <GraduationCap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Mentors Yet</h3>
                    <p className="text-gray-400 text-sm">Add mentors to grow the platform.</p>
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Mentor</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Skills</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Joined</th>
                            <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mentors.map((m) => (
                            <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-600/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                                            {(m.full_name || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{m.full_name || "Unnamed"}</p>
                                            <p className="text-gray-500 text-xs">{m.email || "—"}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(m.skills || []).slice(0, 3).map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-emerald-600/20 text-emerald-400">{s}</span>
                                        ))}
                                        {(m.skills || []).length > 3 && (
                                            <span className="text-xs text-gray-500">+{m.skills.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1.5 text-xs ${m.is_active ? "text-green-400" : "text-red-400"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${m.is_active ? "bg-green-400" : "bg-red-400"}`} />
                                        {m.is_active ? "Active" : "Disabled"}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(m.created_at).toLocaleDateString()}</td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleToggle(m.id, m.is_active)} disabled={loading === m.id} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5 disabled:opacity-50">
                                            {m.is_active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                                        </button>
                                        {confirmDelete === m.id ? (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleDelete(m.id)} disabled={loading === m.id} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Confirm</button>
                                                <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs bg-gray-700 text-white rounded">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setConfirmDelete(m.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-white/5">
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
