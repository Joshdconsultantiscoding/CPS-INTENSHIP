import { Suspense } from "react";
import { getAuthUser } from "@/lib/auth";
import { getLessonWithProgress, getLessonNavigation, getCourseWithProgress } from "@/actions/lms-progress";
import { numberToWords, formatLessonTitle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    PlayCircle,
    FileText,
    ArrowLeft,
    Clock,
    BookOpen,
    Trophy,
    Lock
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LessonViewerClient } from "@/components/classroom/lesson-viewer-client";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface LessonPageProps {
    params: Promise<{ id: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
    const user = await getAuthUser();
    const { id: courseId, lessonId } = await params;

    // Fetch lesson with progress data
    const lesson = await getLessonWithProgress(lessonId);
    const navigation = await getLessonNavigation(courseId, lessonId);
    const course = await getCourseWithProgress(courseId);

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
            {/* Sidebar Navigation */}
            <aside className="hidden lg:flex w-80 border-r bg-card flex-col shrink-0">
                <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-sm truncate pr-4">{course.title}</h2>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                            <Link href={`/dashboard/classroom/courses/${courseId}`}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    {/* Course Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{course.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={course.progress_percentage || 0} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            {course.completed_lessons || 0} of {course.total_lessons || 0} lessons
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <Accordion
                        type="multiple"
                        defaultValue={[course.course_modules?.find((m: any) =>
                            m.course_lessons?.some((l: any) => l.id === lessonId)
                        )?.id].filter(Boolean)}
                        className="w-full"
                    >
                        {course.course_modules?.map((module: any, idx: number) => (
                            <AccordionItem key={module.id} value={module.id} className="border-b last:border-b-0">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors text-left">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
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
                                        <div className="text-left">
                                            <span className="font-semibold text-sm truncate block">
                                                {module.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {module.course_lessons?.filter((l: any) => l.completed).length || 0}/
                                                {module.course_lessons?.length || 0} complete
                                            </span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-2 pt-0">
                                    <div className="space-y-0.5">
                                        {module.course_lessons?.map((lessonItem: any, lIdx: number) => {
                                            const isActive = lessonItem.id === lessonId;
                                            const isCompleted = lessonItem.completed;
                                            const hasQuiz = !!lessonItem.quiz_id;

                                            return (
                                                <Link
                                                    key={lessonItem.id}
                                                    href={`/dashboard/classroom/courses/${courseId}/lessons/${lessonItem.id}`}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2",
                                                        isActive
                                                            ? "bg-primary/5 border-primary text-primary font-medium"
                                                            : isCompleted
                                                                ? "border-green-500 bg-green-50/50 text-muted-foreground hover:bg-green-50"
                                                                : "border-transparent hover:bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                    ) : (
                                                        <PlayCircle className={cn(
                                                            "h-4 w-4 shrink-0",
                                                            isActive ? "text-primary" : "text-muted-foreground"
                                                        )} />
                                                    )}
                                                    <span className="truncate flex-1">
                                                        {formatLessonTitle(lessonItem.title, lIdx)}
                                                    </span>
                                                    {hasQuiz && (
                                                        <Badge variant="outline" className="text-xs shrink-0">
                                                            Quiz
                                                        </Badge>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                {/* Certificate Badge */}
                {course.is_completed && course.certificate && (
                    <div className="p-4 border-t bg-gradient-to-r from-yellow-50 to-amber-50">
                        <Link
                            href="/dashboard/certificates"
                            className="flex items-center gap-3 text-amber-700 hover:text-amber-800"
                        >
                            <Trophy className="h-5 w-5" />
                            <div>
                                <p className="font-semibold text-sm">Course Completed!</p>
                                <p className="text-xs">View Certificate</p>
                            </div>
                        </Link>
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
                    {/* Mobile header */}
                    <div className="lg:hidden mb-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/classroom/courses/${courseId}`}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Course
                            </Link>
                        </Button>
                    </div>

                    {/* Lesson Viewer with LMS features */}
                    <Suspense fallback={<LessonSkeleton />}>
                        <LessonViewerClient
                            lesson={lesson}
                            courseId={courseId}
                            navigation={navigation}
                        />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}

function LessonSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
    );
}
