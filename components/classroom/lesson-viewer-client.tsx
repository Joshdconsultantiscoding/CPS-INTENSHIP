"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Clock,
    Play,
    Pause,
    CheckCircle2,
    Lock,
    BookOpen,
    Video,
    FileText,
    ChevronRight,
    ChevronLeft,
    Timer,
    AlertTriangle
} from "lucide-react";
import { useLessonTime } from "@/hooks/use-lesson-time";
import { completeLessonTracking } from "@/actions/time-tracking";
import { QuizEngine } from "./quiz-engine";
import type { LessonWithProgress, Quiz } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LessonViewerClientProps {
    lesson: LessonWithProgress & { course?: any; module?: any };
    courseId: string;
    navigation: {
        prev: any | null;
        next: any | null;
        isLast: boolean;
        isFirst: boolean;
        currentIndex: number;
        totalLessons: number;
    };
}

export function LessonViewerClient({
    lesson,
    courseId,
    navigation
}: LessonViewerClientProps) {
    const router = useRouter();
    const [showQuiz, setShowQuiz] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [lessonCompleted, setLessonCompleted] = useState(lesson.completed);

    // Initial validation
    if (!lesson.id || !courseId) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Invalid lesson configuration. Missing ID for {!lesson.id ? "lesson" : "course"}.
                </AlertDescription>
            </Alert>
        );
    }

    // Time tracking hook
    const onTimeRequirementMet = useCallback(() => {
        toast.success("Time requirement met! You can now complete this lesson.");
    }, []);

    const timeTracker = useLessonTime({
        lessonId: lesson.id,
        courseId,
        requiredTimeSeconds: lesson.effective_required_time ?? lesson.required_time_seconds ?? 0,
        onTimeRequirementMet
    });

    // Handle lesson completion
    const handleComplete = async () => {
        setCompleting(true);

        const result = await completeLessonTracking(lesson.id);

        if (result.success) {
            setLessonCompleted(true);
            toast.success("Lesson completed!");

            // Auto-navigate to next lesson after a short delay
            if (navigation.next) {
                setTimeout(() => {
                    router.push(`/dashboard/classroom/courses/${courseId}/lessons/${navigation.next.id}`);
                }, 1000);
            }
        } else {
            toast.error(result.error || "Failed to complete lesson");
        }

        setCompleting(false);
    };

    // Handle quiz completion
    const handleQuizComplete = (result: { passed: boolean; score: number }) => {
        setQuizCompleted(true);
        setShowQuiz(false);
        if (result.passed) {
            toast.success(`Quiz passed with ${result.score}%!`);
        } else {
            toast.error(`Quiz not passed. Score: ${result.score}%`);
        }
    };

    // Determine if lesson can be completed
    const requiredTime = lesson.effective_required_time ?? lesson.required_time_seconds ?? 0;
    const canComplete =
        (timeTracker.requirementMet || lesson.allow_skip || requiredTime === 0) &&
        (!lesson.quiz_id || quizCompleted || lesson.quiz_attempt?.passed);

    // Locked State
    if (lesson.is_locked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Lesson Locked</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        This lesson is currently locked. To access this content, you must complete the previous lessons in sequential order.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href={`/dashboard/classroom/courses/${courseId}`}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Return to Course
                    </Link>
                </Button>
            </div>
        );
    }

    // If showing quiz
    if (showQuiz && lesson.quiz_id) {
        return (
            <QuizEngine
                quizId={lesson.quiz_id}
                onComplete={handleQuizComplete}
                onExit={() => setShowQuiz(false)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Lesson Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {lesson.video_url ? (
                            <Badge variant="outline" className="gap-1">
                                <Video className="h-3 w-3" />
                                Video Lesson
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="gap-1">
                                <FileText className="h-3 w-3" />
                                Reading
                            </Badge>
                        )}
                        {lesson.duration_minutes > 0 && (
                            <Badge variant="secondary">
                                ~{lesson.duration_minutes} min
                            </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                            Lesson {navigation.currentIndex + 1} of {navigation.totalLessons}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold">{lesson.title}</h1>
                    {lesson.module && (
                        <p className="text-muted-foreground">
                            Module: {lesson.module.title}
                        </p>
                    )}
                </div>

                {/* Time tracker card */}
                <Card className="md:min-w-[220px] shrink-0">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Timer className={cn(
                                "h-5 w-5",
                                timeTracker.isPaused ? "text-yellow-500" : "text-green-500"
                            )} />
                            <span className="font-mono text-xl">
                                {timeTracker.formattedTime}
                            </span>
                            {timeTracker.isPaused && (
                                <Badge variant="outline" className="text-yellow-600 text-xs">
                                    Paused
                                </Badge>
                            )}
                        </div>

                        {requiredTime > 0 && (
                            <>
                                <Progress
                                    value={timeTracker.progress}
                                    className={cn(
                                        "h-2",
                                        timeTracker.requirementMet && "[&>div]:bg-green-500"
                                    )}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {timeTracker.requirementMet ? (
                                        <span className="text-green-600 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Time requirement met
                                        </span>
                                    ) : (
                                        `${timeTracker.formattedRemaining} remaining`
                                    )}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Time requirement warning */}
            {requiredTime > 0 && !timeTracker.requirementMet && !lesson.allow_skip && (
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                        You must spend at least {Math.ceil(requiredTime / 60)} minutes on this lesson before you can mark it as complete.
                    </AlertDescription>
                </Alert>
            )}

            {/* Video content */}
            {lesson.video_url && (
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <div className="aspect-video bg-black">
                            {lesson.video_url.includes("youtube") || lesson.video_url.includes("youtu.be") ? (
                                <iframe
                                    src={getYouTubeEmbedUrl(lesson.video_url)}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : lesson.video_url.includes("vimeo") ? (
                                <iframe
                                    src={getVimeoEmbedUrl(lesson.video_url)}
                                    className="w-full h-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    src={lesson.video_url}
                                    controls
                                    className="w-full h-full"
                                    onTimeUpdate={(e) => {
                                        const video = e.target as HTMLVideoElement;
                                        timeTracker.updateVideoProgress?.(Math.floor(video.currentTime));
                                    }}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Text content */}
            {lesson.content && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            Lesson Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                        <div
                            dangerouslySetInnerHTML={{ __html: lesson.content }}
                            className="whitespace-pre-wrap leading-relaxed text-muted-foreground"
                        />
                    </CardContent>
                </Card>
            )}

            {/* Quiz section */}
            {lesson.quiz_id && (
                <>
                    <Separator />
                    <Card className={cn(
                        "border-2",
                        lesson.quiz_attempt?.passed ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" :
                            quizCompleted ? "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20" :
                                "border-primary/20"
                    )}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Lesson Quiz
                                {lesson.quiz?.strict_mode && (
                                    <Badge variant="destructive" className="ml-2">Strict Mode</Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {lesson.quiz_attempt?.passed ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Quiz passed with {lesson.quiz_attempt.score_percentage}%
                                    </span>
                                ) : quizCompleted ? (
                                    <span className="text-yellow-600">
                                        Quiz attempted but not passed. Try again!
                                    </span>
                                ) : (
                                    <>
                                        Complete the quiz to finish this lesson
                                        {lesson.quiz && lesson.quiz.time_limit_seconds > 0 && (
                                            <span className="ml-2 text-muted-foreground">
                                                • {Math.floor(lesson.quiz.time_limit_seconds / 60)} min limit
                                            </span>
                                        )}
                                    </>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => setShowQuiz(true)}
                                variant={lesson.quiz_attempt?.passed ? "outline" : "default"}
                                size="lg"
                            >
                                {lesson.quiz_attempt?.passed ? "Review Quiz" :
                                    quizCompleted ? "Retry Quiz" : "Start Quiz"}
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}

            <Separator />

            {/* Navigation and Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                {/* Prev button */}
                <div className="w-full sm:w-auto">
                    {navigation.prev ? (
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href={`/dashboard/classroom/courses/${courseId}/lessons/${navigation.prev.id}`}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Link>
                        </Button>
                    ) : (
                        <div />
                    )}
                </div>

                {/* Paused indicator */}
                {timeTracker.isPaused && timeTracker.pauseReason === "idle" && (
                    <p className="text-sm text-yellow-600 text-center">
                        Timer paused due to inactivity
                    </p>
                )}

                {/* Complete / Next */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {!canComplete ? (
                        <Button disabled variant="outline" className="gap-2 w-full sm:w-auto">
                            <Lock className="h-4 w-4" />
                            {!timeTracker.requirementMet && !lesson.allow_skip && requiredTime > 0
                                ? "Time requirement not met"
                                : "Complete quiz first"}
                        </Button>
                    ) : lessonCompleted ? (
                        navigation.next ? (
                            <Button asChild className="gap-2 w-full sm:w-auto">
                                <Link href={`/dashboard/classroom/courses/${courseId}/lessons/${navigation.next.id}`}>
                                    Next Lesson
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                                <Link href={`/dashboard/classroom/courses/${courseId}`}>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Finish Course
                                </Link>
                            </Button>
                        )
                    ) : (
                        <Button
                            onClick={handleComplete}
                            disabled={completing}
                            className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        >
                            {completing ? (
                                <>
                                    <Clock className="h-4 w-4 animate-spin" />
                                    Completing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Mark Complete
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper functions
function getYouTubeEmbedUrl(url: string): string {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function getVimeoEmbedUrl(url: string): string {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
}
