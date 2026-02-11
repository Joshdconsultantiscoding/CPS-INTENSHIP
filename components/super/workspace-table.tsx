"use client";

import React, { useState } from "react";
import type { Workspace } from "@/lib/types/workspace";
import { Building2, ToggleLeft, ToggleRight, Trash2, Eye, AlertTriangle } from "lucide-react";

// ============================================================
// WORKSPACE TABLE — Client component for workspace management
// This is a NEW component. Does NOT modify any existing code.
// ============================================================

interface WorkspaceTableProps {
    workspaces: Workspace[];
}

export function WorkspaceTable({ workspaces: initialWorkspaces }: WorkspaceTableProps) {
    const [workspaces, setWorkspaces] = useState(initialWorkspaces);
    const [loading, setLoading] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const handleToggle = async (id: string, currentlyActive: boolean) => {
        setLoading(id);
        try {
            const res = await fetch("/api/super/workspaces", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceId: id, isActive: !currentlyActive }),
            });

            if (res.ok) {
                setWorkspaces((prev) =>
                    prev.map((w) => (w.id === id ? { ...w, is_active: !currentlyActive } : w))
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
            const res = await fetch("/api/super/workspaces", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceId: id }),
            });

            if (res.ok) {
                setWorkspaces((prev) => prev.filter((w) => w.id !== id));
            }
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setLoading(null);
            setConfirmDelete(null);
        }
    };

    if (workspaces.length === 0) {
        return (
            <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                    No Workspaces Yet
                </h3>
                <p className="text-gray-400 text-sm">
                    Workspaces will appear here when new admins, mentors, or companies sign up.
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
                            Workspace
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            Slug
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                            Type
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
                    {workspaces.map((ws) => (
                        <tr
                            key={ws.id}
                            className="border-b border-white/5 hover:bg-white/[0.02]"
                        >
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                        {ws.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-white font-medium">{ws.name}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-gray-400 font-mono text-xs">
                                /w/{ws.slug}
                            </td>
                            <td className="py-3 px-4">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600/20 text-indigo-400 capitalize">
                                    {ws.type}
                                </span>
                            </td>
                            <td className="py-3 px-4">
                                <span
                                    className={`inline-flex items-center gap-1.5 text-xs ${ws.is_active ? "text-green-400" : "text-red-400"
                                        }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${ws.is_active ? "bg-green-400" : "bg-red-400"
                                            }`}
                                    />
                                    {ws.is_active ? "Active" : "Disabled"}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-xs">
                                {new Date(ws.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-2">
                                    {/* View */}
                                    <a
                                        href={`/w/${ws.slug}/admin`}
                                        className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
                                        title="View workspace"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </a>

                                    {/* Toggle active */}
                                    <button
                                        onClick={() => handleToggle(ws.id, ws.is_active)}
                                        disabled={loading === ws.id}
                                        className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors disabled:opacity-50"
                                        title={ws.is_active ? "Disable workspace" : "Enable workspace"}
                                    >
                                        {ws.is_active ? (
                                            <ToggleRight className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <ToggleLeft className="w-4 h-4 text-red-400" />
                                        )}
                                    </button>

                                    {/* Delete */}
                                    {confirmDelete === ws.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(ws.id)}
                                                disabled={loading === ws.id}
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
                                            onClick={() => setConfirmDelete(ws.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-white/5 transition-colors"
                                            title="Delete workspace"
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
