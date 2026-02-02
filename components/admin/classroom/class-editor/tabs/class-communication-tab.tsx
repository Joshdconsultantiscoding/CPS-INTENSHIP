"use client";

import {
    MessageSquare,
    Pin,
    Bell,
    ShieldAlert,
    MessageSquareOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClassCommunicationTabProps {
    classData: any;
}

export function ClassCommunicationTab({ classData }: ClassCommunicationTabProps) {
    return (
        <div className="p-6 space-y-8">
            <div>
                <h3 className="text-lg font-medium">Communication Channel</h3>
                <p className="text-sm text-muted-foreground">
                    Control how interns interact with each other in this class.
                </p>
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
                    <Switch checked={true} />
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
                    <Switch checked={true} />
                </Card>

                {/* Post Permissions */}
                <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Posting Permissions
                    </h4>
                    <div className="grid gap-3">
                        {[
                            { id: "all", label: "Everyone (All Interns & Mentors)", checked: true },
                            { id: "mentors", label: "Mentors Only", checked: false },
                            { id: "admin", label: "Staff Only (Admins & Moderators)", checked: false }
                        ].map((opt) => (
                            <div key={opt.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/5">
                                <span className="text-sm">{opt.label}</span>
                                <input
                                    type="radio"
                                    name="perm"
                                    checked={opt.checked}
                                    readOnly
                                    className="h-4 w-4 text-primary"
                                    aria-label={opt.label}
                                    title={opt.label}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Empty State / Coming Soon Hint */}
            <div className="rounded-lg border border-dashed p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Pin className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="mt-4 text-sm font-medium">Pinned Announcements</h4>
                <p className="mb-4 mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
                    A list of all current pins will appear here once you post them in the class activity feed.
                </p>
                <Button variant="outline" size="sm" disabled>Create Announcement</Button>
            </div>
        </div>
    );
}
