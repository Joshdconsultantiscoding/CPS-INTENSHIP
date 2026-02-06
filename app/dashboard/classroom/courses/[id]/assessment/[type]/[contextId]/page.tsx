import { StudentAssessmentView } from "@/components/classroom/student-assessment-view";
import { getCourseDetail } from "@/actions/classroom-student";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AssessmentPageProps {
    params: Promise<{
        id: string;
        type: 'lesson' | 'module' | 'course';
        contextId: string;
    }>
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
    const { id, type, contextId } = await params;
    const course = await getCourseDetail(id);

    // Find next destination after assessment
    // This is essentially "What comes after this context?"
    const allLessons = course.course_modules.flatMap((m: any) => m.course_lessons || []);

    let nextUrl = `/dashboard/classroom/courses/${id}`;

    if (type === 'lesson') {
        const currentIndex = allLessons.findIndex((l: any) => l.id === contextId);
        if (currentIndex !== -1 && allLessons[currentIndex + 1]) {
            nextUrl = `/dashboard/classroom/courses/${id}/lessons/${allLessons[currentIndex + 1].id}`;
        }
    } else if (type === 'module') {
        const moduleIndex = course.course_modules.findIndex((m: any) => m.id === contextId);
        if (moduleIndex !== -1 && course.course_modules[moduleIndex + 1]) {
            const firstLesson = course.course_modules[moduleIndex + 1].course_lessons?.[0];
            if (firstLesson) {
                nextUrl = `/dashboard/classroom/courses/${id}/lessons/${firstLesson.id}`;
            }
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-muted/5 p-4 md:p-8">
            <div className="max-w-4xl mx-auto mb-8">
                <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
                    <Link href={`/dashboard/classroom/courses/${id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Course Overview
                    </Link>
                </Button>
            </div>

            <StudentAssessmentView
                courseId={id}
                contextId={contextId}
                contextType={type}
                nextUrl={nextUrl}
            />
        </div>
    );
}
