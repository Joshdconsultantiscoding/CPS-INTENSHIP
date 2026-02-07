"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Users,
    BookOpen,
    Award,
    Clock,
    TrendingUp,
    Trophy,
    AlertTriangle,
    Download,
    Activity,
    Target,
    BarChart3,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { exportAnalyticsCSV, type LMSAnalytics } from "@/actions/lms-analytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LMSAnalyticsDashboardProps {
    analytics: LMSAnalytics;
}

export function LMSAnalyticsDashboard({ analytics }: LMSAnalyticsDashboardProps) {
    const [exporting, setExporting] = useState<string | null>(null);

    const handleExport = async (type: "courses" | "quizzes" | "leaderboard" | "cheating") => {
        setExporting(type);
        try {
            const { csvContent, filename } = await exportAnalyticsCSV(type);
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`Exported ${filename}`);
        } catch (error) {
            toast.error("Export failed");
        }
        setExporting(null);
    };

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Interns</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.totalInterns}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-500">{analytics.overview.activeLearnersToday}</span> active today
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.totalCourses}</div>
                        <p className="text-xs text-muted-foreground">Published courses</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Quiz Performance</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.quizStats.avgScore}%</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.quizStats.passRate}% pass rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Certificates</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.certificatesIssued}</div>
                        <p className="text-xs text-muted-foreground">Total issued</p>
                    </CardContent>
                </Card>

                <Card className={cn(
                    analytics.cheatingFlags.length > 0 && "border-red-200 bg-red-50/50"
                )}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Flagged</CardTitle>
                        <AlertTriangle className={cn(
                            "h-4 w-4",
                            analytics.cheatingFlags.length > 0 ? "text-red-500" : "text-muted-foreground"
                        )} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.cheatingFlags.length}</div>
                        <p className="text-xs text-muted-foreground">Suspicious attempts</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="courses" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                    <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                    <TabsTrigger value="cheating">Cheating Flags</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                {/* Courses Tab */}
                <TabsContent value="courses">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Course Performance</CardTitle>
                                <CardDescription>Enrollment and completion metrics per course</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport("courses")}
                                disabled={exporting === "courses"}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course</TableHead>
                                        <TableHead className="text-center">Enrolled</TableHead>
                                        <TableHead className="text-center">Completed</TableHead>
                                        <TableHead className="text-center">Avg Time</TableHead>
                                        <TableHead className="text-center">Pass Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.courseStats.map((course) => (
                                        <TableRow key={course.courseId}>
                                            <TableCell className="font-medium">{course.courseTitle}</TableCell>
                                            <TableCell className="text-center">{course.enrolledCount}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={course.completedCount > 0 ? "default" : "secondary"}>
                                                    {course.completedCount}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{formatTime(course.avgTimeSpentMinutes)}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Progress value={course.passRate} className="w-16 h-2" />
                                                    <span className="text-sm">{course.passRate}%</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {analytics.courseStats.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                No course data available
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Quizzes Tab */}
                <TabsContent value="quizzes">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Quiz Analytics</CardTitle>
                                <CardDescription>
                                    {analytics.quizStats.totalAttempts} total attempts • {analytics.quizStats.avgScore}% avg score
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport("quizzes")}
                                disabled={exporting === "quizzes"}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Quiz</TableHead>
                                        <TableHead className="text-center">Attempts</TableHead>
                                        <TableHead className="text-center">Avg Score</TableHead>
                                        <TableHead className="text-center">Pass Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.quizStats.topQuizzes.map((quiz) => (
                                        <TableRow key={quiz.quizId}>
                                            <TableCell className="font-medium">{quiz.quizTitle}</TableCell>
                                            <TableCell className="text-center">{quiz.attempts}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={quiz.avgScore >= 70 ? "default" : "destructive"}>
                                                    {quiz.avgScore}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Progress
                                                        value={quiz.passRate}
                                                        className={cn(
                                                            "w-16 h-2",
                                                            quiz.passRate >= 70 && "[&>div]:bg-green-500"
                                                        )}
                                                    />
                                                    <span className="text-sm">{quiz.passRate}%</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Leaderboard Tab */}
                <TabsContent value="leaderboard">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                    Top Performers
                                </CardTitle>
                                <CardDescription>Interns ranked by performance</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport("leaderboard")}
                                disabled={exporting === "leaderboard"}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Intern</TableHead>
                                        <TableHead className="text-center">Courses</TableHead>
                                        <TableHead className="text-center">Avg Score</TableHead>
                                        <TableHead className="text-center">Time</TableHead>
                                        <TableHead className="text-center">Certificates</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.leaderboard.map((intern, idx) => (
                                        <TableRow key={intern.userId}>
                                            <TableCell>
                                                {idx < 3 ? (
                                                    <Badge variant={idx === 0 ? "default" : "secondary"} className={cn(
                                                        idx === 0 && "bg-amber-500",
                                                        idx === 1 && "bg-gray-400",
                                                        idx === 2 && "bg-amber-700"
                                                    )}>
                                                        {idx + 1}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">{idx + 1}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={intern.avatarUrl || ""} />
                                                        <AvatarFallback>{intern.fullName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{intern.fullName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">{intern.coursesCompleted}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={intern.avgScore >= 80 ? "default" : "secondary"}>
                                                    {intern.avgScore}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{formatTime(intern.totalTimeMinutes)}</TableCell>
                                            <TableCell className="text-center">
                                                {intern.certificatesEarned > 0 ? (
                                                    <Badge variant="outline" className="gap-1">
                                                        <Award className="h-3 w-3" />
                                                        {intern.certificatesEarned}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Cheating Tab */}
                <TabsContent value="cheating">
                    <Card className={cn(
                        analytics.cheatingFlags.length > 0 && "border-red-200"
                    )}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    Flagged Attempts
                                </CardTitle>
                                <CardDescription>Quiz attempts with suspicious behavior</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExport("cheating")}
                                disabled={exporting === "cheating"}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Intern</TableHead>
                                        <TableHead>Quiz</TableHead>
                                        <TableHead className="text-center">Tab Switches</TableHead>
                                        <TableHead className="text-center">Idle Time</TableHead>
                                        <TableHead className="text-center">Fullscreen Exits</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analytics.cheatingFlags.map((flag) => (
                                        <TableRow key={flag.attemptId}>
                                            <TableCell className="font-medium">{flag.userName}</TableCell>
                                            <TableCell>{flag.quizTitle}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={flag.tabSwitches > 3 ? "destructive" : "outline"}>
                                                    {flag.tabSwitches}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{formatTime(Math.round(flag.idleTimeSeconds / 60))}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={flag.fullscreenExits > 1 ? "destructive" : "outline"}>
                                                    {flag.fullscreenExits}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-sm">
                                                {formatDate(flag.timestamp)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {analytics.cheatingFlags.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                                No suspicious activity detected
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>Latest learning events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.recentActivity.map((activity, idx) => (
                                    <div key={idx} className="flex items-start gap-4 pb-4 border-b last:border-0">
                                        <div className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                            activity.type === "certificate" && "bg-amber-100 text-amber-600",
                                            activity.type === "quiz_passed" && "bg-green-100 text-green-600",
                                            activity.type === "quiz_failed" && "bg-red-100 text-red-600"
                                        )}>
                                            {activity.type === "certificate" && <Award className="h-4 w-4" />}
                                            {activity.type === "quiz_passed" && <CheckCircle2 className="h-4 w-4" />}
                                            {activity.type === "quiz_failed" && <XCircle className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{activity.userName}</p>
                                            <p className="text-sm text-muted-foreground truncate">{activity.details}</p>
                                        </div>
                                        <time className="text-xs text-muted-foreground shrink-0">
                                            {formatDate(activity.timestamp)}
                                        </time>
                                    </div>
                                ))}
                                {analytics.recentActivity.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        No recent activity
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
