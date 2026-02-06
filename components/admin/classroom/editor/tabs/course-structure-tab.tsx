"use client";

import { useState, useTransition } from "react";
import {
    Plus,
    GripVertical,
    MoreVertical,
    Trash2,
    Edit2,
    Video,
    FileText,
    ChevronDown,
    ChevronUp,
    Loader2,
    Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    deleteLesson
} from "@/actions/classroom-advanced";
import { toast } from "sonner";
import { numberToWords, formatLessonTitle } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

// ... (imports)


interface CourseStructureTabProps {
    course: any;
}

export function CourseStructureTab({ course }: CourseStructureTabProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isAddingModule, setIsAddingModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showContinueDialog, setShowContinueDialog] = useState(false);

    const handleAddModule = async () => {
        if (!newModuleTitle.trim()) return;
        setIsSubmitting(true);
        try {
            await createModule(course.id, newModuleTitle);
            setNewModuleTitle("");
            toast.success("Module added!");
            startTransition(() => {
                router.refresh();
                setIsAddingModule(false);
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddLesson = async (moduleId: string) => {
        setIsSubmitting(true);
        try {
            await createLesson(moduleId, course.id, "New Lesson");
            toast.success("Lesson added!");
            startTransition(() => {
                router.refresh();
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm("Are you sure? This will delete all lessons inside.")) return;
        try {
            await deleteModule(moduleId, course.id);
            toast.success("Module deleted.");
            startTransition(() => {
                router.refresh();
            });
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm("Delete this lesson?")) return;
        try {
            await deleteLesson(lessonId, course.id);
            toast.success("Lesson deleted.");
            startTransition(() => {
                router.refresh();
            });
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleContinue = () => {
        const params = new URLSearchParams(window.location.search);
        params.set("tab", "lessons");
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Course Structure</h2>
                    <p className="text-sm text-muted-foreground">Manage your modules and lessons.</p>
                </div>
                {!isAddingModule ? (
                    <Button onClick={() => setIsAddingModule(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Module
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Module Title"
                            className="w-64"
                            value={newModuleTitle}
                            onChange={(e) => setNewModuleTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
                        />
                        <Button variant="default" onClick={handleAddModule} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                        <Button variant="ghost" onClick={() => setIsAddingModule(false)}>Cancel</Button>
                    </div>
                )}
            </div>

            {/* ... (loader) */}

            {/* ... (empty state) */}

            {course.course_modules && course.course_modules.length > 0 && (
                <Accordion type="multiple" className="w-full space-y-4">
                    {course.course_modules.map((module: any, mIdx: number) => (
                        <AccordionItem
                            key={module.id}
                            value={module.id}
                            className="border rounded-lg bg-card overflow-hidden"
                        >
                            <div className="flex items-center px-4 hover:bg-muted/50 transition-colors">
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                <AccordionTrigger className="flex-1 py-4 px-2 hover:no-underline font-semibold">
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground text-xs uppercase tabular-nums">Module {numberToWords(mIdx + 1)}</span>
                                        <span>{module.title}</span>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteModule(module.id);
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <AccordionContent className="px-4 pb-4 pt-0">
                                <div className="space-y-1 mt-2">
                                    {module.course_lessons?.map((lesson: any, lIdx: number) => (
                                        <div
                                            key={lesson.id}
                                            className="flex items-center gap-3 p-3 rounded-md bg-muted/30 border hover:bg-muted/50 transition-colors group"
                                        >
                                            <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-bold border">
                                                {lIdx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{formatLessonTitle(lesson.title, lIdx)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                    <Link href={`?tab=lessons&lessonId=${lesson.id}`}>
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mt-2 border-2 border-dashed h-10 hover:border-primary hover:bg-primary/5 hover:text-primary"
                                        onClick={() => handleAddLesson(module.id)}
                                        disabled={isSubmitting || isPending}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Lesson
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}

            <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-background border-t flex justify-between items-center z-10">
                <p className="text-xs text-muted-foreground">
                    Build your structure here. Content is edited in the next step.
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/dashboard/admin/classroom')}>
                        Save & Exit
                    </Button>
                    <Button onClick={() => setShowContinueDialog(true)}>
                        Save & Continue
                    </Button>
                </div>
            </div>

            <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Structure Saved</DialogTitle>
                        <DialogDescription>
                            Your course structure is ready. Would you like to proceed to adding content to your lessons?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowContinueDialog(false)}>
                            Keep Editing
                        </Button>
                        <Button onClick={handleContinue}>
                            Proceed to Lessons
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
