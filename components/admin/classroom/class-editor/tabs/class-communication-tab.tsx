"use client";

import {
    MessageSquare,
    Pin,
    Bell,
    ShieldAlert,
    Loader2,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { createAnnouncement, deleteAnnouncement, updateClassSettings } from "@/actions/classroom-admin";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClassCommunicationTabProps {
    classData: any;
    announcements: any[];
}

export function ClassCommunicationTab({ classData, announcements }: ClassCommunicationTabProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    // Communication Settings State
    const [chatEnabled, setChatEnabled] = useState(classData.chat_enabled ?? true);
    const [announcementsEnabled, setAnnouncementsEnabled] = useState(classData.announcements_enabled ?? true);
    const [postingPermissions, setPostingPermissions] = useState(classData.posting_permissions ?? "all");

    const handleSettingChange = async (update: any) => {
        try {
            await updateClassSettings(classData.id, update);
            toast.success("Settings updated successfully");
        } catch (error) {
            toast.error("Failed to update settings");
            // Revert state on failure
            if (update.chat_enabled !== undefined) setChatEnabled(classData.chat_enabled);
            if (update.announcements_enabled !== undefined) setAnnouncementsEnabled(classData.announcements_enabled);
            if (update.posting_permissions !== undefined) setPostingPermissions(classData.posting_permissions);
        }
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        try {
            await createAnnouncement({
                classId: classData.id,
                title,
                content
            });
            toast.success("Announcement posted and interns notified! 📢");
            setIsCreateDialogOpen(false);
            setTitle("");
            setContent("");
        } catch (error) {
            toast.error("Failed to post announcement");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return;

        try {
            await deleteAnnouncement(id, classData.id);
            toast.success("Announcement deleted");
        } catch (error) {
            toast.error("Failed to delete announcement");
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Communication Channel</h3>
                    <p className="text-sm text-muted-foreground">
                        Control how interns interact with each other in this class.
                    </p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Bell className="h-4 w-4" />
                            New Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Post New Announcement</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateAnnouncement} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g., Weekly Sync Reminder"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Message Content</Label>
                                <Textarea
                                    id="content"
                                    placeholder="Write your announcement here..."
                                    rows={4}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Post Announcement
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6">
                {/* Chat Control */}
                <Card className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Class Chat Room</Label>
                            <p className="text-xs text-muted-foreground">Enable a dedicated message channel for this cohort.</p>
                        </div>
                    </div>
                    <Switch
                        checked={chatEnabled}
                        onCheckedChange={(checked) => {
                            setChatEnabled(checked);
                            handleSettingChange({ chat_enabled: checked });
                        }}
                    />
                </Card>

                {/* Announcement Control */}
                <Card className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Public Announcements</Label>
                            <p className="text-xs text-muted-foreground">Allow mentors to pin global messages to the top of the feed.</p>
                        </div>
                    </div>
                    <Switch
                        checked={announcementsEnabled}
                        onCheckedChange={(checked) => {
                            setAnnouncementsEnabled(checked);
                            handleSettingChange({ announcements_enabled: checked });
                        }}
                    />
                </Card>

                {/* Post Permissions */}
                <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Posting Permissions
                    </h4>
                    <div className="grid gap-3">
                        {[
                            { id: "all", label: "Everyone (All Interns & Mentors)" },
                            { id: "mentors", label: "Mentors Only" },
                            { id: "staff", label: "Staff Only (Admins & Moderators)" }
                        ].map((opt) => (
                            <div key={opt.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/5">
                                <Label htmlFor={opt.id} className="text-sm cursor-pointer flex-1">{opt.label}</Label>
                                <input
                                    type="radio"
                                    id={opt.id}
                                    title={opt.label}
                                    name="posting_permissions"
                                    checked={postingPermissions === opt.id}
                                    onChange={() => {
                                        setPostingPermissions(opt.id);
                                        handleSettingChange({ posting_permissions: opt.id });
                                    }}
                                    className="h-4 w-4 text-primary cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Announcements List */}
            <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Pin className="h-4 w-4" />
                    Pinned Announcements
                </h4>

                {announcements.length > 0 ? (
                    <div className="grid gap-4">
                        {announcements.map((announcement) => (
                            <Card key={announcement.id} className="p-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={announcement.author?.avatar_url} />
                                            <AvatarFallback>{announcement.author?.full_name?.charAt(0) || 'A'}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h5 className="text-sm font-semibold">{announcement.title}</h5>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {format(new Date(announcement.created_at), "MMM d, h:mm a")}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => handleDelete(announcement.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed p-12 text-center bg-muted/5">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <Pin className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h4 className="mt-4 text-sm font-medium">No Announcements Yet</h4>
                        <p className="mb-4 mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
                            A list of all current pins will appear here once you post them.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
