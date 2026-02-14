"use client";

import React, { useEffect, useState } from 'react';
import {
    Brain,
    Shield,
    Zap,
    Save,
    RotateCcw,
    Plus,
    Trash2,
    Key,
    Settings2,
    Globe,
    Lock,
    Search,
    Filter,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Eye,
    EyeOff,
    MoreVertical,
    GripVertical,
    Activity,
    Cpu,
    Wifi,
    Database,
    Layers,
    Terminal as TerminalIcon,
    Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AIProvider {
    id: string;
    name: string;
    is_enabled: boolean;
    is_local: boolean;
    priority: number;
    base_url: string | null;
    model_name: string | null;
    custom_instructions: string | null;
    has_api_key: boolean;
    supported_features: {
        vision: boolean;
        files: boolean;
        streaming: boolean;
    };
}

interface AISettings {
    privacy_mode_enabled: boolean;
    default_provider_id: string | null;
    system_instructions: string;
}

export default function AIEnginePage() {
    const [providers, setProviders] = useState<AIProvider[]>([]);
    const [settings, setSettings] = useState<AISettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
    const [keyInput, setKeyInput] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [modelInput, setModelInput] = useState("");
    const [instructionsInput, setInstructionsInput] = useState("");
    const [testLoading, setTestLoading] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        fetchData();
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchData = async () => {
        try {
            const [pRes, sRes] = await Promise.all([
                fetch('/api/ai/providers'),
                fetch('/api/ai/settings')
            ]);
            const pData = await pRes.json();
            const sData = await sRes.json();
            setProviders(pData);
            setSettings(sData);
        } catch (error) {
            toast.error("Failed to load AI configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleProvider = async (id: string, enabled: boolean) => {
        try {
            const res = await fetch('/api/ai/providers', {
                method: 'POST',
                body: JSON.stringify({ id, is_enabled: enabled })
            });
            if (res.ok) {
                setProviders(prev => prev.map(p => p.id === id ? { ...p, is_enabled: enabled } : p));
                toast.success(`Node ${enabled ? 'Activated' : 'Suspended'}`);
            }
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleSaveSettings = async (updates: Partial<AISettings>) => {
        setSaving(true);
        try {
            const res = await fetch('/api/ai/settings', {
                method: 'POST',
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                setSettings(prev => prev ? { ...prev, ...updates } : null);
                toast.success("Synchronized successfully");
            }
        } catch (error) {
            toast.error("Sync failed");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateKey = async () => {
        if (!editingProvider) return;
        setSaving(true);
        try {
            const res = await fetch('/api/ai/providers', {
                method: 'POST',
                body: JSON.stringify({
                    id: editingProvider.id,
                    api_key: keyInput,
                    base_url: urlInput,
                    model_name: modelInput,
                    custom_instructions: instructionsInput
                })
            });
            if (res.ok) {
                toast.success("Neural credentials verified");
                setEditingProvider(null);
                setKeyInput("");
                setUrlInput("");
                setModelInput("");
                setInstructionsInput("");
                fetchData();
            }
        } catch (error) {
            toast.error("Verification failed");
        } finally {
            setSaving(false);
        }
    };

    const handleTestProvider = async (name: string) => {
        setTestLoading(name);
        try {
            const res = await fetch('/api/ai/providers/test', {
                method: 'POST',
                body: JSON.stringify({ providerName: name })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Ping: ${name} is Operational`, {
                    description: data.response.slice(0, 100) + '...'
                });
            } else {
                toast.error(`Node Failure: ${name}`, {
                    description: data.error || 'No response'
                });
            }
        } catch (error) {
            toast.error(`Fatal connection error to ${name}`);
        } finally {
            setTestLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <Loader2 className="h-20 w-20 animate-spin mx-auto text-primary opacity-20" />
                        <Brain className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-mono text-primary animate-pulse">BOOTING NEURAL ENGINE...</h2>
                        <p className="text-muted-foreground text-xs uppercase tracking-widest mt-2">v2.0 MASTER_CONTROL_INIT</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-white pb-32">
            {/* Ambient background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] translate-y-1/2"></div>
                {/* Neural grid - adapted for light mode accessibility */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#80808022_1px,transparent_1px),linear-gradient(to_bottom,#80808022_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <div className="relative z-10 p-4 md:p-8 max-w-[1600px] mx-auto space-y-10">
                {/* Master Command Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-8 px-2">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] dark:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                            >
                                <Brain className="h-10 w-10 text-primary" />
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-[10px] tracking-tighter bg-primary/5 text-primary border-primary/20 px-1.5 py-0 font-mono">
                                        SYSTEM_AI_NODE_ORCHESTRATOR
                                    </Badge>
                                    <span className="text-[10px] font-mono text-muted-foreground opacity-50 uppercase tracking-widest">v4.0.5</span>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tight italic drop-shadow-sm">
                                    Intelligence <span className="text-primary not-italic font-extrabold underline decoration-primary/30 decoration-4 underline-offset-8">Engine</span>
                                </h1>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-base md:text-lg max-w-2xl font-medium leading-relaxed">
                            Central command for neural processing nodes. Manage global routing, failover protocols, and privacy-hardened local inference.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 bg-card/40 backdrop-blur-xl p-2 px-4 rounded-2xl border border-border/50 shadow-xl dark:shadow-2xl">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Privacy Tunnel</span>
                                <span className={cn(
                                    "text-xs font-mono font-bold uppercase",
                                    settings?.privacy_mode_enabled ? "text-green-500" : "text-amber-500 dark:text-amber-400"
                                )}>
                                    {settings?.privacy_mode_enabled ? "Active_Hardened" : "Cloud_Hybrid"}
                                </span>
                            </div>
                            <Switch
                                checked={settings?.privacy_mode_enabled}
                                onCheckedChange={(val) => handleSaveSettings({ privacy_mode_enabled: val })}
                                className="data-[state=checked]:bg-green-500 scale-110"
                            />
                        </div>

                        <div className="flex items-center gap-3 bg-card/40 backdrop-blur-xl p-2 px-4 rounded-2xl border border-border/50 shadow-xl dark:shadow-2xl">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1 text-right">System Status</span>
                                <span className="text-xs font-mono font-bold text-green-500 uppercase text-right">NOMINAL</span>
                            </div>
                            <div className="h-8 w-8 rounded-full border border-green-500/20 bg-green-500/10 flex items-center justify-center">
                                <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* Primary Grid - 8 cols */}
                    <div className="xl:col-span-8 space-y-8">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Layers className="h-5 w-5 text-primary" />
                                <h2 className="text-2xl font-bold tracking-tight">Neural Processing Nodes</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-mono">
                                    {providers.filter(p => p.is_enabled).length}/{providers.length} ACTIVE
                                </Badge>
                                <Button variant="ghost" size="icon" onClick={fetchData} className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <AnimatePresence mode="popLayout">
                                {providers.map((provider, index) => (
                                    <motion.div
                                        key={provider.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        layout
                                    >
                                        <Card className={cn(
                                            "group bg-card/30 backdrop-blur-md border border-border/50 hover:border-primary/40 transition-all duration-500 relative overflow-hidden",
                                            !provider.is_enabled && "opacity-40 grayscale grayscale-[0.5]"
                                        )}>
                                            {/* Accent line */}
                                            <div className={cn(
                                                "absolute left-0 top-0 bottom-0 w-1 transition-colors",
                                                provider.is_enabled ? "bg-primary" : "bg-muted"
                                            )}></div>

                                            <CardContent className="p-0">
                                                <div className="flex items-center gap-0">
                                                    {/* Priority/Drag - hidden from eye usually */}
                                                    <div className="hidden sm:flex w-12 flex-col items-center justify-center border-r border-border/20 py-8 opacity-20 group-hover:opacity-100 transition-opacity">
                                                        <GripVertical className="h-4 w-4 cursor-grab active:cursor-grabbing" />
                                                        <span className="text-[10px] font-mono font-bold mt-2">{provider.priority}</span>
                                                    </div>

                                                    <div className="p-6 flex-1 flex items-center justify-between gap-8 flex-wrap md:flex-nowrap">
                                                        <div className="flex items-center gap-6">
                                                            <div className={cn(
                                                                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner border border-primary/5 dark:border-white/5",
                                                                provider.is_local
                                                                    ? "bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                                                    : "bg-blue-500/20 text-blue-500 dark:text-blue-400 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                                            )}>
                                                                {provider.is_local ? <Lock className="h-7 w-7" /> : <Globe className="h-7 w-7" />}
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-3">
                                                                    <h3 className="text-xl font-bold tracking-tight capitalize group-hover:text-primary transition-colors">
                                                                        {provider.name}
                                                                    </h3>
                                                                    {provider.is_local && (
                                                                        <Badge className="bg-indigo-600/20 text-indigo-500 dark:text-indigo-400 border-indigo-500/30 text-[9px] h-4">LOCAL_SECURE</Badge>
                                                                    )}
                                                                    {settings?.default_provider_id === provider.id && (
                                                                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] h-4">MASTER_FALLBACK</Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Wifi className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="text-muted-foreground uppercase tracking-widest text-[9px]">Endpoint:</span>
                                                                        <span className="text-foreground/60 truncate max-w-[100px] sm:max-w-[150px]">{provider.base_url || 'Cloud Default'}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Key className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="text-muted-foreground uppercase tracking-widest text-[9px]">Auth:</span>
                                                                        {provider.has_api_key ? (
                                                                            <span className="text-green-600 dark:text-green-400 font-bold tracking-widest">••••••••</span>
                                                                        ) : (
                                                                            <span className="text-rose-500 font-bold uppercase tracking-tighter">Null_Key</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 ml-auto md:ml-0">
                                                            <div className="flex flex-col items-end gap-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleTestProvider(provider.name)}
                                                                        disabled={!!testLoading || !provider.is_enabled}
                                                                        className="h-8 border-border/50 bg-transparent hover:bg-primary/10 hover:border-primary/50 text-[10px] font-bold uppercase tracking-widest transition-all px-4"
                                                                    >
                                                                        {testLoading === provider.name ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                <Zap className="h-3 w-3 mr-1.5" />
                                                                                Pulse Check
                                                                            </>
                                                                        )}
                                                                    </Button>

                                                                    <Dialog open={editingProvider?.id === provider.id} onOpenChange={(open) => {
                                                                        if (open) {
                                                                            setEditingProvider(provider);
                                                                            setKeyInput("");
                                                                            setUrlInput(provider.base_url || "");
                                                                            setModelInput(provider.model_name || "");
                                                                            setInstructionsInput(provider.custom_instructions || "");
                                                                        } else {
                                                                            setEditingProvider(null);
                                                                        }
                                                                    }}>
                                                                        <DialogTrigger asChild>
                                                                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg bg-accent/10 border border-primary/10 hover:bg-accent/20 transition-all">
                                                                                <Settings2 className="h-4 w-4 text-primary" />
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="sm:max-w-md bg-background border-border/50 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden backdrop-blur-3xl">
                                                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                                                                            <DialogHeader>
                                                                                <DialogTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight italic">
                                                                                    <Cpu className="h-6 w-6 text-primary" />
                                                                                    {provider.name.toUpperCase()} CONFIG
                                                                                </DialogTitle>
                                                                                <DialogDescription className="text-xs font-mono uppercase tracking-widest">
                                                                                    Node Protocol Parameters
                                                                                </DialogDescription>
                                                                            </DialogHeader>
                                                                            <div className="space-y-6 py-6 font-mono">
                                                                                <div className="space-y-3">
                                                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Secure Access Token</Label>
                                                                                    <div className="relative group">
                                                                                        <Input
                                                                                            type="password"
                                                                                            placeholder={provider.has_api_key ? "VALIDATED_KEY_STORED" : "ENTER NODE TOKEN"}
                                                                                            value={keyInput}
                                                                                            onChange={(e) => setKeyInput(e.target.value)}
                                                                                            className="pl-12 h-14 bg-accent/5 border-border rounded-xl focus:ring-primary/20 focus:border-primary/40 text-sm"
                                                                                        />
                                                                                        <Key className="absolute left-4 top-4.5 h- 5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-3">
                                                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Neural Endpoint URL</Label>
                                                                                    <div className="relative group">
                                                                                        <Input
                                                                                            placeholder="HTTPS://API.ENDPOINT.V1"
                                                                                            value={urlInput}
                                                                                            onChange={(e) => setUrlInput(e.target.value)}
                                                                                            className="pl-12 h-14 bg-accent/5 border-border rounded-xl focus:ring-primary/20 focus:border-primary/40 text-sm"
                                                                                        />
                                                                                        <Globe className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-3">
                                                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Preferred Model ID</Label>
                                                                                    <div className="relative group">
                                                                                        <Input
                                                                                            placeholder="e.g. gpt-4o, claude-3-5-sonnet"
                                                                                            value={modelInput}
                                                                                            onChange={(e) => setModelInput(e.target.value)}
                                                                                            className="pl-12 h-14 bg-accent/5 border-border rounded-xl focus:ring-primary/20 focus:border-primary/40 text-sm"
                                                                                        />
                                                                                        <Zap className="absolute left-4 top-4.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="space-y-3">
                                                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Node Instructions (Override/Append)</Label>
                                                                                    <div className="relative group">
                                                                                        <textarea
                                                                                            placeholder="Specific rules for this node..."
                                                                                            value={instructionsInput}
                                                                                            onChange={(e) => setInstructionsInput(e.target.value)}
                                                                                            className="w-full min-h-[100px] bg-accent/5 border-border rounded-xl p-4 text-sm font-mono focus:ring-primary/20 focus:border-primary/40 outline-none transition-all resize-none"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <DialogFooter className="gap-3 sm:justify-between py-2">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    className="text-muted-foreground text-[10px] tracking-widest uppercase hover:bg-rose-500/10 hover:text-rose-500"
                                                                                    onClick={() => {
                                                                                        handleToggleProvider(provider.id, !provider.is_enabled);
                                                                                        setEditingProvider(null);
                                                                                    }}
                                                                                >
                                                                                    {provider.is_enabled ? "Suspend Node" : "Reactivate Node"}
                                                                                </Button>
                                                                                <Button
                                                                                    className="h-12 bg-primary hover:bg-primary/80 px-8 rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(59,130,246,0.1)] dark:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                                                                    onClick={handleUpdateKey}
                                                                                    disabled={saving}
                                                                                >
                                                                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Changes"}
                                                                                </Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            </div>

                                                            <div className="h-10 w-[1px] bg-border/20 mx-2"></div>

                                                            <Switch
                                                                checked={provider.is_enabled}
                                                                onCheckedChange={(val) => handleToggleProvider(provider.id, val)}
                                                                className="data-[state=checked]:bg-primary scale-110"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <motion.div
                                whileHover={{ scale: 1.005 }}
                                whileTap={{ scale: 0.995 }}
                            >
                                <Button
                                    variant="outline"
                                    className="w-full h-20 bg-accent/5 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl group transition-all duration-500"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-accent/5 group-hover:bg-primary/20 transition-colors">
                                            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold group-hover:text-primary transition-colors">INTEGRATE NEW NEURAL NODE</p>
                                            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Connect Custom API or Local VLLM Interface</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                </Button>
                            </motion.div>
                        </div>
                    </div>

                    {/* Sidebar Command Center - 4 cols */}
                    <div className="xl:col-span-4 space-y-8">
                        {/* Global Routing Card */}
                        <Card className="bg-card/60 backdrop-blur-2xl border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
                                <Database className="h-24 w-24 text-primary" />
                            </div>
                            <CardHeader className="p-8 pb-4 relative z-10">
                                <CardTitle className="text-2xl font-black italic flex items-center gap-3">
                                    <TerminalIcon className="h-6 w-6 text-primary" />
                                    Orchestrator
                                </CardTitle>
                                <CardDescription className="font-mono text-[10px] uppercase tracking-tighter text-muted-foreground">
                                    Logic Protocols & Routing Directives
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 space-y-10 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            Master Gateway
                                        </Label>
                                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] font-mono leading-none py-0">FORCE_OVERRIDE</Badge>
                                    </div>
                                    <Select
                                        value={settings?.default_provider_id || "none"}
                                        onValueChange={(val) => handleSaveSettings({ default_provider_id: val === "none" ? null : val })}
                                    >
                                        <SelectTrigger className="h-14 rounded-xl bg-accent/5 border-border hover:bg-accent/10 transition-all font-mono text-xs">
                                            <SelectValue placeholder="AUTO_ORCHESTRATE" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border shadow-3xl rounded-xl backdrop-blur-3xl">
                                            <SelectItem value="none" className="font-mono text-xs uppercase italic py-3 hover:bg-primary/20">Automatic_Priority_Logic</SelectItem>
                                            <Separator className="my-1 opacity-20" />
                                            {providers.filter(p => p.is_enabled).map(p => (
                                                <SelectItem key={p.id} value={p.id} className="capitalize font-mono text-xs py-3 hover:bg-primary/20">{p.name}_Core</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground font-mono italic leading-relaxed px-1">
                                        System-default entry point. When unset, engine uses priority-weighted routing with automatic failover to the next healthy node.
                                    </p>
                                </div>

                                <Separator className="bg-border/10" />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Master Directive Payload</Label>
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all"></div>
                                        <textarea
                                            className="relative w-full h-[320px] bg-background/80 backdrop-blur-sm border border-border rounded-2xl p-6 text-sm font-mono text-primary/90 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all resize-none shadow-inner leading-relaxed selection:bg-primary/40 scrollbar-hide"
                                            placeholder="-- DEFINE SYSTEM PERSONALITY RULES --"
                                            value={settings?.system_instructions || ""}
                                            onChange={(e) => setSettings(s => s ? { ...s, system_instructions: e.target.value } : null)}
                                            onBlur={(e) => handleSaveSettings({ system_instructions: e.target.value })}
                                        />
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                                            <TerminalIcon className="h-4 w-4" />
                                            <span className="text-[9px] font-bold uppercase tracking-widest">ASM_DIRECTIVE</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Privacy Banner - Adaptive Tech */}
                        <div className="relative group cursor-help overflow-hidden rounded-3xl transition-all duration-700 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]"></div>
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-[80px] animate-pulse"></div>

                            <div className="relative p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20">
                                        <Shield className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping text-white"></span>
                                        <span className="text-[10px] font-black tracking-widest uppercase text-white">Encrypted_Path_Active</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-white italic tracking-tight">PROTECTED_FLOW</h3>
                                    <p className="text-xs text-indigo-50/90 dark:text-indigo-100/80 leading-relaxed font-medium">
                                        When Privacy Mode is engaged, all sensitive intern analysis is routed through a localized neural tunnel, bypassing external cloud gateways completely.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Badge className="bg-white/10 text-white border-white/20 text-[9px] font-mono">NODE_OLLAMA_7B</Badge>
                                    <Badge className="bg-white/10 text-white border-white/20 text-[9px] font-mono">E2E_AES_256</Badge>
                                    <Badge className="bg-white/10 text-white border-white/20 text-[9px] font-mono">TLS_1.3</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Control / Burn */}
                        <Card className="bg-rose-500/5 border border-rose-500/20 rounded-3xl overflow-hidden group hover:bg-rose-500/10 transition-all duration-500">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-rose-500 dark:text-rose-400 flex items-center gap-2 tracking-tight">
                                            <AlertTriangle className="h-4 w-4" />
                                            FAILSAFE_INIT
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground font-medium">Instantly suspend all external neural requests.</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="bg-transparent border-rose-500/30 text-rose-500 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all font-mono text-[10px] px-6">
                                        PANIC_SUSPEND
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Global toast system - hidden on mobile to avoid overlap with bottom nav */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none hidden md:block">
                <div className="flex items-center gap-4 bg-card/80 backdrop-blur-2xl p-3 px-6 rounded-full border border-border/50 shadow-3xl pointer-events-auto transition-transform hover:scale-105 active:scale-95">
                    <div className="flex -space-x-2">
                        {providers.slice(0, 3).map((p, i) => (
                            <div key={p.id} className={cn(
                                "h-6 w-6 rounded-full border-2 border-background z-[i]",
                                p.is_enabled ? "bg-primary" : "bg-muted"
                            )} />
                        ))}
                    </div>
                    <div className="h-4 w-[1px] bg-border/20 mx-1"></div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1 tracking-widest">Active Fleet</span>
                        <span className="text-xs font-mono font-bold leading-none">
                            {providers.filter(p => p.is_enabled).length} NODES_ONLINE
                        </span>
                    </div>
                    <Flame className="h-4 w-4 text-orange-500 ml-2 animate-bounce" />
                </div>
            </div>
        </div>
    );
}
