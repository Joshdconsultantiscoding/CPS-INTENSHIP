"use client";

import React, { useState } from "react";
import { Plus, X, Loader2, CheckCircle, Building2 } from "lucide-react";

// ============================================================
// CREATE ADMIN DIALOG — Form to create new admin + workspace
// This is a NEW component. Does NOT modify any existing code.
// ============================================================

interface CreateAdminDialogProps {
    onCreated?: () => void;
}

export function CreateAdminDialog({ onCreated }: CreateAdminDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<{
        slug: string;
        name: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [companyName, setCompanyName] = useState("");

    const reset = () => {
        setFullName("");
        setEmail("");
        setCompanyName("");
        setError(null);
        setSuccess(null);
    };

    const handleClose = () => {
        setIsOpen(false);
        reset();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/super/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, companyName }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create admin");
                return;
            }

            setSuccess({
                slug: data.admin?.workspace?.slug || data.admin?.slug || "unknown",
                name: fullName,
            });

            // Refresh page after short delay
            setTimeout(() => {
                handleClose();
                if (onCreated) onCreated();
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5"
            >
                <Plus className="w-4 h-4" />
                Create Admin
            </button>

            {/* Dialog Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Dialog */}
                    <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <Building2 className="w-4.5 h-4.5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        Create New Admin
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        Auto-generates workspace portal
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Success State */}
                        {success ? (
                            <div className="px-6 py-10 text-center">
                                <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Admin Created Successfully!
                                </h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    {success.name}&apos;s portal is ready:
                                </p>
                                <code className="inline-block text-sm font-mono text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-lg">
                                    /w/{success.slug}/admin
                                </code>
                            </div>
                        ) : (
                            /* Form */
                            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Full Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        placeholder="e.g. John Doe"
                                        className="w-full px-3.5 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Email <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="e.g. john@company.com"
                                        className="w-full px-3.5 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                </div>

                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Company / Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="e.g. HG Media"
                                        className="w-full px-3.5 py-2.5 rounded-lg bg-gray-800 border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        Used to generate the workspace slug (e.g. &quot;HG
                                        Media&quot; → <code>hg-media-82f4</code>)
                                    </p>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        <span>⚠️</span>
                                        {error}
                                    </div>
                                )}

                                {/* What happens */}
                                <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 px-4 py-3">
                                    <p className="text-xs text-indigo-300 font-medium mb-1.5">
                                        What happens when you create:
                                    </p>
                                    <ul className="text-xs text-gray-400 space-y-1">
                                        <li>• A workspace portal is auto-generated</li>
                                        <li>• A unique slug URL is created</li>
                                        <li>• Admin can log in and access their portal</li>
                                    </ul>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !fullName || !email}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                Create Admin & Workspace
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
