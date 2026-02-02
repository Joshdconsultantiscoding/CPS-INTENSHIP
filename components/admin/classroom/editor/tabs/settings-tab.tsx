"use client";

import { useState } from "react";
import {
    Settings,
    Lock,
    Unlock,
    Users,
    Trash2,
    Plus,
    Save,
    Loader2,
    DollarSign,
    Target,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateCourseAdvanced } from "@/actions/classroom-advanced";
import { toast } from "sonner";

interface SettingsTabProps {
    course: any;
    interns: any[];
    classes: any[];
}

export function SettingsTab({ course, interns, classes }: SettingsTabProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [assignmentType, setAssignmentType] = useState(course.assignment_type || "global");
    const [status, setStatus] = useState(course.status || "draft");

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            await updateCourseAdvanced(course.id, {
                assignment_type: assignmentType,
                status: status,
                is_published: status === "published"
            });
            toast.success("Course settings updated!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Visibility & Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            Visibility & Status
                        </CardTitle>
                        <CardDescription>Control how and when interns see this course.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Course Status</Label>
                            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft (Admin Only)</SelectItem>
                                    <SelectItem value="published">Published (Visible to Interns)</SelectItem>
                                    <SelectItem value="archived">Archived (Hidden)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Access Method</Label>
                            <Select value={assignmentType} onValueChange={(val: any) => setAssignmentType(val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">Global (Available to all interns)</SelectItem>
                                    <SelectItem value="selective">Selective (Assigned manually)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4 border-t">
                            <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Update Visibility
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing (Placeholder/Basic) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            Pricing
                        </CardTitle>
                        <CardDescription>Set the cost for this course.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Free Course</Label>
                                <p className="text-xs text-muted-foreground">Interns can enroll for free.</p>
                            </div>
                            <Switch checked={course.price === 0} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Price (USD)</Label>
                            <Input type="number" defaultValue={course.price || 0} disabled />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assignment Logic (Only if selective) */}
            {assignmentType === "selective" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Course Enrollment Assignments
                        </CardTitle>
                        <CardDescription>Assign this course to specific interns or classes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label>Assigned Interns ({course.course_assignments?.length || 0})</Label>
                                <div className="border rounded-lg h-64 overflow-y-auto bg-muted/5 p-2 space-y-1">
                                    {interns.map((intern) => {
                                        const isAssigned = course.course_assignments?.some((a: any) => a.user_id === intern.id);
                                        return (
                                            <div key={intern.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-sm">
                                                <span className="truncate flex-1">{intern.full_name} ({intern.email})</span>
                                                <Button size="sm" variant={isAssigned ? "destructive" : "outline"} className="h-7 text-[10px]">
                                                    {isAssigned ? "Remove" : "Assign"}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Assigned Classes</Label>
                                <div className="border rounded-lg h-64 overflow-y-auto bg-muted/5 p-2 space-y-1">
                                    {classes.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-sm">
                                            <span className="truncate flex-1 font-medium">{c.name}</span>
                                            <Button size="sm" variant="outline" className="h-7 text-[10px]">
                                                Assign All
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                            Tip: Assigning a class will enroll all current members of that class.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
