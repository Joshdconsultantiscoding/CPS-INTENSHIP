"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Send, Users, User, Globe, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string;
}

export default function SendNotificationPage() {
    const router = useRouter();
    const supabase = createClient();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Form state
    const [targetType, setTargetType] = useState<"USER" | "GROUP" | "ALL">("USER");
    const [targetUserId, setTargetUserId] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [priorityLevel, setPriorityLevel] = useState<"NORMAL" | "IMPORTANT" | "CRITICAL">("NORMAL");
    const [notificationType, setNotificationType] = useState("system");
    const [link, setLink] = useState("");
    const [repeatInterval, setRepeatInterval] = useState(5);
    const [maxRepeats, setMaxRepeats] = useState(3);
    const [expiresInHours, setExpiresInHours] = useState(24);

    // Fetch users for targeting
    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .order("full_name");

            if (data) setUsers(data);
            setIsFetching(false);
        };
        fetchUsers();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            toast.error("Title and message are required");
            return;
        }

        if (targetType === "USER" && !targetUserId) {
            toast.error("Please select a target user");
            return;
        }

        setIsLoading(true);

        try {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expiresInHours);

            const res = await fetch("/api/notifications/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetType,
                    targetUserId: targetType === "USER" ? targetUserId : null,
                    title,
                    message,
                    type: notificationType,
                    priorityLevel,
                    repeatInterval: priorityLevel === "IMPORTANT" ? repeatInterval : 0,
                    maxRepeats: priorityLevel === "IMPORTANT" ? maxRepeats : 0,
                    expiresAt: expiresAt.toISOString(),
                    link: link.trim() || null
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to send");
            }

            toast.success("Notification sent successfully!");

            // Reset form
            setTitle("");
            setMessage("");
            setLink("");
            setTargetUserId("");

        } catch (error: any) {
            toast.error(error.message || "Failed to send notification");
        } finally {
            setIsLoading(false);
        }
    };

    const getPriorityIcon = () => {
        switch (priorityLevel) {
            case "CRITICAL": return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case "IMPORTANT": return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getPriorityColor = () => {
        switch (priorityLevel) {
            case "CRITICAL": return "border-red-500 bg-red-50 dark:bg-red-950/20";
            case "IMPORTANT": return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
            default: return "border-blue-500 bg-blue-50 dark:bg-blue-950/20";
        }
    };

    return (
        <div className="container max-w-3xl py-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Send Notification</CardTitle>
                            <CardDescription>
                                Send persistent notifications to users, groups, or everyone
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Target Selection */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Target Audience</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <Button
                                    type="button"
                                    variant={targetType === "USER" ? "default" : "outline"}
                                    onClick={() => setTargetType("USER")}
                                    className="flex items-center gap-2"
                                >
                                    <User className="h-4 w-4" />
                                    Single User
                                </Button>
                                <Button
                                    type="button"
                                    variant={targetType === "GROUP" ? "default" : "outline"}
                                    onClick={() => setTargetType("GROUP")}
                                    className="flex items-center gap-2"
                                >
                                    <Users className="h-4 w-4" />
                                    Group
                                </Button>
                                <Button
                                    type="button"
                                    variant={targetType === "ALL" ? "default" : "outline"}
                                    onClick={() => setTargetType("ALL")}
                                    className="flex items-center gap-2"
                                >
                                    <Globe className="h-4 w-4" />
                                    Everyone
                                </Button>
                            </div>

                            {targetType === "USER" && (
                                <Select value={targetUserId} onValueChange={setTargetUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a user..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.full_name || user.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Priority Level */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Priority Level</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <Button
                                    type="button"
                                    variant={priorityLevel === "NORMAL" ? "default" : "outline"}
                                    onClick={() => setPriorityLevel("NORMAL")}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Info className="h-4 w-4" />
                                    Normal
                                </Button>
                                <Button
                                    type="button"
                                    variant={priorityLevel === "IMPORTANT" ? "default" : "outline"}
                                    onClick={() => setPriorityLevel("IMPORTANT")}
                                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black"
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    Important
                                </Button>
                                <Button
                                    type="button"
                                    variant={priorityLevel === "CRITICAL" ? "default" : "outline"}
                                    onClick={() => setPriorityLevel("CRITICAL")}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                    Critical
                                </Button>
                            </div>

                            {/* Priority description */}
                            <div className={`p-3 rounded-lg border-2 ${getPriorityColor()}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {getPriorityIcon()}
                                    <span className="font-medium">
                                        {priorityLevel === "CRITICAL" && "Blocks screen until acknowledged"}
                                        {priorityLevel === "IMPORTANT" && "Retries until read"}
                                        {priorityLevel === "NORMAL" && "Standard notification"}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {priorityLevel === "CRITICAL" && "User cannot dismiss without clicking acknowledge. Alarm sound plays continuously."}
                                    {priorityLevel === "IMPORTANT" && "Shows repeatedly until user reads it or max retries reached."}
                                    {priorityLevel === "NORMAL" && "Shows once as a toast notification."}
                                </p>
                            </div>
                        </div>

                        {/* Retry settings for IMPORTANT */}
                        {priorityLevel === "IMPORTANT" && (
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200">
                                <div className="space-y-2">
                                    <Label>Repeat Every (minutes)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={60}
                                        value={repeatInterval}
                                        onChange={(e) => setRepeatInterval(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Repeats</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={maxRepeats}
                                        onChange={(e) => setMaxRepeats(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Title & Message */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title *</Label>
                                <Input
                                    placeholder="Notification title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Message *</Label>
                                <Textarea
                                    placeholder="Notification message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    required
                                />
                            </div>
                        </div>

                        {/* Optional fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Link (optional)</Label>
                                <Input
                                    placeholder="/dashboard/tasks"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Expires in (hours)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={168}
                                    value={expiresInHours}
                                    onChange={(e) => setExpiresInHours(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isLoading || isFetching}
                            className="w-full"
                        >
                            {isLoading ? (
                                <>Sending...</>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Notification
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
