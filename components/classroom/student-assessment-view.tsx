"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    Loader2,
    HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getQuestionsForStudent, submitAssessment } from "@/actions/classroom-student";

interface StudentAssessmentViewProps {
    courseId: string;
    contextId: string;
    contextType: 'lesson' | 'module' | 'course';
    nextUrl: string;
}

export function StudentAssessmentView({ courseId, contextId, contextType, nextUrl }: StudentAssessmentViewProps) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPassed, setIsPassed] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        async function load() {
            try {
                const data = await getQuestionsForStudent(contextId, contextType);
                setQuestions(data);
            } catch (err) {
                toast.error("Failed to load questions");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [contextId, contextType]);

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        // Check if all required questions are answered
        const unanswered = questions.filter(q => q.is_required && !answers[q.id]);
        if (unanswered.length > 0) {
            toast.error("Please answer all required questions");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await submitAssessment({
                courseId,
                contextId,
                contextType,
                answers
            });

            setResults(res);
            if (res.passed) {
                setIsPassed(true);
                toast.success("Assessment completed!");
            } else {
                toast.error("You did not pass. Please review and try again.");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to submit assessment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Preparing your assessment...</p>
            </div>
        );
    }

    if (results && !results.passed) {
        return (
            <Card className="max-w-2xl mx-auto border-2 border-destructive/20 bg-destructive/5">
                <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
                    <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                        <XCircle className="h-12 w-12" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-destructive">Not Quite There</h2>
                        <p className="text-muted-foreground mt-2">
                            You scored {results.score}%. A minimum of 70% is required to pass this {contextType}.
                        </p>
                    </div>

                    <div className="bg-background rounded-lg border p-4 px-8 flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-destructive">{results.score}%</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Your Score</p>
                        </div>
                        <div className="h-8 border-r" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-muted-foreground">70%</p>
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Passing</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" size="lg" onClick={() => router.back()}>
                            Back to Content
                        </Button>
                        <Button size="lg" className="px-8 font-semibold" onClick={() => {
                            setResults(null);
                            setIsPassed(false);
                            setAnswers({});
                        }}>
                            Try Again
                            <Loader2 className={`ml-2 h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Review the questions marked in red below to understand what went wrong.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (isPassed) {
        return (
            <Card className="max-w-2xl mx-auto border-2 border-green-500/20 bg-green-500/5">
                <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
                    <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Well Done!</h2>
                        <p className="text-muted-foreground mt-2">
                            You have successfully completed the {contextType} assessment.
                        </p>
                    </div>

                    {results && (
                        <div className="bg-background rounded-lg border p-4 px-8 flex items-center gap-8">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{results.score}%</p>
                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Your Score</p>
                            </div>
                            <div className="h-8 border-r" />
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">PASS</p>
                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Status</p>
                            </div>
                        </div>
                    )}

                    <Button size="lg" className="px-8 font-semibold" asChild>
                        <Link href={nextUrl}>
                            Continue Course
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight capitalize">{contextType} Knowledge Check</h1>
                <p className="text-muted-foreground">Test your understanding before moving forward.</p>
            </div>

            <div className="space-y-6">
                {questions.map((q, idx) => (
                    <Card key={q.id} className={results && results.wrongQuestions?.includes(q.id) ? "border-destructive bg-destructive/5" : ""}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-primary uppercase tracking-widest">Question {idx + 1}</span>
                                {q.is_required && <span className="text-[10px] text-destructive font-bold uppercase">Required</span>}
                            </div>
                            <CardTitle className="text-lg font-medium leading-relaxed">
                                {q.question_text}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(q.type === 'mcq' || q.type === 'boolean') ? (
                                <RadioGroup
                                    onValueChange={(val) => handleAnswerChange(q.id, val)}
                                    value={answers[q.id]}
                                    className="space-y-3"
                                >
                                    {q.options.map((opt: string) => (
                                        <div key={opt} className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                                            <RadioGroupItem value={opt} id={`q-${q.id}-${opt}`} />
                                            <Label
                                                htmlFor={`q-${q.id}-${opt}`}
                                                className="flex-1 cursor-pointer font-normal text-sm leading-none"
                                            >
                                                {opt}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <Textarea
                                    placeholder="Type your answer here..."
                                    className="min-h-[120px]"
                                    onBlur={(e) => handleAnswerChange(q.id, e.target.value)}
                                />
                            )}

                            {results && results.wrongQuestions?.includes(q.id) && q.explanation && (
                                <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                                    <div>
                                        <p className="font-semibold text-destructive">Incorrect. Here's why:</p>
                                        <p className="text-muted-foreground mt-1">{q.explanation}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex items-center justify-between pt-8 border-t">
                <p className="text-sm text-muted-foreground italic">
                    <HelpCircle className="inline h-4 w-4 mr-1 opacity-50" />
                    {questions.length} total questions
                </p>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Answers
                    </Button>
                </div>
            </div>
        </div>
    );
}
