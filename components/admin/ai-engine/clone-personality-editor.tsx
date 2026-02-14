"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    UserCog,
    Save,
    Loader2,
    Plus,
    X,
    Eye,
} from "lucide-react";

interface PersonalityConfig {
    tone: string;
    authority_style: string;
    escalation_enabled: boolean;
    discipline_framework: string;
    custom_rules: string[];
}

export default function ClonePersonalityEditor() {
    const [config, setConfig] = useState<PersonalityConfig>({
        tone: "professional",
        authority_style: "firm_but_fair",
        escalation_enabled: true,
        discipline_framework: "progressive",
        custom_rules: [],
    });
    const [newRule, setNewRule] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [preview, setPreview] = useState("");
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/ai/settings");
                if (res.ok) {
                    const data = await res.json();
                    if (data.personality_config) {
                        setConfig(data.personality_config);
                    }
                }
            } catch (e) {
                console.error("Failed to load personality:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch("/api/ai/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ personality_config: config }),
            });

            if (res.ok) {
                toast.success("Clone personality updated");
            } else {
                const err = await res.json();
                toast.error(err.error || "Save failed");
            }
        } catch (e: any) {
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    }

    function addRule() {
        if (newRule.trim()) {
            setConfig({ ...config, custom_rules: [...config.custom_rules, newRule.trim()] });
            setNewRule("");
        }
    }

    function removeRule(index: number) {
        setConfig({
            ...config,
            custom_rules: config.custom_rules.filter((_, i) => i !== index),
        });
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" />
                        Digital Admin Clone Personality
                    </CardTitle>
                    <CardDescription>
                        Configure how the AI behaves as your digital clone. This is Layer 3 of the knowledge hierarchy.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Communication Tone</Label>
                            <Select
                                value={config.tone}
                                onValueChange={(v) => setConfig({ ...config, tone: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="friendly">Friendly</SelectItem>
                                    <SelectItem value="strict">Strict</SelectItem>
                                    <SelectItem value="mentoring">Mentoring</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Authority Style</Label>
                            <Select
                                value={config.authority_style}
                                onValueChange={(v) => setConfig({ ...config, authority_style: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="firm_but_fair">Firm but Fair</SelectItem>
                                    <SelectItem value="strict_enforcement">Strict Enforcement</SelectItem>
                                    <SelectItem value="supportive">Supportive</SelectItem>
                                    <SelectItem value="collaborative">Collaborative</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Discipline Framework</Label>
                        <Select
                            value={config.discipline_framework}
                            onValueChange={(v) => setConfig({ ...config, discipline_framework: v })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="progressive">Progressive (3-strike)</SelectItem>
                                <SelectItem value="immediate">Immediate Consequences</SelectItem>
                                <SelectItem value="restorative">Restorative (focus on correction)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <Label>Auto-Escalation</Label>
                            <p className="text-xs text-muted-foreground">Automatically escalate severe violations</p>
                        </div>
                        <Switch
                            checked={config.escalation_enabled}
                            onCheckedChange={(v) => setConfig({ ...config, escalation_enabled: v })}
                        />
                    </div>

                    {/* Custom Rules */}
                    <div className="space-y-3">
                        <Label>Custom Admin Rules</Label>
                        <p className="text-xs text-muted-foreground">
                            Add rules the AI must follow in addition to knowledge base policies
                        </p>
                        <div className="space-y-2">
                            {config.custom_rules.map((rule, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                    <Badge variant="secondary" className="shrink-0 text-[10px]">{i + 1}</Badge>
                                    <span className="text-sm flex-1">{rule}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeRule(i)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newRule}
                                onChange={(e) => setNewRule(e.target.value)}
                                placeholder="e.g., Never reveal salary information"
                                onKeyDown={(e) => e.key === "Enter" && addRule()}
                            />
                            <Button variant="outline" size="icon" onClick={addRule} disabled={!newRule.trim()}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Personality
                </Button>
            </div>
        </div>
    );
}
