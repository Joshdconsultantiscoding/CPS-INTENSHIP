"use client";

import React, { useState } from "react";
import {
    Eye,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Building2,
    Users,
    AlertTriangle,
} from "lucide-react";

// ============================================================
// ADMIN TABLE — Client component for admin management
// This is a NEW component. Does NOT modify any existing code.
// ============================================================

interface AdminRecord {
    id: string;
    user_id: string;
    workspace_id: string | null;
    slug: string | null;
    email: string | null;
    full_name: string | null;
    company_name: string | null;
    is_active: boolean;
    created_at: string;
    workspace?: {
        id: string;
        name: string;
        slug: string;
        type: string;
        is_active: boolean;
    } | null;
}

interface AdminTableProps {
    admins: AdminRecord[];
}

export function AdminTable({ admins: initialAdmins }: AdminTableProps) {
    const [admins, setAdmins] = useState(initialAdmins);
    const [loading, setLoading] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const handleToggle = async (id: string, currentlyActive: boolean) => {
        setLoading(id);
        try {
            const res = await fetch("/api/super/admins", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminId: id, isActive: !currentlyActive }),
            });
            if (res.ok) {
                setAdmins((prev) =>
                    prev.map((a) =>
                        a.id === id ? { ...a, is_active: !currentlyActive } : a
                    )
                );
            }
        } catch (err) {
            console.error("Toggle failed:", err);
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        setLoading(id);
        try {
            const res = await fetch("/api/super/admins", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminId: id }),
            });
            if (res.ok) {
                setAdmins((prev) => prev.filter((a) => a.id !== id));
            }
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setLoading(null);
            setConfirmDelete(null);
        }
    };

    if (admins.length === 0) {
        return (
            <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                    No Admins Yet
                </h3>
                <p className="text-gray-400 text-sm">
                    Create your first admin to auto-generate their workspace portal.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/5">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            Admin
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            Company
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            Portal URL
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            Status
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            Created
                        </th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {admins.map((admin) => (
                        <tr
                            key={admin.id}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                        {(admin.full_name || admin.email || "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            {admin.full_name || "Unnamed"}
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {admin.email || "—"}
                                        </p>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-gray-300 text-sm">
                                    {admin.company_name || "—"}
                                </span>
                            </td>
                            <td className="py-3 px-4">
                                {admin.workspace?.slug ? (
                                    <code className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                                        /w/{admin.workspace.slug}/admin
                                    </code>
                                ) : (
                                    <span className="text-gray-500 text-xs">
                                        No workspace
                                    </span>
                                )}
                            </td>
                            <td className="py-3 px-4">
                                <span
                                    className={`inline-flex items-center gap-1.5 text-xs ${admin.is_active
                                            ? "text-green-400"
                                            : "text-red-400"
                                        }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${admin.is_active
                                                ? "bg-green-400"
                                                : "bg-red-400"
                                            }`}
                                    />
                                    {admin.is_active ? "Active" : "Disabled"}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-xs">
                                {new Date(admin.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-2">
                                    {/* View Portal */}
                                    {admin.workspace?.slug && (
                                        <a
                                            href={`/w/${admin.workspace.slug}/admin`}
                                            className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
                                            title="View portal"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </a>
                                    )}

                                    {/* Toggle active */}
                                    <button
                                        onClick={() =>
                                            handleToggle(admin.id, admin.is_active)
                                        }
                                        disabled={loading === admin.id}
                                        className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors disabled:opacity-50"
                                        title={
                                            admin.is_active
                                                ? "Deactivate admin"
                                                : "Activate admin"
                                        }
                                    >
                                        {admin.is_active ? (
                                            <ToggleRight className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <ToggleLeft className="w-4 h-4 text-red-400" />
                                        )}
                                    </button>

                                    {/* Delete */}
                                    {confirmDelete === admin.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(admin.id)}
                                                disabled={loading === admin.id}
                                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-500 disabled:opacity-50"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(null)}
                                                className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDelete(admin.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-white/5 transition-colors"
                                            title="Delete admin"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
