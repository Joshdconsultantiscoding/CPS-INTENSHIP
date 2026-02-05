"use client";

import {
    Trash2,
    Archive,
    Copy,
    AlertTriangle,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteClass } from "@/actions/classroom-admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ClassSettingsTabProps {
    classData: any;
}

export function ClassSettingsTab({ classData }: ClassSettingsTabProps) {
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("Are you SURE? This will delete the class and all its messages/activities permanently. Enrollment data will also be lost.")) return;

        try {
            await deleteClass(classData.id);
            toast.success("Class deleted", {
                description: "The class has been removed successfully.",
            });
            router.push("/dashboard/admin/classroom");
        } catch (error) {
            toast.error("Failed to delete class.");
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div>
                <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                    Irreversible actions for this class. Use with caution.
                </p>
            </div>

            <div className="grid gap-4">
                {/* Archive */}
                <Card className="p-4 flex items-center justify-between border-amber-200 bg-amber-50/10">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Archive className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Archive Class</p>
                            <p className="text-xs text-muted-foreground">Hide from interns but keep data for records.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">Archive</Button>
                </Card>

                {/* Clone */}
                <Card className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Copy className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Clone Structure</p>
                            <p className="text-xs text-muted-foreground">Duplicate this class's settings for a new cohort.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">Clone</Button>
                </Card>

                {/* Delete */}
                <Card className="p-4 flex items-center justify-between border-destructive/20 bg-destructive/5">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                            <Trash2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Delete Permanently</p>
                            <p className="text-xs text-muted-foreground">All data associated with this class will be purged.</p>
                        </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
                </Card>
            </div>

            <div className="pt-8 border-t flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit Info</p>
                    <p className="text-[10px] text-muted-foreground">
                        Class created on {new Date(classData.created_at).toLocaleString()} by Admin.
                        Last modified on {new Date(classData.updated_at).toLocaleString()}.
                    </p>
                </div>
            </div>
        </div>
    );
}
