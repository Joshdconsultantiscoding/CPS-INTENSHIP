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
    Timer,
    AlertTriangle
} from "lucide-react";
import { useLessonTime } from "@/hooks/use-lesson-time";
import { completeLessonTracking } from "@/actions/time-tracking";
import { QuizEngine } from "./quiz-engine";
import type { LessonWithProgress, Quiz } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LessonViewerProps {
    lesson: LessonWithProgress;
    courseId: string;
    onComplete?: () => void;
    onNext?: () => void;
    isLast?: boolean;
}

export function LessonViewer({
    lesson,
    courseId,
    onComplete,
    onNext,
    isLast = false
}: LessonViewerProps) {
    const [showQuiz, setShowQuiz] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);

    // Time tracking hook
    const timeTracker = useLessonTime({
        lessonId: lesson.id,
        courseId,
        requiredTimeSeconds: lesson.required_time_seconds || 0,
        onTimeRequirementMet: () => {
            toast.success("Time requirement met! You can now complete this lesson.");
        }
    });

    // Handle lesson completion
    const handleComplete = async () => {
        setCompleting(true);

        const result = await completeLessonTracking(lesson.id);

        if (result.success) {
            toast.success("Lesson completed!");
            onComplete?.();
        } else {
            toast.error(result.error || "Failed to complete lesson");
        }

        setCompleting(false);
    };

    // Handle quiz completion
    const handleQuizComplete = (result: { passed: boolean; score: number }) => {
        setQuizCompleted(true);
        if (result.passed) {
            toast.success(`Quiz passed with ${result.score}%!`);
        } else {
            toast.error(`Quiz not passed. Score: ${result.score}%`);
        }
    };

    // Determine if lesson can be completed
    const canComplete =
        (timeTracker.requirementMet || lesson.allow_skip) &&
        (!lesson.quiz_id || quizCompleted || lesson.quiz_attempt?.passed);

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
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
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
                    </div>
                    <h1 className="text-2xl font-bold">{lesson.title}</h1>
                </div>

                {/* Time tracker */}
                <Card className="min-w-[200px]">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Timer className={cn(
                                "h-5 w-5",
                                timeTracker.isPaused ? "text-yellow-500" : "text-green-500"
                            )} />
                            <span className="font-mono text-lg">
                                {timeTracker.formattedTime}
                            </span>
                            {timeTracker.isPaused && (
                                <Badge variant="outline" className="text-yellow-600">
                                    Paused
                                </Badge>
                            )}
                        </div>

                        {lesson.required_time_seconds > 0 && (
                            <>
                                <Progress
                                    value={timeTracker.progress}
                                    className={cn(
                                        "h-2",
                                        timeTracker.requirementMet && "bg-green-100"
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
            {lesson.required_time_seconds > 0 && !timeTracker.requirementMet && !lesson.allow_skip && (
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                        You must spend at least {Math.ceil(lesson.required_time_seconds / 60)} minutes on this lesson before you can mark it as complete.
                    </AlertDescription>
                </Alert>
            )}

            {/* Video content */}
            {lesson.video_url && (
                <Card>
                    <CardContent className="p-0">
                        <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
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
                                        timeTracker.updateVideoProgress(Math.floor(video.currentTime));
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
                    <CardContent className="p-6 prose prose-sm max-w-none dark:prose-invert">
                        <div
                            dangerouslySetInnerHTML={{ __html: lesson.content }}
                            onScroll={(e) => {
                                const target = e.target as HTMLDivElement;
                                const percentage = Math.round(
                                    (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100
                                );
                                timeTracker.updateScrollProgress(percentage);
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            <Separator />

            {/* Quiz section */}
            {lesson.quiz_id && (
                <Card className={cn(
                    "border-2",
                    lesson.quiz_attempt?.passed ? "border-green-200 bg-green-50/50" :
                        quizCompleted ? "border-yellow-200 bg-yellow-50/50" :
                            "border-primary/20"
                )}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Lesson Quiz
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
                                "Complete the quiz to finish this lesson"
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => setShowQuiz(true)}
                            variant={lesson.quiz_attempt?.passed ? "outline" : "default"}
                        >
                            {lesson.quiz_attempt?.passed ? "Review Quiz" :
                                quizCompleted ? "Retry Quiz" : "Start Quiz"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                    {timeTracker.isPaused && timeTracker.pauseReason === "idle" && (
                        <span className="text-yellow-600">
                            Timer paused due to inactivity. Move your mouse to resume.
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {!canComplete ? (
                        <Button disabled variant="outline" className="gap-2">
                            <Lock className="h-4 w-4" />
                            {!timeTracker.requirementMet && !lesson.allow_skip
                                ? "Time requirement not met"
                                : "Complete quiz first"}
                        </Button>
                    ) : lesson.completed ? (
                        <Button onClick={onNext} className="gap-2">
                            {isLast ? "Finish Course" : "Next Lesson"}
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleComplete}
                            disabled={completing}
                            className="gap-2 bg-green-600 hover:bg-green-700"
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
