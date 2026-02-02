"use client";

import { useState, useTransition } from "react";
import {
    Plus,
    Trash2,
    Save,
    Loader2,
    HelpCircle,
    CheckCircle2,
    Circle,
    Settings2,
    PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    const lessonId = searchParams.get("lessonId");
    const [isPending, startTransition] = useTransition();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const lesson = course.course_modules
        ?.flatMap((m: any) => m.course_lessons || [])
        .find((l: any) => l.id === lessonId);

    const handleAddQuestion = async (type: string) => {
        if (!lessonId) return;
        setIsSubmitting(true);
        try {
            await createQuestion(lessonId, course.id, type);
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
            toast.success("Saved");
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

    if (!lessonId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl bg-muted/5 p-12 text-center text-muted-foreground">
                <HelpCircle className="h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-foreground">Assessment Engine</h3>
                <p className="max-w-xs mt-2">
                    Learning checks are tied to lessons. Select a lesson below to add questions.
                </p>
                <div className="mt-8 grid gap-4 w-full max-w-md">
                    {course.course_modules?.flatMap((m: any) => m.course_lessons || []).slice(0, 5).map((l: any) => (
                        <Button
                            key={l.id}
                            variant="outline"
                            className="justify-start h-12"
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                params.set("lessonId", l.id);
                                router.push(`?${params.toString()}`);
                            }}
                        >
                            <PlayCircle className="mr-2 h-4 w-4 opacity-50" />
                            <span className="truncate">{l.title}</span>
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    if (!lesson) return <div>Lesson not found.</div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Assessments: {lesson.title}</h2>
                    <p className="text-sm text-muted-foreground">Add questions to verify intern understanding.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAddQuestion('mcq')} disabled={isSubmitting}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add MCQ
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleAddQuestion('boolean')} disabled={isSubmitting}>
                        <Plus className="mr-2 h-4 w-4" />
                        True/False
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {lesson.course_questions?.length === 0 ? (
                    <div className="p-12 text-center border rounded-lg bg-card text-muted-foreground">
                        No questions added for this lesson yet.
                    </div>
                ) : (
                    lesson.course_questions.map((q: any, idx: number) => (
                        <Card key={q.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                        {idx + 1}
                                    </div>
                                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                        {q.type === 'mcq' ? 'Multiple Choice' : 'True / False'}
                                    </CardTitle>
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
                                <Textarea
                                    placeholder="Question Text"
                                    defaultValue={q.question_text}
                                    onBlur={(e) => handleUpdateQuestion(q.id, { question_text: e.target.value })}
                                />

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
                                </div>

                                <div className="pt-4 border-t">
                                    <Label className="text-xs font-semibold">Explanation (Optional)</Label>
                                    <Textarea
                                        placeholder="Explain the correct answer to the intern..."
                                        className="mt-1 h-20 text-xs"
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
