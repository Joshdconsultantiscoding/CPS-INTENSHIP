import { Suspense } from "react";
import { getAuthUser } from "@/lib/auth";
import { getCourseWithProgress, getResumePoint } from "@/actions/lms-progress";
import { numberToWords, formatLessonTitle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BookOpen,
    Clock,
    BarChart,
    ChevronRight,
    PlayCircle,
    CheckCircle2,
    Lock,
    Trophy,
    Timer,
    Zap,
    RotateCcw
} from "lucide-react";
import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface CoursePageProps {
    params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
    const user = await getAuthUser();
    const { id } = await params;
    const course = await getCourseWithProgress(id);
    const resumePoint = await getResumePoint(id, course);

    const totalTimeMinutes = Math.round((course.total_time_spent_seconds || 0) / 60);

    return (
        <div className="container py-8 max-w-5xl mx-auto space-y-8">
            {/* Breadcrumbs */}
            <nav className="flex text-sm text-muted-foreground mb-4">
                <Link href="/dashboard/classroom" className="hover:text-primary transition-colors">Classroom</Link>
                <ChevronRight className="h-4 w-4 mx-2" />
                <Link href="/dashboard/classroom/courses" className="hover:text-primary transition-colors">Courses</Link>
                <ChevronRight className="h-4 w-4 mx-2" />
                <span className="text-foreground font-medium truncate">{course.title}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">{course.level || "beginner"}</Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {course.duration_minutes}m
                            </Badge>
                            {course.course_settings?.enable_time_tracking && (
                                <Badge variant="outline" className="flex items-center gap-1 text-blue-600">
                                    <Timer className="h-3 w-3" />
                                    Time Tracked
                                </Badge>
                            )}
                            {course.course_settings?.strict_mode_for_lessons && (
                                <Badge variant="destructive">Strict Mode</Badge>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {course.description}
                        </p>
                    </div>

                    {/* Progress Summary */}
                    {course.progress_percentage > 0 && (
                        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">Your Progress</h3>
                                    <span className="text-2xl font-bold text-primary">{course.progress_percentage}%</span>
                                </div>
                                <Progress value={course.progress_percentage} className="h-3 mb-3" />
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        {course.completed_lessons}/{course.total_lessons} Lessons
                                    </span>
                                    {totalTimeMinutes > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Timer className="h-4 w-4" />
                                            {totalTimeMinutes} min spent
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold">Course Curriculum</h2>

                        <Accordion type="single" collapsible className="w-full border rounded-lg overflow-hidden bg-card">
                            {course.course_modules?.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No modules have been added to this course yet.
                                </div>
                            ) : (
                                course.course_modules.map((module: any, idx: number) => (
                                    <AccordionItem key={module.id} value={module.id} className={idx === course.course_modules.length - 1 ? "border-b-0" : ""}>
                                        <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/50 transition-colors py-4">
                                            <div className="flex items-center gap-3 text-left w-full">
                                                <div className={cn(
                                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                                    module.completed
                                                        ? "bg-green-100 text-green-600"
                                                        : "bg-primary/10 text-primary"
                                                )}>
                                                    {module.completed ? (
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-semibold">{module.title}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-xs text-muted-foreground font-normal">
                                                            {module.course_lessons?.length || 0} Lessons
                                                        </p>
                                                        {module.progress_percentage > 0 && !module.completed && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {module.progress_percentage}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pb-4 pt-0">
                                            <div className="space-y-1 pt-2">
                                                {module.course_lessons?.map((lesson: any, lIdx: number) => (
                                                    <Link
                                                        key={lesson.id}
                                                        href={`/dashboard/classroom/courses/${course.id}/lessons/${lesson.id}`}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-md transition-colors group",
                                                            lesson.completed
                                                                ? "bg-green-50 hover:bg-green-100 dark:bg-green-950/30"
                                                                : "hover:bg-muted"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {lesson.completed ? (
                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <PlayCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                            )}
                                                            <span className="text-sm font-medium">{formatLessonTitle(lesson.title, lIdx)}</span>
                                                            {lesson.quiz_id && (
                                                                <Badge variant="outline" className="text-xs">Quiz</Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xs text-muted-foreground">
                                                                {lesson.duration_minutes ? `${lesson.duration_minutes}m` : ""}
                                                            </span>
                                                            {lesson.completed ? (
                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                                                            )}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))
                            )}
                        </Accordion>
                    </div>
                </div>

                {/* Sidebar Card */}
                <div className="space-y-6">
                    <div className="rounded-xl border bg-card p-6 shadow-sm sticky top-24">
                        <div className="aspect-video w-full rounded-lg bg-muted mb-6 flex items-center justify-center overflow-hidden">
                            {course.thumbnail_url ? (
                                <img src={course.thumbnail_url} alt={course.title} className="object-cover w-full h-full" />
                            ) : (
                                <BookOpen className="h-12 w-12 text-muted-foreground" />
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Smart Resume/Start Button */}
                            {resumePoint.lessonId && (
                                <Button className="w-full text-lg h-12 gap-2" size="lg" asChild>
                                    <Link href={`/dashboard/classroom/courses/${course.id}/lessons/${resumePoint.lessonId}`}>
                                        {resumePoint.type === "continue" ? (
                                            <>
                                                <RotateCcw className="h-5 w-5" />
                                                Continue Learning
                                            </>
                                        ) : resumePoint.type === "next" ? (
                                            <>
                                                <Zap className="h-5 w-5" />
                                                Continue Course
                                            </>
                                        ) : (
                                            <>
                                                <PlayCircle className="h-5 w-5" />
                                                Start Over
                                            </>
                                        )}
                                    </Link>
                                </Button>
                            )}

                            {/* Certificate */}
                            {course.is_completed && course.certificate && (
                                <Button variant="outline" className="w-full gap-2" asChild>
                                    <Link href="/dashboard/certificates">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        View Certificate
                                    </Link>
                                </Button>
                            )}

                            <p className="text-center text-xs text-muted-foreground">
                                Full lifetime access • Sync across devices
                            </p>

                            <div className="space-y-3 pt-4 border-t">
                                <h4 className="text-sm font-semibold">This course includes:</h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <PlayCircle className="h-4 w-4" />
                                        {course.total_lessons || 0} Video Lessons
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <BarChart className="h-4 w-4" />
                                        {(course.level || "beginner").charAt(0).toUpperCase() + (course.level || "beginner").slice(1)} Level
                                    </li>
                                    {course.course_settings?.enable_time_tracking && (
                                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Timer className="h-4 w-4" />
                                            Progress Tracking
                                        </li>
                                    )}
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Certificate of Completion
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
