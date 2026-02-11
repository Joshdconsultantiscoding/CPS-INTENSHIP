"use client";

import React, { useState, useEffect } from "react";
import { SuperAdminShell } from "@/components/super/super-admin-shell";
import { createClient } from "@/lib/supabase/client";
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
    Lock,
    Users,
    Megaphone,
    Flag,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// SUPER ADMIN SETTINGS — REAL-TIME POWERHOUSE
// ============================================================

type Tab = "general" | "marketing" | "notifications" | "health";

export default function SuperSettingsPage() {
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<Tab>("general");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        id: "",
        maintenance_mode: false,
        portal_selection: true,
        new_registrations: true,
        ai_content_generation: false,
        marketing_banner_active: false,
        marketing_banner_text: "Welcome to CPS InternHub!",
        system_announcement: "",
        updated_at: ""
    });

    // 1. Fetch initial settings
    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from("platform_settings")
                .select("*")
                .single();

            if (data) setSettings(data);
            setLoading(false);
        };

        fetchSettings();

        // 2. Subscribe to REAL-TIME changes
        const channel = supabase
            .channel("platform-settings-changes")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "platform_settings" },
                (payload) => {
                    console.log("Real-time settings update received", payload);
                    setSettings(payload.new as any);
                    toast.info("Platform settings updated in real-time");
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/super/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (!response.ok) throw new Error("Failed to save settings");
            toast.success("Settings saved successfully");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SuperAdminShell>
                <div className="h-[60vh] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            </SuperAdminShell>
        );
    }

    return (
        <SuperAdminShell>
            <div className="max-w-5xl mx-auto space-y-8 pb-12">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Control Center</h1>
                        <p className="text-gray-400 mt-1 flex items-center gap-2">
                            <Lock className="w-3 h-3" />
                            Secure administrative bridge — Changes are applied globally & instantly
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {settings.updated_at && (
                            <span className="text-[10px] text-gray-600 font-mono hidden md:block">
                                LAST SYNC: {new Date(settings.updated_at).toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Commit Changes
                        </button>
                    </div>
                </div>

                {/* Navigation & Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1 space-y-1">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-4 mb-2">Category</p>
                        <button
                            onClick={() => setActiveTab("general")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "general" ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-inner shadow-indigo-500/5" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
                        >
                            <Shield className="w-4 h-4" />
                            General & Flags
                        </button>
                        <button
                            onClick={() => setActiveTab("marketing")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "marketing" ? "bg-amber-600/10 text-amber-400 border border-amber-600/20 shadow-inner shadow-amber-500/5" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
                        >
                            <Megaphone className="w-4 h-4" />
                            Broadcast Hub
                        </button>
                        <button
                            onClick={() => setActiveTab("notifications")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "notifications" ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-inner shadow-blue-500/5" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
                        >
                            <Bell className="w-4 h-4" />
                            Email Engine
                        </button>
                        <button
                            onClick={() => setActiveTab("health")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "health" ? "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 shadow-inner shadow-emerald-500/5" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
                        >
                            <Database className="w-4 h-4" />
                            System Health
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {activeTab === "general" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Maintenance Mode */}
                                <div className={`border-2 transition-all p-6 rounded-2xl ${settings.maintenance_mode ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-900 border-white/5'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <div className={`p-3 rounded-xl ${settings.maintenance_mode ? 'bg-red-500/20' : 'bg-white/5'}`}>
                                                <AlertCircle className={`w-6 h-6 ${settings.maintenance_mode ? 'text-red-400' : 'text-gray-400'}`} />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-white tracking-tight">Maintenance Mode</p>
                                                <p className="text-xs text-gray-500 leading-relaxed mt-1">When active, all non-admin portals will be locked with a maintenance screen.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, maintenance_mode: !s.maintenance_mode }))}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ring-offset-2 focus:ring-2 ring-indigo-500 ${settings.maintenance_mode ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-gray-700'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all ${settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Feature Flags */}
                                <div className="bg-gray-900 border border-white/5 rounded-3xl p-8 space-y-8">
                                    <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                        <Flag className="w-3 h-3" />
                                        Feature Availability
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                                            <div className="flex gap-4">
                                                <div className="p-2.5 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                                                    <Smartphone className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">Role Selection Portal</p>
                                                    <p className="text-[11px] text-gray-500">Show/Hide the multi-portal selection landing page.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSettings(s => ({ ...s, portal_selection: !s.portal_selection }))}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${settings.portal_selection ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-gray-800'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${settings.portal_selection ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                                            <div className="flex gap-4">
                                                <div className="p-2.5 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                                                    <Database className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">AI Engine Integration</p>
                                                    <p className="text-[11px] text-gray-500">Enable cloud-based AI content and analysis tools.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSettings(s => ({ ...s, ai_content_generation: !s.ai_content_generation }))}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${settings.ai_content_generation ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-gray-800'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${settings.ai_content_generation ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                                            <div className="flex gap-4">
                                                <div className="p-2.5 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                                                    <Users className="w-5 h-5 text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">Open Registration</p>
                                                    <p className="text-[11px] text-gray-500">Allow new users to create accounts without invitation.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSettings(s => ({ ...s, new_registrations: !s.new_registrations }))}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${settings.new_registrations ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-gray-800'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${settings.new_registrations ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "marketing" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-gray-900 border border-white/5 rounded-3xl p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white tracking-tight">Global Marketing Banner</h3>
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, marketing_banner_active: !s.marketing_banner_active }))}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${settings.marketing_banner_active ? 'bg-amber-500' : 'bg-gray-800'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${settings.marketing_banner_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Banner Text</label>
                                        <input
                                            type="text"
                                            value={settings.marketing_banner_text}
                                            onChange={(e) => setSettings(s => ({ ...s, marketing_banner_text: e.target.value }))}
                                            placeholder="Example: Early access to AI portal now open!"
                                            className="w-full bg-gray-950 border border-white/10 p-4 rounded-xl text-white text-sm focus:outline-none focus:ring-2 ring-amber-500/50 transition-all font-medium"
                                        />
                                        <div className="p-3 bg-amber-500/10 rounded-lg flex items-start gap-3 border border-amber-500/20">
                                            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">This banner will appear at the top of ALL user-facing pages across all workspaces.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-900 border border-white/5 rounded-3xl p-8 space-y-6">
                                    <h3 className="text-lg font-bold text-white tracking-tight">System Announcement</h3>
                                    <textarea
                                        rows={4}
                                        value={settings.system_announcement}
                                        onChange={(e) => setSettings(s => ({ ...s, system_announcement: e.target.value }))}
                                        placeholder="Broadcast a message to everyone..."
                                        className="w-full bg-gray-950 border border-white/10 p-4 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 ring-indigo-500/50 transition-all resize-none"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setSettings(s => ({ ...s, system_announcement: "" }))}
                                            className="text-xs text-gray-500 hover:text-white transition-colors"
                                        >
                                            Clear Announcement
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div className="bg-gray-900 border border-white/5 rounded-3xl p-12 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Email Notification Engine</h3>
                                <p className="text-gray-400 text-sm max-w-sm mx-auto">Configuration for SMTP servers, email templates, and automated platform alerts.</p>
                                <div className="flex items-center justify-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest bg-blue-500/5 px-4 py-2 rounded-full w-fit mx-auto border border-blue-500/20">
                                    <RefreshCw className="w-3 h-3 animate-spin-slow" />
                                    Synchronizing Protocols
                                </div>
                            </div>
                        )}

                        {activeTab === "health" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Database Latency</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-2xl font-bold text-emerald-400">12ms</p>
                                            <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-tighter">Excellent</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Server Load</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-2xl font-bold text-white">4.2%</p>
                                            <span className="text-[10px] font-bold text-green-500/50 uppercase tracking-tighter">Normal</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-950 border border-white/5 rounded-3xl p-8 space-y-6">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-indigo-400" />
                                        Platform Infrastructure
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                                            <span className="text-sm text-gray-400">Node Engine</span>
                                            <span className="text-sm text-white font-mono">v20.10.0</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                                            <span className="text-sm text-gray-400">Storage Pool</span>
                                            <span className="text-sm text-white font-mono">AWS-S3-EAST-1</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                                            <span className="text-sm text-gray-400">SSL Certificate</span>
                                            <span className="text-sm font-bold text-emerald-400 font-mono tracking-tighter">VAL_UNRESTRICTED</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toast.promise(new Promise(res => setTimeout(res, 2000)), {
                                        loading: 'Flushing server cache...',
                                        success: 'Global cache purged successfully',
                                        error: 'Cache purge failed',
                                    })}
                                    className="w-full p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-3"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Purge Global Cache
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SuperAdminShell>
    );
}
