import { getClassDetails, getInternsList, getCoursesList } from "@/actions/classroom-admin";
import { ClassEditorShell } from "@/components/admin/classroom/class-editor/class-editor-shell";
import { notFound } from "next/navigation";

interface ClassEditPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ClassEditPage({ params }: ClassEditPageProps) {
    const { id } = await params;

    try {
        const [details, allInterns, allCourses] = await Promise.all([
            getClassDetails(id),
            getInternsList(),
            getCoursesList()
        ]);

        if (!details.classData) {
            notFound();
        }

        return (
            <div className="container py-8 max-w-7xl mx-auto flex-1 h-full">
                <ClassEditorShell
                    classData={details.classData}
                    enrollments={details.enrollments}
                    classCourses={details.classCourses}
                    availableInterns={allInterns || []}
                    availableCourses={allCourses || []}
                    announcements={details.announcements}
                    classTasks={details.classTasks}
                />
            </div>
        );
    } catch (error) {
        console.error("Error loading class editor:", error);
        notFound();
    }
}
