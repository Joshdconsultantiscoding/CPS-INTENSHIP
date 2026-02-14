"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Key,
    Save,
    Loader2,
    Shield,
    Eye,
    EyeOff,
    Zap,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";

interface AISettingsData {
    ai_provider: string;
    model_name: string;
    embedding_model: string;
    system_instructions: string;
    personality_config: {
        tone: string;
        authority_style: string;
        escalation_enabled: boolean;
        discipline_framework: string;
        custom_rules: string[];
    };
    autonomous_mode: boolean;
    autonomous_config: {
        monitor_deadlines: boolean;
        monitor_submissions: boolean;
        monitor_activity: boolean;
        auto_warn: boolean;
        auto_grade: boolean;
    };
    max_file_size_mb: number;
    has_api_key: boolean;
    api_key_masked: string | null;
}

export default function AISettingsPanel() {
    const [settings, setSettings] = useState<AISettingsData | null>(null);
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [systemInstructions, setSystemInstructions] = useState("");
    const [provider, setProvider] = useState("openai");
    const [modelName, setModelName] = useState("gpt-4o-mini");
    const [autonomousMode, setAutonomousMode] = useState(false);
    const [maxFileSize, setMaxFileSize] = useState(10);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            const res = await fetch("/api/ai/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                setSystemInstructions(data.system_instructions || "");
                setProvider(data.ai_provider || "openai");
                setModelName(data.model_name || "gpt-4o-mini");
                setAutonomousMode(data.autonomous_mode || false);
                setMaxFileSize(data.max_file_size_mb || 10);
            }
        } catch (e) {
            console.error("Failed to load AI settings:", e);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const body: Record<string, any> = {
                ai_provider: provider,
                model_name: modelName,
                system_instructions: systemInstructions,
                autonomous_mode: autonomousMode,
                max_file_size_mb: maxFileSize,
            };

            if (apiKey.trim()) {
                body.api_key = apiKey.trim();
            }

            const res = await fetch("/api/ai/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success("AI settings saved successfully");
                setApiKey("");
                fetchSettings();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to save settings");
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* API Key Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        AI Model Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure your AI provider API key and model settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        {settings?.has_api_key ? (
                            <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                API Key Set
                            </Badge>
                        ) : (
                            <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                No API Key
                            </Badge>
                        )}
                        {settings?.api_key_masked && (
                            <span className="text-xs text-muted-foreground font-mono">
                                {settings.api_key_masked}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>AI Provider</Label>
                            <Select value={provider} onValueChange={setProvider}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="google">Google Gemini</SelectItem>
                                    <SelectItem value="anthropic">Anthropic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Model Name</Label>
                            <Input
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                                placeholder="gpt-4o-mini"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>API Key {settings?.has_api_key ? "(leave blank to keep current)" : ""}</Label>
                        <div className="relative">
                            <Input
                                type={showApiKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={settings?.has_api_key ? "••••••••••••" : "Enter your API key"}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full"
                                onClick={() => setShowApiKey(!showApiKey)}
                            >
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Encrypted with AES-256-GCM before storage
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* System Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        System Instructions
                    </CardTitle>
                    <CardDescription>
                        Base instructions that define the AI&apos;s core behavior and authority boundaries
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={systemInstructions}
                        onChange={(e) => setSystemInstructions(e.target.value)}
                        placeholder="Enter system instructions for the AI clone..."
                        className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        These instructions form Layer 3 of the knowledge hierarchy and are always included in the AI context.
                    </p>
                </CardContent>
            </Card>

            {/* Autonomous Mode */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Autonomous Mode
                    </CardTitle>
                    <CardDescription>
                        When enabled, the AI can make decisions independently based on knowledge base authority
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="font-medium">Enable Autonomous Mode</Label>
                            <p className="text-xs text-muted-foreground">
                                AI will monitor and act on intern activity automatically
                            </p>
                        </div>
                        <Switch
                            checked={autonomousMode}
                            onCheckedChange={setAutonomousMode}
                        />
                    </div>
                    {autonomousMode && (
                        <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20 space-y-2">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Autonomous Mode Active
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                All autonomous decisions are logged. Admin override is always available.
                                Decisions reference source document chunk IDs and authority layers.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Max File Upload Size (MB)</Label>
                        <Input
                            type="number"
                            value={maxFileSize}
                            onChange={(e) => setMaxFileSize(parseInt(e.target.value) || 10)}
                            min={1}
                            max={50}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Settings
                </Button>
            </div>
        </div>
    );
}
