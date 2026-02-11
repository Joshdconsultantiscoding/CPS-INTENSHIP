"use client";

import React, { useState, useEffect } from "react";
import { SuperAdminShellV2 } from "@/components/super/super-admin-shell-v2";
import {
    Settings,
    Shield,
    Bell,
    Globe,
    Save,
    Loader2,
    AlertCircle,
    Info,
    Smartphone,
    Database,
    Lock
} from "lucide-react";

// ============================================================
// SUPER ADMIN — SETTINGS V2 — /super/settings-v2
// Platform-wide configuration, feature flags, and maintenance.
// This is a NEW route. Does NOT modify any existing routes.
// ============================================================

export default function SuperSettingsV2Page() {
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

    // Internal state for demo (would normally hit /api/super/settings)
    const [settings, setSettings] = useState({
        portalSelection: true,
        maintenanceMode: false,
        newRegistrations: true,
        emailNotifications: true,
        aiFeatures: false,
        debugMode: true
    });

    const handleSave = () => {
        setSaveStatus("saving");
        setTimeout(() => {
            setSaveStatus("success");
            setTimeout(() => setSaveStatus("idle"), 3000);
        }, 1000);
    };

    return (
        <SuperAdminShellV2>
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
                        <p className="text-gray-400 mt-1">
                            Manage global configurations, security policies, and feature availability.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === "saving"}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {saveStatus === "saving" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saveStatus === "success" ? "Saved!" : "Save Changes"}
                    </button>
                </div>

                {/* Main Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sidebar Nav */}
                    <div className="md:col-span-1 space-y-1">
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-white">
                            <Shield className="w-4 h-4 text-red-400" />
                            General & Security
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <Globe className="w-4 h-4" />
                            Regional & Localization
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <Bell className="w-4 h-4" />
                            Notifications
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <Database className="w-4 h-4" />
                            System Health
                        </button>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Critical Actions */}
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <AlertCircle className="w-4 h-4" />
                                Critical Actions
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">Maintenance Mode</p>
                                    <p className="text-xs text-gray-500 mt-1">Users will see a maintenance page and cannot access portals.</p>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Feature Flags */}
                        <div className="bg-gray-900 border border-white/5 rounded-2xl p-6 space-y-6">
                            <h3 className="text-lg font-semibold text-white">Feature Flags</h3>

                            <div className="space-y-4">
                                {/* Portal Selection */}
                                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-all group">
                                    <div className="flex gap-4">
                                        <div className="p-2.5 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                                            <Smartphone className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Portal Selection Page</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Show the roles selection screen to new sign-ups.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, portalSelection: !s.portalSelection }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.portalSelection ? 'bg-indigo-500' : 'bg-gray-700'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.portalSelection ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* AI Features */}
                                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-all group">
                                    <div className="flex gap-4">
                                        <div className="p-2.5 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                                            <Lock className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">AI Content Generation</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Enable AI-powered copy and image generation.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, aiFeatures: !s.aiFeatures }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.aiFeatures ? 'bg-purple-500' : 'bg-gray-700'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.aiFeatures ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* New Registrations */}
                                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-all group">
                                    <div className="flex gap-4">
                                        <div className="p-2.5 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                                            <Users className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Allow Registrations</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Control whether new users can sign up.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, newRegistrations: !s.newRegistrations }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.newRegistrations ? 'bg-green-500' : 'bg-gray-700'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.newRegistrations ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* System Info */}
                        <div className="bg-gray-950 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                System Environment
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Environment</p>
                                    <p className="text-sm text-white font-mono">{process.env.NODE_ENV}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Build ID</p>
                                    <p className="text-sm text-white font-mono">B-72819-A</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Database</p>
                                    <p className="text-sm text-green-400 font-mono">Connected</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">Auth Service</p>
                                    <p className="text-sm text-green-400 font-mono">Synced</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminShellV2>
    );
}
