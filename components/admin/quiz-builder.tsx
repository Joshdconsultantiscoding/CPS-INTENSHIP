"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Plus,
    Trash2,
    GripVertical,
    CheckCircle2,
    XCircle,
    Settings,
    Eye,
    Save,
    Loader2,
    ShieldAlert,
    Clock,
    Hash,
    Type,
    List
} from "lucide-react";
import {
    createQuiz,
    updateQuiz,
    deleteQuiz,
    addQuizQuestion,
    updateQuizQuestion,
    deleteQuizQuestion,
    toggleQuizPublished,
    getQuizWithQuestions
} from "@/actions/quiz-admin";
import type { Quiz, QuizQuestion, QuizQuestionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuizBuilderProps {
    quizId?: string;
    courseId: string;
    lessonId?: string;
    moduleId?: string;
    onSave?: (quiz: Quiz) => void;
    onClose?: () => void;
}

export function QuizBuilder({
    quizId,
    courseId,
    lessonId,
    moduleId,
    onSave,
    onClose
}: QuizBuilderProps) {
    const [loading, setLoading] = useState(!!quizId);
    const [saving, setSaving] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [activeTab, setActiveTab] = useState("settings");

    // Quiz form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [timeLimit, setTimeLimit] = useState(0);
    const [passingScore, setPassingScore] = useState(70);
    const [attemptsAllowed, setAttemptsAllowed] = useState(3);
    const [randomizeQuestions, setRandomizeQuestions] = useState(false);
    const [randomizeOptions, setRandomizeOptions] = useState(false);
    const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
    const [showExplanations, setShowExplanations] = useState(true);
    const [strictMode, setStrictMode] = useState(false);
    const [fullscreenRequired, setFullscreenRequired] = useState(false);
    const [detectTabSwitch, setDetectTabSwitch] = useState(true);
    const [autoSubmitOnCheat, setAutoSubmitOnCheat] = useState(false);

    // Load existing quiz
    useEffect(() => {
        if (quizId) {
            loadQuiz();
        }
    }, [quizId]);

    const loadQuiz = async () => {
        if (!quizId) return;
        setLoading(true);
        const result = await getQuizWithQuestions(quizId);
        if (result.success && result.quiz) {
            const q = result.quiz as Quiz;
            setQuiz(q);
            setQuestions(q.questions || []);
            setTitle(q.title);
            setDescription(q.description || "");
            setTimeLimit(q.time_limit_seconds || 0);
            setPassingScore(q.passing_score);
            setAttemptsAllowed(q.attempts_allowed);
            setRandomizeQuestions(q.randomize_questions);
            setRandomizeOptions(q.randomize_options);
            setShowCorrectAnswers(q.show_correct_answers);
            setShowExplanations(q.show_explanations);
            setStrictMode(q.strict_mode);
            setFullscreenRequired(q.fullscreen_required);
            setDetectTabSwitch(q.detect_tab_switch);
            setAutoSubmitOnCheat(q.auto_submit_on_cheat);
        }
        setLoading(false);
    };

    // Save quiz settings
    const handleSaveSettings = async () => {
        setSaving(true);

        const data = {
            title,
            description,
            time_limit_seconds: timeLimit,
            passing_score: passingScore,
            attempts_allowed: attemptsAllowed,
            randomize_questions: randomizeQuestions,
            randomize_options: randomizeOptions,
            show_correct_answers: showCorrectAnswers,
            show_explanations: showExplanations,
            strict_mode: strictMode,
            fullscreen_required: fullscreenRequired,
            detect_tab_switch: detectTabSwitch,
            auto_submit_on_cheat: autoSubmitOnCheat
        };

        if (quiz) {
            const result = await updateQuiz(quiz.id, data);
            if (result.success) {
                toast.success("Quiz updated!");
            } else {
                toast.error(result.error);
            }
        } else {
            const result = await createQuiz({
                ...data,
                course_id: courseId,
                lesson_id: lessonId,
                module_id: moduleId,
                attachment_level: lessonId ? "lesson" : moduleId ? "module" : "course"
            });
            if (result.success && result.quiz) {
                setQuiz(result.quiz);
                toast.success("Quiz created!");
            } else {
                toast.error(result.error);
            }
        }

        setSaving(false);
    };

    // Add question
    const handleAddQuestion = async (type: QuizQuestionType) => {
        if (!quiz) {
            toast.error("Save quiz settings first");
            return;
        }

        const defaultOptions = type === "boolean"
            ? [{ id: "true", text: "True" }, { id: "false", text: "False" }]
            : [{ id: crypto.randomUUID(), text: "Option 1" }, { id: crypto.randomUUID(), text: "Option 2" }];

        const result = await addQuizQuestion(quiz.id, {
            type,
            question_text: "New Question",
            options: type === "mcq" || type === "multi_select" || type === "boolean" ? defaultOptions : [],
            correct_answers: [],
            points: 1
        });

        if (result.success && result.question) {
            setQuestions(prev => [...prev, result.question]);
            toast.success("Question added");
        } else {
            toast.error(result.error);
        }
    };

    // Save question
    const handleSaveQuestion = async (question: QuizQuestion) => {
        const result = await updateQuizQuestion(question.id, question);
        if (result.success) {
            setQuestions(prev => prev.map(q => q.id === question.id ? question : q));
            toast.success("Question saved");
        } else {
            toast.error(result.error);
        }
    };

    // Delete question
    const handleDeleteQuestion = async (questionId: string) => {
        const result = await deleteQuizQuestion(questionId);
        if (result.success) {
            setQuestions(prev => prev.filter(q => q.id !== questionId));
            toast.success("Question deleted");
        } else {
            toast.error(result.error);
        }
    };

    // Publish quiz
    const handlePublish = async () => {
        if (!quiz) return;
        const result = await toggleQuizPublished(quiz.id, !quiz.is_published);
        if (result.success) {
            setQuiz(prev => prev ? { ...prev, is_published: !prev.is_published } : null);
            toast.success(quiz.is_published ? "Quiz unpublished" : "Quiz published!");
        } else {
            toast.error(result.error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">{quiz ? "Edit Quiz" : "Create Quiz"}</h2>
                    <p className="text-muted-foreground">
                        {quiz?.is_published ? (
                            <Badge className="bg-green-100 text-green-700">Published</Badge>
                        ) : (
                            <Badge variant="outline">Draft</Badge>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {quiz && (
                        <Button
                            variant={quiz.is_published ? "destructive" : "default"}
                            onClick={handlePublish}
                        >
                            {quiz.is_published ? "Unpublish" : "Publish"}
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="gap-2">
                        <List className="h-4 w-4" />
                        Questions ({questions.length})
                    </TabsTrigger>
                    <TabsTrigger value="anti-cheat" className="gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Anti-Cheat
                    </TabsTrigger>
                </TabsList>

                {/* Settings Tab */}
                <TabsContent value="settings">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Quiz Title</Label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter quiz title"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Time Limit (seconds, 0 = unlimited)</Label>
                                    <Input
                                        type="number"
                                        value={timeLimit}
                                        onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Quiz description..."
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Passing Score (%)</Label>
                                    <Input
                                        type="number"
                                        value={passingScore}
                                        onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                                        min={0}
                                        max={100}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Attempts Allowed (0 = unlimited)</Label>
                                    <Input
                                        type="number"
                                        value={attemptsAllowed}
                                        onChange={(e) => setAttemptsAllowed(parseInt(e.target.value) || 0)}
                                        min={0}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Randomize Questions</Label>
                                        <p className="text-sm text-muted-foreground">Show questions in random order</p>
                                    </div>
                                    <Switch checked={randomizeQuestions} onCheckedChange={setRandomizeQuestions} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Randomize Options</Label>
                                        <p className="text-sm text-muted-foreground">Randomize answer options order</p>
                                    </div>
                                    <Switch checked={randomizeOptions} onCheckedChange={setRandomizeOptions} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Show Correct Answers</Label>
                                        <p className="text-sm text-muted-foreground">Show correct answers after submission</p>
                                    </div>
                                    <Switch checked={showCorrectAnswers} onCheckedChange={setShowCorrectAnswers} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Show Explanations</Label>
                                        <p className="text-sm text-muted-foreground">Show explanations for answers</p>
                                    </div>
                                    <Switch checked={showExplanations} onCheckedChange={setShowExplanations} />
                                </div>
                            </div>

                            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Questions Tab */}
                <TabsContent value="questions">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Questions</CardTitle>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Question
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Choose Question Type</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            {[
                                                { type: "mcq", label: "Multiple Choice", icon: "🔘" },
                                                { type: "multi_select", label: "Multiple Select", icon: "☑️" },
                                                { type: "boolean", label: "True/False", icon: "✓✗" },
                                                { type: "short_answer", label: "Short Answer", icon: "📝" }
                                            ].map(({ type, label, icon }) => (
                                                <Button
                                                    key={type}
                                                    variant="outline"
                                                    className="h-20 flex-col gap-2"
                                                    onClick={() => handleAddQuestion(type as QuizQuestionType)}
                                                >
                                                    <span className="text-2xl">{icon}</span>
                                                    <span>{label}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {questions.map((question, index) => (
                                <QuestionEditor
                                    key={question.id}
                                    question={question}
                                    index={index}
                                    onSave={handleSaveQuestion}
                                    onDelete={() => handleDeleteQuestion(question.id)}
                                />
                            ))}
                            {questions.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No questions yet. Add your first question above.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Anti-Cheat Tab */}
                <TabsContent value="anti-cheat">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5" />
                                Anti-Cheat Settings
                            </CardTitle>
                            <CardDescription>
                                Configure proctoring and cheat detection for this quiz
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label className="text-base">Strict Mode</Label>
                                    <p className="text-sm text-muted-foreground">Enable all anti-cheat measures</p>
                                </div>
                                <Switch checked={strictMode} onCheckedChange={setStrictMode} />
                            </div>

                            <div className="space-y-4 pl-4 border-l-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Fullscreen Required</Label>
                                        <p className="text-sm text-muted-foreground">Quiz must be taken in fullscreen mode</p>
                                    </div>
                                    <Switch checked={fullscreenRequired} onCheckedChange={setFullscreenRequired} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Detect Tab Switch</Label>
                                        <p className="text-sm text-muted-foreground">Track when user switches browser tabs</p>
                                    </div>
                                    <Switch checked={detectTabSwitch} onCheckedChange={setDetectTabSwitch} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Auto-Submit on Cheat</Label>
                                        <p className="text-sm text-muted-foreground">Auto-submit quiz after 3 violations</p>
                                    </div>
                                    <Switch checked={autoSubmitOnCheat} onCheckedChange={setAutoSubmitOnCheat} />
                                </div>
                            </div>

                            <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Anti-Cheat Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Question Editor Component
function QuestionEditor({
    question,
    index,
    onSave,
    onDelete
}: {
    question: QuizQuestion;
    index: number;
    onSave: (q: QuizQuestion) => void;
    onDelete: () => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState(question);

    const handleSave = () => {
        onSave(editedQuestion);
        setIsEditing(false);
    };

    const updateOption = (optionId: string, text: string) => {
        setEditedQuestion(prev => ({
            ...prev,
            options: prev.options.map(o => o.id === optionId ? { ...o, text } : o)
        }));
    };

    const addOption = () => {
        setEditedQuestion(prev => ({
            ...prev,
            options: [...prev.options, { id: crypto.randomUUID(), text: `Option ${prev.options.length + 1}` }]
        }));
    };

    const removeOption = (optionId: string) => {
        setEditedQuestion(prev => ({
            ...prev,
            options: prev.options.filter(o => o.id !== optionId),
            correct_answers: prev.correct_answers.filter(id => id !== optionId)
        }));
    };

    const toggleCorrect = (optionId: string) => {
        if (question.type === "mcq" || question.type === "boolean") {
            setEditedQuestion(prev => ({ ...prev, correct_answers: [optionId] }));
        } else {
            setEditedQuestion(prev => ({
                ...prev,
                correct_answers: prev.correct_answers.includes(optionId)
                    ? prev.correct_answers.filter(id => id !== optionId)
                    : [...prev.correct_answers, optionId]
            }));
        }
    };

    return (
        <div className="border rounded-lg p-4">
            <div className="flex items-start gap-4">
                <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <Badge variant="outline">{index + 1}</Badge>
                </div>

                <div className="flex-1 space-y-4">
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label>Question Text</Label>
                                <Textarea
                                    value={editedQuestion.question_text}
                                    onChange={(e) => setEditedQuestion(prev => ({ ...prev, question_text: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Points</Label>
                                    <Input
                                        type="number"
                                        value={editedQuestion.points}
                                        onChange={(e) => setEditedQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                                        min={1}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Explanation (optional)</Label>
                                    <Input
                                        value={editedQuestion.explanation || ""}
                                        onChange={(e) => setEditedQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Options for MCQ/Multi-select/Boolean */}
                            {(question.type === "mcq" || question.type === "multi_select" || question.type === "boolean") && (
                                <div className="space-y-2">
                                    <Label>Options (click to mark as correct)</Label>
                                    {editedQuestion.options.map((option) => (
                                        <div key={option.id} className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={editedQuestion.correct_answers.includes(option.id) ? "default" : "outline"}
                                                className="shrink-0"
                                                onClick={() => toggleCorrect(option.id)}
                                            >
                                                {editedQuestion.correct_answers.includes(option.id) ? (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                ) : (
                                                    <XCircle className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Input
                                                value={option.text}
                                                onChange={(e) => updateOption(option.id, e.target.value)}
                                                disabled={question.type === "boolean"}
                                            />
                                            {question.type !== "boolean" && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => removeOption(option.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {question.type !== "boolean" && (
                                        <Button size="sm" variant="outline" onClick={addOption}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Option
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={handleSave}>Save</Button>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            </div>
                        </>
                    ) : (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{question.type}</Badge>
                                <Badge variant="outline">{question.points} pts</Badge>
                            </div>
                            <p className="font-medium">{question.question_text}</p>
                            {question.options.length > 0 && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                    {question.options.map(o => (
                                        <span key={o.id} className={cn(
                                            "mr-2",
                                            question.correct_answers.includes(o.id) && "text-green-600 font-medium"
                                        )}>
                                            • {o.text}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={onDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
