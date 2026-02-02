"use client";

import { useState } from "react";
import {
    Info,
    Layers,
    Video,
    HelpCircle,
    Settings,
    BarChart3,
    Search,
    ChevronLeft,
    Save,
    Eye,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface CourseBuilderShellProps {
    course: any;
    children: React.ReactNode;
}

export function CourseBuilderShell({ course, children }: CourseBuilderShellProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "info";
    const [isSaving, setIsSaving] = useState(false);

    const tabs = [
        { id: "info", title: "Course Info", icon: Info },
        { id: "modules", title: "Modules", icon: Layers },
        { id: "lessons", title: "Lessons", icon: Video },
        { id: "assessment", title: "Assessments", icon: HelpCircle },
        { id: "settings", title: "Settings", icon: Settings },
        { id: "analytics", title: "Analytics", icon: BarChart3 },
    ];

    const setTab = (id: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", id);
        router.push(`${pathname}?${params.toString()}`);
    };

    const calculateProgress = () => {
        let score = 0;
        const total = 6;

        if (course.title) score++;
        if (course.description || course.short_description) score++;
        if (course.thumbnail_url || course.cover_image_url) score++;
        if (course.course_modules?.length > 0) score++;

        const totalLessons = course.course_modules?.reduce((acc: number, m: any) => acc + (m.course_lessons?.length || 0), 0) || 0;
        if (totalLessons >= 3) score++;

        if (course.status === 'published') score++;

        return Math.round((score / total) * 100);
    };

    const progress = calculateProgress();

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b bg-card flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
                        <Link href="/dashboard/admin/classroom">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-sm font-semibold truncate max-w-[150px] sm:max-w-[300px]">{course.title}</h1>
                        <div className="flex items-center gap-2">
                            <Badge variant={course.status === "published" ? "default" : "secondary"} className="text-[10px] h-4 px-1">
                                {course.status || "Draft"}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground hidden xs:flex items-center gap-1">
                                <Search className="h-2.5 w-2.5" />
                                /{course.slug || course.id.slice(0, 8)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Button variant="outline" size="sm" className="hidden xs:flex" asChild>
                        <Link href={`/dashboard/classroom/courses/${course.id}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Preview</span>
                        </Link>
                    </Button>
                    <Button size="sm" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        <span className="hidden sm:inline">Save Changes</span>
                        <span className="sm:hidden text-xs">Save</span>
                    </Button>
                </div>
            </header>

            {/* Mobile Tabs Wrapper */}
            <div className="lg:hidden border-b bg-card overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex px-4 items-center h-12 w-max">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 h-full text-xs font-medium whitespace-nowrap transition-all border-b-2
                                    ${isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                    }
                                `}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {tab.title}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex w-64 border-r bg-card flex-col shrink-0">
                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setTab(tab.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-all
                                        ${isActive
                                            ? "bg-primary text-primary-foreground shadow-sm font-medium"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }
                                    `}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? "" : "opacity-70"}`} />
                                    {tab.title}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t bg-muted/30">
                        <div className="rounded-lg border bg-card p-3 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Setup Progress</span>
                                <span className="font-medium text-primary">{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                {progress === 100
                                    ? "Course is fully configured and ready!"
                                    : "Complete all sections to finish setup."}
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-muted/5 scroll-smooth">
                    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
