import { getAuthUser } from "@/lib/auth";
import { getCourseDetail } from "@/actions/classroom-student";
import { VideoPlayer } from "@/components/classroom/video-player";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    PlayCircle,
    FileText,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";

interface LessonPageProps {
    params: { id: string; lessonId: string };
}

export default async function LessonPage({ params }: LessonPageProps) {
    const user = await getAuthUser();
    const course = await getCourseDetail(params.id);

    // Find current lesson
    let currentLesson: any = null;
    let nextLesson: any = null;
    let prevLesson: any = null;

    const allLessons = course.course_modules.flatMap((m: any) => m.course_lessons || []);
    const currentIndex = allLessons.findIndex((l: any) => l.id === params.lessonId);

    if (currentIndex === -1) {
        redirect(`/dashboard/classroom/courses/${params.id}`);
    }

    currentLesson = allLessons[currentIndex];
    prevLesson = allLessons[currentIndex - 1];
    nextLesson = allLessons[currentIndex + 1];

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
            {/* Sidebar Navigation */}
            <aside className="w-80 border-r bg-card flex flex-col shrink-0 hidden lg:flex">
                <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                    <h2 className="font-semibold text-sm truncate pr-4">{course.title}</h2>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href={`/dashboard/classroom/courses/${params.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <Accordion type="multiple" defaultValue={[course.course_modules.find((m: any) =>
                        m.course_lessons?.some((l: any) => l.id === params.lessonId)
                    )?.id]} className="w-full">
                        {course.course_modules.map((module: any, idx: number) => (
                            <AccordionItem key={module.id} value={module.id} className="border-b last:border-b-0">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors text-left">
                                    <span className="truncate">{idx + 1}. {module.title}</span>
                                </AccordionTrigger>
                                <AccordionContent className="pb-2 pt-0">
                                    <div className="space-y-0.5">
                                        {module.course_lessons?.map((lesson: any) => {
                                            const isActive = lesson.id === params.lessonId;
                                            return (
                                                <Link
                                                    key={lesson.id}
                                                    href={`/dashboard/classroom/courses/${params.id}/lessons/${lesson.id}`}
                                                    className={`
                                                        flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2
                                                        ${isActive
                                                            ? "bg-primary/5 border-primary text-primary font-medium"
                                                            : "border-transparent hover:bg-muted text-muted-foreground"
                                                        }
                                                    `}
                                                >
                                                    <PlayCircle className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                                    <span className="truncate">{lesson.title}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                <div className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8">
                    {/* Centered Video Player */}
                    <VideoPlayer url={currentLesson.video_url} title={currentLesson.title} />

                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight">{currentLesson.title}</h1>
                                <p className="text-sm text-muted-foreground">
                                    Module: {course.course_modules.find((m: any) => m.course_lessons?.some((l: any) => l.id === params.lessonId))?.title}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {prevLesson && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/dashboard/classroom/courses/${params.id}/lessons/${prevLesson.id}`}>
                                            <ChevronLeft className="mr-2 h-4 w-4" />
                                            Prev
                                        </Link>
                                    </Button>
                                )}
                                {nextLesson && (
                                    <Button size="sm" asChild>
                                        <Link href={`/dashboard/classroom/courses/${params.id}/lessons/${nextLesson.id}`}>
                                            Next Lesson
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {currentLesson.content && (
                            <div className="prose prose-sm dark:prose-invert max-w-none bg-card p-6 rounded-lg border">
                                <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold border-b pb-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Lesson Notes
                                </h3>
                                <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {currentLesson.content}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
