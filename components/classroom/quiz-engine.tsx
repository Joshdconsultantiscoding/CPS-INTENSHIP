"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    Flag,
    Maximize2,
    Timer
} from "lucide-react";
import { useQuizTimer } from "@/hooks/use-quiz-timer";
import { startQuizAttempt, saveQuizAnswer, submitQuizAttempt } from "@/actions/quiz";
import type { Quiz, QuizQuestion, QuizAttempt, QuizAnswer } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QuizEngineProps {
    quizId: string;
    onComplete?: (result: { passed: boolean; score: number }) => void;
    onExit?: () => void;
}

export function QuizEngine({ quizId, onComplete, onExit }: QuizEngineProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
    const [questions, setQuestions] = useState<Omit<QuizQuestion, "correct_answers">[]>([]);
    const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState<any>(null);

    // Timer hook
    const timer = useQuizTimer({
        attemptId: attempt?.id || "",
        timeLimitSeconds: quiz?.time_limit_seconds || 0,
        strictMode: quiz?.strict_mode || false,
        fullscreenRequired: quiz?.fullscreen_required || false,
        detectTabSwitch: quiz?.detect_tab_switch || false,
        onTimeout: handleTimeout,
        onViolation: handleViolation
    });

    // Load quiz
    useEffect(() => {
        const loadQuiz = async () => {
            setLoading(true);
            setError(null);

            const result = await startQuizAttempt(quizId);

            if (!result.success) {
                setError(result.error || "Failed to load quiz");
                setLoading(false);
                return;
            }

            setQuiz(result.quiz);
            setAttempt(result.attempt);
            setQuestions(result.questions || []);
            setLoading(false);

            // Request fullscreen if required
            if (result.quiz?.fullscreen_required) {
                timer.requestFullscreen();
            }
        };

        loadQuiz();
    }, [quizId]);

    // Handle timeout
    function handleTimeout() {
        handleSubmit(true);
    }

    // Handle anti-cheat violation
    function handleViolation(type: string, count: number) {
        if (count >= 3) {
            setError("Too many violations detected. Quiz may be flagged for review.");
        }
    }

    // Save answer
    const handleAnswer = useCallback(async (
        questionId: string,
        answer: { selected_options?: string[]; text_answer?: string }
    ) => {
        if (!attempt) return;

        // Optimistic update
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                question_id: questionId,
                selected_options: answer.selected_options || [],
                text_answer: answer.text_answer || null
            } as QuizAnswer
        }));

        // Save to server
        await saveQuizAnswer(attempt.id, questionId, answer);
    }, [attempt]);

    // Submit quiz
    const handleSubmit = async (isTimeout = false) => {
        if (!attempt) return;

        setSubmitting(true);
        timer.exitFullscreen();

        const result = await submitQuizAttempt(attempt.id);

        if (result.success) {
            setResults(result.result);
            setShowResults(true);
            onComplete?.({
                passed: result.result.passed,
                score: result.result.score_percentage
            });
        } else {
            setError(result.error || "Failed to submit quiz");
        }

        setSubmitting(false);
    };

    // Navigation
    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentIndex(index);
        }
    };

    const currentQuestion = questions[currentIndex];
    const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Error state
    if (error && !quiz) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    // Results view
    if (showResults && results) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <div className={cn(
                        "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4",
                        results.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                        {results.passed ? (
                            <CheckCircle2 className="h-8 w-8" />
                        ) : (
                            <XCircle className="h-8 w-8" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">
                        {results.passed ? "Congratulations! 🎉" : "Keep Learning!"}
                    </CardTitle>
                    <CardDescription>
                        {results.passed
                            ? "You passed the quiz successfully!"
                            : "Don't worry, you can try again!"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="text-3xl font-bold">{results.score_percentage}%</div>
                            <div className="text-sm text-muted-foreground">Score</div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="text-3xl font-bold">{results.earned_points}/{results.total_points}</div>
                            <div className="text-sm text-muted-foreground">Points</div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={onExit}>
                            Back to Lesson
                        </Button>
                        <Button onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with timer */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg sticky top-0 z-10 backdrop-blur-sm">
                <div>
                    <h2 className="font-semibold">{quiz?.title}</h2>
                    <p className="text-sm text-muted-foreground">
                        Question {currentIndex + 1} of {questions.length}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Violations warning */}
                    {timer.violations.tabSwitches > 0 && (
                        <Badge variant="destructive" className="gap-1">
                            <Flag className="h-3 w-3" />
                            {timer.violations.tabSwitches} warning(s)
                        </Badge>
                    )}

                    {/* Timer */}
                    {timer.isTimeLimited && (
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg",
                            timer.isCriticalTime ? "bg-red-100 text-red-600 animate-pulse" :
                                timer.isLowTime ? "bg-yellow-100 text-yellow-600" :
                                    "bg-muted"
                        )}>
                            <Timer className="h-5 w-5" />
                            {timer.formattedTime}
                        </div>
                    )}

                    {/* Fullscreen button */}
                    {quiz?.fullscreen_required && (
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={timer.requestFullscreen}
                        >
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <Progress
                value={(Object.keys(answers).length / questions.length) * 100}
                className="h-2"
            />

            {/* Question navigation pills */}
            <div className="flex flex-wrap gap-2">
                {questions.map((q, i) => (
                    <Button
                        key={q.id || `nav-${i}`}
                        size="sm"
                        variant={i === currentIndex ? "default" : answers[q.id] ? "secondary" : "outline"}
                        className={cn(
                            "w-10 h-10 p-0",
                            answers[q.id] && i !== currentIndex && "bg-green-100 hover:bg-green-200 text-green-700"
                        )}
                        onClick={() => goToQuestion(i)}
                    >
                        {i + 1}
                    </Button>
                ))}
            </div>

            {/* Question card */}
            {currentQuestion && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{currentQuestion.type.replace("_", " ")}</Badge>
                            <Badge variant="secondary">{currentQuestion.points} pts</Badge>
                        </div>
                        <CardTitle className="text-xl">
                            {currentQuestion.question_text}
                        </CardTitle>
                        {currentQuestion.question_image_url && (
                            <img
                                src={currentQuestion.question_image_url}
                                alt="Question"
                                className="max-h-64 rounded-lg mt-4"
                            />
                        )}
                    </CardHeader>
                    <CardContent>
                        <QuestionInput
                            question={currentQuestion}
                            answer={currentAnswer}
                            onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
                <Button
                    variant="outline"
                    disabled={currentIndex === 0}
                    onClick={() => goToQuestion(currentIndex - 1)}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>

                {currentIndex === questions.length - 1 ? (
                    <Button
                        onClick={() => handleSubmit(false)}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Submit Quiz
                    </Button>
                ) : (
                    <Button onClick={() => goToQuestion(currentIndex + 1)}>
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}

// Question input component
function QuestionInput({
    question,
    answer,
    onAnswer
}: {
    question: Omit<QuizQuestion, "correct_answers">;
    answer: QuizAnswer | null;
    onAnswer: (answer: { selected_options?: string[]; text_answer?: string }) => void;
}) {
    const { type, options } = question;
    const selectedOptions = answer?.selected_options || [];
    const textAnswer = answer?.text_answer || "";

    if (type === "mcq" || type === "boolean") {
        return (
            <RadioGroup
                value={selectedOptions[0] || ""}
                onValueChange={(value) => onAnswer({ selected_options: [value] })}
                className="space-y-3"
            >
                {options.map((option, idx) => (
                    <div
                        key={option.id || `mcq-${idx}`}
                        className={cn(
                            "flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer",
                            selectedOptions.includes(option.id)
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-muted-foreground/50"
                        )}
                    >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            {option.text}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        );
    }

    if (type === "multi_select") {
        return (
            <div className="space-y-3">
                {options.map((option, idx) => (
                    <div
                        key={option.id || `multi-${idx}`}
                        className={cn(
                            "flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer",
                            selectedOptions.includes(option.id)
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-muted-foreground/50"
                        )}
                        onClick={() => {
                            const newSelected = selectedOptions.includes(option.id)
                                ? selectedOptions.filter(id => id !== option.id)
                                : [...selectedOptions, option.id];
                            onAnswer({ selected_options: newSelected });
                        }}
                    >
                        <Checkbox
                            checked={selectedOptions.includes(option.id)}
                            id={option.id}
                        />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            {option.text}
                        </Label>
                    </div>
                ))}
            </div>
        );
    }

    if (type === "short_answer") {
        return (
            <Textarea
                value={textAnswer}
                onChange={(e) => onAnswer({ text_answer: e.target.value })}
                placeholder="Type your answer here..."
                className="min-h-[120px]"
            />
        );
    }

    return null;
}
