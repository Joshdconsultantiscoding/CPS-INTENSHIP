"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import Link from "next/link";

interface LessonNavigationProps {
    courseId: string;
    currentLessonId: string;
    course: any;
    userRole: string;
}

export function LessonNavigation({ courseId, currentLessonId, course, userRole }: LessonNavigationProps) {
    const allLessons = course.course_modules.flatMap((m: any) => m.course_lessons || []);
    const currentIndex = allLessons.findIndex((l: any) => l.id === currentLessonId);

    if (currentIndex === -1) return null;

    const currentLesson = allLessons[currentIndex];
    const nextLesson = allLessons[currentIndex + 1];
    const prevLesson = allLessons[currentIndex - 1];

    // Find current module
    const currentModule = course.course_modules.find((m: any) =>
        m.course_lessons?.some((l: any) => l.id === currentLessonId)
    );

    // Decision Logic for "Next" button
    let nextConfig = null;

    // 1. Check for Lesson Assessment
    if (currentLesson.course_questions?.[0]?.count > 0) {
        nextConfig = {
            label: "Take Lesson Quiz",
            href: `/dashboard/classroom/courses/${courseId}/assessment/lesson/${currentLessonId}`,
            variant: "default" as const
        };
    }
    // 2. Check for Module Assessment (if last lesson in module)
    else if (currentModule?.course_lessons?.[currentModule.course_lessons.length - 1]?.id === currentLessonId && currentModule.course_questions?.[0]?.count > 0) {
        nextConfig = {
            label: "Take Module Quiz",
            href: `/dashboard/classroom/courses/${courseId}/assessment/module/${currentModule.id}`,
            variant: "default" as const
        };
    }
    // 3. Check for Course Assessment (if last lesson in course)
    else if (!nextLesson && course.course_questions?.[0]?.count > 0) {
        nextConfig = {
            label: "Final Course Quiz",
            href: `/dashboard/classroom/courses/${courseId}/assessment/course/${courseId}`,
            variant: "default" as const
        };
    }
    // 4. Default to Next Lesson
    else if (nextLesson) {
        nextConfig = {
            label: "Next Lesson",
            href: `/dashboard/classroom/courses/${courseId}/lessons/${nextLesson.id}`,
            variant: "default" as const
        };
    }

    return (
        <div className="flex items-center gap-2">
            {prevLesson && userRole === "admin" && (
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/classroom/courses/${courseId}/lessons/${prevLesson.id}`}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Prev
                    </Link>
                </Button>
            )}

            {nextConfig && (
                <Button size="sm" variant={nextConfig.variant} asChild className="font-semibold shadow-sm">
                    <Link href={nextConfig.href}>
                        {nextConfig.label}
                        {nextConfig.label.includes("Quiz") ? <GraduationCap className="ml-2 h-4 w-4" /> : <ChevronRight className="ml-2 h-4 w-4" />}
                    </Link>
                </Button>
            )}
        </div>
    );
}
