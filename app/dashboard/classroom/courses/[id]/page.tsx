import { Suspense } from "react";
import { getAuthUser } from "@/lib/auth";
import { getCourseDetail } from "@/actions/classroom-student";
import { numberToWords, formatLessonTitle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    BookOpen,
    Clock,
    BarChart,
    ChevronRight,
    PlayCircle,
    CheckCircle2,
    Lock
} from "lucide-react";
import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";

interface CoursePageProps {
    params: { id: string };
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
    const user = await getAuthUser();
    const course = await getCourseDetail(params.id);

    return (
        <div className="container py-8 max-w-5xl mx-auto space-y-8">
            {/* Breadcrumbs */}
            <nav className="flex text-sm text-muted-foreground mb-4">
                <Link href="/dashboard/classroom" className="hover:text-primary transition-colors">Classroom</Link>
                <ChevronRight className="h-4 w-4 mx-2" />
                <Link href="/dashboard/classroom/courses" className="hover:text-primary transition-colors">Courses</Link>
                <ChevronRight className="h-4 w-4 mx-2" />
                <span className="text-foreground font-medium truncate">{course.title}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">{course.level || "beginner"}</Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {course.duration_minutes}m
                            </Badge>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {course.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold">Course Curriculum</h2>

                        <Accordion type="single" collapsible className="w-full border rounded-lg overflow-hidden bg-card">
                            {course.course_modules?.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No modules have been added to this course yet.
                                </div>
                            ) : (
                                course.course_modules.map((module: any, idx: number) => (
                                    <AccordionItem key={module.id} value={module.id} className={idx === course.course_modules.length - 1 ? "border-b-0" : ""}>
                                        <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/50 transition-colors py-4">
                                            <div className="flex items-center gap-3 text-left">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                                    {numberToWords(idx + 1)}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">{module.title}</span>
                                                    <p className="text-xs text-muted-foreground font-normal mt-0.5">
                                                        {module.course_lessons?.length || 0} Lessons
                                                    </p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-6 pb-4 pt-0">
                                            <div className="space-y-1 pt-2">
                                                {module.course_lessons?.map((lesson: any, lIdx: number) => (
                                                    <div
                                                        key={lesson.id}
                                                        className="flex items-center justify-between p-3 rounded-md transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <PlayCircle className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm font-medium">{formatLessonTitle(lesson.title, lIdx)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xs text-muted-foreground">
                                                                {lesson.duration_minutes ? `${lesson.duration_minutes}m` : ""}
                                                            </span>
                                                            <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))
                            )}
                        </Accordion>
                    </div>
                </div>

                {/* Sidebar Card */}
                <div className="space-y-6">
                    <div className="rounded-xl border bg-card p-6 shadow-sm sticky top-24">
                        <div className="aspect-video w-full rounded-lg bg-muted mb-6 flex items-center justify-center overflow-hidden">
                            {course.thumbnail_url ? (
                                <img src={course.thumbnail_url} alt={course.title} className="object-cover w-full h-full" />
                            ) : (
                                <BookOpen className="h-12 w-12 text-muted-foreground" />
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-2xl font-bold">
                                <span>{course.price === 0 ? "Free" : `$${course.price}`}</span>
                            </div>

                            {course.course_modules?.[0]?.course_lessons?.[0] ? (
                                <Button className="w-full text-lg h-12" size="lg" asChild>
                                    <Link href={`/dashboard/classroom/courses/${course.id}/lessons/${course.course_modules[0].course_lessons[0].id}`}>
                                        Start Learning
                                    </Link>
                                </Button>
                            ) : (
                                <Button className="w-full text-lg h-12" size="lg" disabled>
                                    No Content Yet
                                </Button>
                            )}

                            <p className="text-center text-xs text-muted-foreground">
                                Full lifetime access • Sync across devices
                            </p>

                            <div className="space-y-3 pt-4 border-t">
                                <h4 className="text-sm font-semibold">This course includes:</h4>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <PlayCircle className="h-4 w-4" />
                                        Video Lessons
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <BarChart className="h-4 w-4" />
                                        {(course.level || "beginner").charAt(0).toUpperCase() + (course.level || "beginner").slice(1)} Level
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Certificate of Completion
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
