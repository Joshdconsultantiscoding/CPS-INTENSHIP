"use client";

import { useState, useTransition } from "react";
import {
    Plus,
    Trash2,
    HelpCircle,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    createQuestion,
    updateQuestion,
    deleteQuestion
} from "@/actions/classroom-advanced";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";

interface AssessmentTabProps {
    course: any;
}

export function AssessmentTab({ course }: AssessmentTabProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [_, startTransition] = useTransition();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Context Selection State
    // Default to the lesson in URL if present, otherwise the Course itself
    const initialLessonId = searchParams.get("lessonId");

    const getInitialContext = () => {
        if (initialLessonId) {
            return { type: 'lesson' as const, id: initialLessonId };
        }
        return { type: 'course' as const, id: course.id };
    };

    const [context, setContext] = useState<{ type: 'course' | 'module' | 'lesson', id: string }>(getInitialContext());

    // Flatten structure for the dropdown
    const structureOptions = [
        { label: `Course: ${course.title}`, value: `course:${course.id}`, type: 'course', id: course.id },
        ...(course.course_modules?.flatMap((m: any) => [
            { label: `Module: ${m.title}`, value: `module:${m.id}`, type: 'module', id: m.id },
            ...(m.course_lessons?.map((l: any) => ({
                label: `  • Lesson: ${l.title}`,
                value: `lesson:${l.id}`,
                type: 'lesson',
                id: l.id
            })) || [])
        ]) || [])
    ];

    const currentQuestions = (() => {
        if (context.type === 'course') return (course as any).course_questions || [];
        if (context.type === 'module') return course.course_modules?.find((m: any) => m.id === context.id)?.course_questions || [];
        if (context.type === 'lesson') {
            const lesson = course.course_modules?.flatMap((m: any) => m.course_lessons || []).find((l: any) => l.id === context.id);
            return lesson?.course_questions || [];
        }
        return [];
    })();

    const handleAddQuestion = async (type: string) => {
        setIsSubmitting(true);
        try {
            await createQuestion(context.id, course.id, type, context.type);
            toast.success("Question added!");
            startTransition(() => {
                router.refresh();
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateQuestion = async (questionId: string, data: any) => {
        try {
            await updateQuestion(questionId, course.id, data);
            setLastSaved(new Date());
            startTransition(() => {
                router.refresh();
            });
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm("Delete this question?")) return;
        try {
            await deleteQuestion(questionId, course.id);
            toast.success("Deleted");
            startTransition(() => {
                router.refresh();
            });
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-6 border-b pb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Assessments Manager</h2>
                    <p className="text-sm text-muted-foreground">Configure quizzes and knowledge checks at any level of the course.</p>
                </div>

                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div className="grid gap-1.5 flex-1 max-w-xl">
                        <Label>Assessment Context</Label>
                        <Select
                            value={`${context.type}:${context.id}`}
                            onValueChange={(val) => {
                                const [type, id] = val.split(':');
                                setContext({ type: type as any, id });
                            }}
                        >
                            <SelectTrigger className="w-full bg-background">
                                <SelectValue placeholder="Select where to add questions..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[400px]">
                                {structureOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className={opt.type === 'lesson' ? 'pl-6 text-muted-foreground' : 'font-semibold'}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 border-l pl-4 flex flex-col justify-center">
                        <span className="text-xs font-medium uppercase text-muted-foreground mb-2">Available Actions</span>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleAddQuestion('mcq')} disabled={isSubmitting}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> MCQ
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleAddQuestion('boolean')} disabled={isSubmitting}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> True/False
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleAddQuestion('short')} disabled={isSubmitting}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> Short Answer
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleAddQuestion('long')} disabled={isSubmitting}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> Long Answer
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {currentQuestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed rounded-xl bg-muted/5 p-12 text-center text-muted-foreground">
                        <HelpCircle className="h-10 w-10 mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold text-foreground">No Questions Found</h3>
                        <p className="max-w-xs mt-2 text-sm">
                            There are no questions assigned to this {context.type}. Select a different context or add a question above.
                        </p>
                    </div>
                ) : (
                    currentQuestions.map((q: any, idx: number) => (
                        <Card key={q.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                        {idx + 1}
                                    </div>
                                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                        {q.type === 'mcq' && 'Multiple Choice'}
                                        {q.type === 'boolean' && 'True / False'}
                                        {q.type === 'short' && 'Short Answer'}
                                        {q.type === 'long' && 'Long Answer'}
                                    </CardTitle>
                                    {lastSaved && (
                                        <span className="text-[10px] text-green-600 animate-pulse ml-2 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Saved
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center space-x-2 mr-4">
                                        <Switch
                                            id={`required-${q.id}`}
                                            checked={q.is_required}
                                            onCheckedChange={(checked) => handleUpdateQuestion(q.id, { is_required: checked })}
                                        />
                                        <Label htmlFor={`required-${q.id}`} className="text-xs">Required</Label>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteQuestion(q.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold">Question Text</Label>
                                    <Textarea
                                        placeholder="Enter the question here..."
                                        defaultValue={q.question_text}
                                        className="font-medium"
                                        onBlur={(e) => handleUpdateQuestion(q.id, { question_text: e.target.value })}
                                    />
                                </div>

                                {(q.type === 'mcq' || q.type === 'boolean') && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Options & Correct Answer</Label>
                                        {q.options?.map((opt: string, optIdx: number) => (
                                            <div key={optIdx} className="flex items-center gap-3">
                                                <div
                                                    className={`h-4 w-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${q.correct_answers?.includes(opt) ? "bg-primary border-primary" : "hover:border-primary"}`}
                                                    onClick={() => {
                                                        const newCorrect = q.correct_answers?.includes(opt)
                                                            ? q.correct_answers.filter((a: string) => a !== opt)
                                                            : [opt];
                                                        handleUpdateQuestion(q.id, { correct_answers: newCorrect });
                                                    }}
                                                >
                                                    {q.correct_answers?.includes(opt) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                </div>
                                                <Input
                                                    defaultValue={opt}
                                                    className="flex-1 h-8"
                                                    onBlur={(e) => {
                                                        const newOpts = [...q.options];
                                                        newOpts[optIdx] = e.target.value;
                                                        handleUpdateQuestion(q.id, { options: newOpts });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                        {q.type === 'boolean' ? null : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-muted-foreground"
                                                onClick={() => {
                                                    const newOpts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
                                                    handleUpdateQuestion(q.id, { options: newOpts });
                                                }}
                                            >
                                                <Plus className="mr-1 h-3 w-3" /> Add Option
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {(q.type === 'short' || q.type === 'long') && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-muted/20 rounded-lg text-sm text-muted-foreground italic border border-dashed">
                                            Students will see a text input field for this question.
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-semibold text-primary">Ideal / Reference Answer</Label>
                                                <span className="text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">Admin Only</span>
                                            </div>
                                            <Textarea
                                                placeholder="Enter the correct answer here. The system will match the student's input against this..."
                                                defaultValue={q.reference_answer}
                                                className="border-primary/20 focus-visible:ring-primary/30"
                                                onBlur={(e) => handleUpdateQuestion(q.id, { reference_answer: e.target.value })}
                                            />
                                            <p className="text-[10px] text-muted-foreground">
                                                For short answers, the system performs a strict match. For long answers, it checks for keyword coverage.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <Label className="text-xs font-semibold">Explanation (Optional)</Label>
                                    <Textarea
                                        placeholder="Explain the correct answer to the intern..."
                                        className="mt-1 h-20 text-xs text-muted-foreground"
                                        defaultValue={q.explanation}
                                        onBlur={(e) => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
