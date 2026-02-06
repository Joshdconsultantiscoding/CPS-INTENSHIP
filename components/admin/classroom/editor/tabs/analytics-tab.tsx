"use client";

import {
    BarChart3,
    Users,
    CheckCircle,
    PlayCircle,
    TrendingUp,
    MoreHorizontal,
    ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnalyticsTabProps {
    course: any;
}

export function AnalyticsTab({ course }: AnalyticsTabProps) {
    const enrollmentCount = course.course_assignments?.length || 0;
    const moduleCount = course.course_modules?.length || 0;
    const lessonCount = course.course_modules?.reduce((acc: number, m: any) => acc + (m.course_lessons?.length || 0), 0) || 0;

    const stats = [
        {
            title: "Total Enrollments",
            value: enrollmentCount.toString(),
            description: "Active interns in this course",
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Avg. Completion",
            value: "0%",
            description: "Lessons completed per intern",
            icon: CheckCircle,
            color: "text-green-500",
            bg: "bg-green-500/10"
        },
        {
            title: "Lesson Views",
            value: "0",
            description: "Total content interactions",
            icon: PlayCircle,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        {
            title: "Quiz Pass Rate",
            value: "0%",
            description: "Average score on assessments",
            icon: TrendingUp,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        }
    ];

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Course Analytics</h2>
                <p className="text-sm text-muted-foreground">Track engagement and progress for {course.title}.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`${stat.bg} p-2 rounded-lg`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base">Content Overview</CardTitle>
                        <CardDescription>Breakdown of modules and lessons.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Modules</span>
                            <span className="font-semibold">{moduleCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Lessons</span>
                            <span className="font-semibold">{lessonCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Learning Checks</span>
                            <span className="font-semibold">
                                {course.course_modules?.flatMap((m: any) => m.course_lessons || [])
                                    .reduce((acc: number, l: any) => acc + (l.course_questions?.length > 0 ? 1 : 0), 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Recent Enrollment Activity</CardTitle>
                            <CardDescription>Last 5 interns who joined.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {enrollmentCount === 0 ? (
                            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground italic">
                                No recent activity
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {course.course_assignments?.slice(0, 5).map((enrollment: any, idx: number) => (
                                    <div key={enrollment.id || enrollment.user_id || `enrollment-${idx}`} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                ID
                                            </div>
                                            <span>User {enrollment.user_id?.slice(0, 8) || "Unknown"}...</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {enrollment.assigned_at ? new Date(enrollment.assigned_at).toLocaleDateString() : "N/A"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
