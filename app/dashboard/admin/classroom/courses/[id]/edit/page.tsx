import { Suspense } from "react";
export const dynamic = 'force-dynamic';
import { getCourseForEditor } from "@/actions/classroom-advanced";
import { getInternsList, getClassesList } from "@/actions/classroom-admin";
import { CourseBuilderShell } from "@/components/admin/classroom/editor/course-builder-shell";
import { CourseInfoTab } from "@/components/admin/classroom/editor/tabs/course-info-tab";
import { CourseStructureTab } from "@/components/admin/classroom/editor/tabs/course-structure-tab";
import { LessonContentTab } from "@/components/admin/classroom/editor/tabs/lesson-content-tab";
import { AssessmentTab } from "@/components/admin/classroom/editor/tabs/assessment-tab";
import { SettingsTab } from "@/components/admin/classroom/editor/tabs/settings-tab";
import { AnalyticsTab } from "@/components/admin/classroom/editor/tabs/analytics-tab";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

interface EditorPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string; lessonId?: string }>;
}

export default async function CourseEditorPage({ params, searchParams }: EditorPageProps) {
    const { id } = await params;
    const { tab, lessonId: currentLessonId } = await searchParams;

    const course = await getCourseForEditor(id);
    const interns = await getInternsList();
    const classes = await getClassesList();
    const activeTab = (tab as string) || "info";

    const renderTab = () => {
        switch (activeTab) {
            case "info":
                return <CourseInfoTab course={course} />;
            case "modules":
                return <CourseStructureTab course={course} />;
            case "lessons":
                return <LessonContentTab course={course} />;
            case "assessment":
                return <AssessmentTab course={course} />;
            case "settings":
                return <SettingsTab course={course} interns={interns} classes={classes} />;
            case "analytics":
                return <AnalyticsTab course={course} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p>Tab component under construction...</p>
                    </div>
                );
        }
    };

    return (
        <CourseBuilderShell course={course}>
            <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                {renderTab()}
            </Suspense>
        </CourseBuilderShell>
    );
}
