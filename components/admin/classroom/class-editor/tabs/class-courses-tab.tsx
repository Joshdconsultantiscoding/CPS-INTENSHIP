"use client";

import { useState } from "react";
import {
    BookOpen,
    BookOpenCheck,
    Plus,
    Trash2,
    Calendar,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { assignCourseToClass, removeCourseFromClass } from "@/actions/classroom-admin";

import { useRouter } from "next/navigation";

interface ClassCoursesTabProps {
    classData: any;
    classCourses: any[];
    availableCourses: any[];
}

export function ClassCoursesTab({ classData, classCourses, availableCourses }: ClassCoursesTabProps) {
    const router = useRouter();
    const [isAssigning, setIsAssigning] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState<string | null>(null);

    // List of courses NOT already assigned to this class
    const assignedCourseIds = new Set(classCourses.map(c => c.course_id));
    const unassignedCourses = availableCourses.filter(c => !assignedCourseIds.has(c.id));

    const handleAssignCourse = async (courseId: string) => {
        setIsAssigning(courseId);
        try {
            await assignCourseToClass(classData.id, courseId);
            toast.success("Course assigned", {
                description: "The course is now available to all interns in this class.",
            });
            router.refresh();
        } catch (error) {
            toast.error("Failed to assign course.");
        } finally {
            setIsAssigning(null);
        }
    };

    const handleRemoveCourse = async (courseId: string) => {
        if (!confirm("Remove this course from the class curriculum?")) return;

        setIsRemoving(courseId);
        try {
            await removeCourseFromClass(classData.id, courseId);
            toast.success("Course removed", {
                description: "The curriculum has been updated.",
            });
            router.refresh();
        } catch (error) {
            toast.error("Failed to remove course.");
        } finally {
            setIsRemoving(null);
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div>
                <h3 className="text-lg font-medium">Assigned Learning Paths</h3>
                <p className="text-sm text-muted-foreground">
                    Assign specific courses that all interns in this class must complete.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Active Courses List */}
                <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <BookOpenCheck className="h-4 w-4" />
                        Class Curriculum
                    </h4>

                    {classCourses.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                            <BookOpen className="h-8 w-8 text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground">No courses have been assigned to this class yet.</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {classCourses.map((cc) => (
                                <Card key={cc.course_id} className="p-4 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h5 className="font-medium">{cc.courses?.title}</h5>
                                            <div className="flex items-center gap-3 mt-1">
                                                <Badge variant="outline" className="text-[10px] capitalize">
                                                    {cc.courses?.level || "Beginner"}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    No deadline set
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                        onClick={() => handleRemoveCourse(cc.course_id)}
                                        disabled={isRemoving === cc.course_id}
                                    >
                                        {isRemoving === cc.course_id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Library to Add From */}
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Available Courses
                    </h4>
                    <Card className="divide-y max-h-[500px] overflow-y-auto">
                        {unassignedCourses.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                                All courses from the library are already assigned.
                            </div>
                        ) : (
                            unassignedCourses.map((course) => (
                                <div key={course.id} className="p-3 flex items-center justify-between hover:bg-muted/30">
                                    <div className="min-w-0 pr-2">
                                        <p className="text-sm font-medium truncate">{course.title}</p>
                                        <p className="text-[10px] text-muted-foreground capitalize">
                                            {course.level} • {course.duration_minutes}m
                                        </p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={() => handleAssignCourse(course.id)}
                                        disabled={isAssigning === course.id}
                                    >
                                        {isAssigning === course.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Plus className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            ))
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
