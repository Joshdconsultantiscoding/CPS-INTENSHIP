"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Rocket, RotateCcw, Zap, Bug, Sparkles, AlertTriangle } from "lucide-react";
import { useNotifications } from "@/components/notifications/notification-engine";

interface ReleaseFormProps {
    currentVersion?: string;
}

export function ReleaseForm({ currentVersion = "v1.0.0" }: ReleaseFormProps) {
    const router = useRouter();
    const { setLatestVersion } = useNotifications();
    const [isLoading, setIsLoading] = useState(false);

    // Helper to increment version robustly
    const incrementVersion = (v: string) => {
        const parts = v.match(/\d+/g);
        if (parts && parts.length >= 1) {
            const lastPart = parts[parts.length - 1];
            const nextPatch = parseInt(lastPart) + 1;
            return v.replace(new RegExp(`${lastPart}$`), nextPatch.toString());
        }
        return v;
    };

    const initialVersion = incrementVersion(currentVersion);

    const [form, setForm] = useState({
        version: initialVersion,
        title: "",
        description: "",
        is_major: false,
        features: [""] as string[],
        fixes: [""] as string[],
        improvements: [""] as string[],
        breaking_changes: [""] as string[]
    });

    // Sync header on mount
    useEffect(() => {
        setLatestVersion(initialVersion);
    }, [setLatestVersion, initialVersion]);

    // Update global version preview when typing
    const handleVersionChange = (val: string) => {
        setForm(prev => ({ ...prev, version: val }));
        setLatestVersion(val);
    };

    const addField = (field: keyof typeof form) => {
        if (Array.isArray(form[field])) {
            setForm(prev => ({ ...prev, [field]: [...(prev[field] as string[]), ""] }));
        }
    };

    const removeField = (field: keyof typeof form, index: number) => {
        if (Array.isArray(form[field])) {
            const arr = [...(form[field] as string[])];
            arr.splice(index, 1);
            setForm(prev => ({ ...prev, [field]: arr }));
        }
    };

    const updateField = (field: keyof typeof form, index: number, value: string) => {
        if (Array.isArray(form[field])) {
            const arr = [...(form[field] as string[])];
            arr[index] = value;
            setForm(prev => ({ ...prev, [field]: arr }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.version || !form.title) {
            toast.error("Version and Title are required");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/changelogs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    features: form.features.filter(f => f.trim()),
                    fixes: form.fixes.filter(f => f.trim()),
                    improvements: form.improvements.filter(f => f.trim()),
                    breaking_changes: form.breaking_changes.filter(f => f.trim()),
                })
            });

            if (res.ok) {
                toast.success("Release published successfully!");
                router.push("/dashboard/updates");
                router.refresh();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to publish release");
            }
        } catch (error) {
            toast.error("Failed to publish release");
        } finally {
            setIsLoading(false);
        }
    };

    const renderListInput = (label: string, field: keyof typeof form, placeholder: string, icon?: React.ReactNode) => {
        const values = form[field] as string[];
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {icon}
                        <Label className="text-sm font-semibold">{label}</Label>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => addField(field)} className="h-8">
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                </div>
                {values.map((val, idx) => (
                    <div key={idx} className="flex gap-2">
                        <Input
                            placeholder={placeholder}
                            value={val}
                            onChange={(e) => updateField(field, idx, e.target.value)}
                        />
                        {values.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeField(field, idx)} className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="border-primary/20 shadow-lg">
                <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-primary" />
                        Release Details
                    </CardTitle>
                    <CardDescription>
                        Define the version and high-level summary of this update.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="version">Version Number</Label>
                            <Input
                                id="version"
                                placeholder="e.g. v1.2.0"
                                value={form.version}
                                onChange={e => handleVersionChange(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg h-[58px] bg-muted/50 mt-auto">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Major Update</Label>
                                <p className="text-[10px] text-muted-foreground">Flags this as a significant release.</p>
                            </div>
                            <Switch
                                checked={form.is_major}
                                onCheckedChange={val => setForm(prev => ({ ...prev, is_major: val }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Release Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. The Performance Update"
                            value={form.title}
                            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Short Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Briefly explain the goal of this version..."
                            rows={3}
                            value={form.description}
                            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="pt-6 space-y-6">
                        {renderListInput("New Features", "features", "Describe a new feature...", <Zap className="h-4 w-4 mr-2" />)}
                        <hr className="border-dashed" />
                        {renderListInput("Improvements", "improvements", "Describe an improvement...", <Sparkles className="h-4 w-4 mr-2" />)}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 space-y-6">
                        {renderListInput("Bug Fixes", "fixes", "Describe a fix...", <Bug className="h-4 w-4 mr-2" />)}
                        <hr className="border-dashed" />
                        {renderListInput("Breaking Changes", "breaking_changes", "Warning for users...", <AlertTriangle className="h-4 w-4 mr-2" />)}
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Discard
                </Button>
                <Button type="submit" disabled={isLoading} className="min-w-[140px]">
                    {isLoading ? "Publishing..." : "Publish Release"}
                    <Rocket className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}
