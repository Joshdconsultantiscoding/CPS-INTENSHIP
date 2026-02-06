"use client";

import { useState } from "react";
import {
    Users,
    Settings,
    BookOpen,
    MessageSquare,
    LayoutDashboard,
    CheckSquare,
    ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { ClassOverviewTab } from "./tabs/class-overview-tab";
import { ClassInternsTab } from "./tabs/class-interns-tab";
import { ClassCommunicationTab } from "./tabs/class-communication-tab";
import { ClassCoursesTab } from "./tabs/class-courses-tab";
import { ClassTasksTab } from "./tabs/class-tasks-tab";
import { ClassSettingsTab } from "./tabs/class-settings-tab";
import { MonitoringTab } from "./tabs/monitoring-tab";

interface ClassEditorShellProps {
    classData: any;
    enrollments: any[];
    classCourses: any[];
    availableInterns: any[];
    availableCourses: any[];
    classTasks?: any[];
    announcements?: any[];
}

export function ClassEditorShell({
    classData,
    enrollments,
    classCourses,
    availableInterns,
    availableCourses,
    classTasks = [],
    announcements = []
}: ClassEditorShellProps) {
    const [activeTab, setActiveTab] = useState("overview");

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "interns", label: "Interns", icon: Users },
        { id: "communication", label: "Communication", icon: MessageSquare },
        { id: "courses", label: "Assigned Courses", icon: BookOpen },
        { id: "tasks", label: "Tasks & Activities", icon: CheckSquare },
        { id: "monitoring", label: "Monitoring", icon: LayoutDashboard },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case "overview":
                return <ClassOverviewTab classData={classData} />;
            case "interns":
                return (
                    <ClassInternsTab
                        classData={classData}
                        enrollments={enrollments}
                        availableInterns={availableInterns}
                    />
                );
            case "communication":
                return <ClassCommunicationTab classData={classData} announcements={announcements} />;
            case "courses":
                return (
                    <ClassCoursesTab
                        classData={classData}
                        classCourses={classCourses}
                        availableCourses={availableCourses}
                    />
                );
            case "tasks":
                return <ClassTasksTab classId={classData.id} initialTasks={classTasks} />;
            case "settings":
                return <ClassSettingsTab classData={classData} />;
            case "monitoring":
                return <MonitoringTab classId={classData.id} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background overflow-hidden px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b py-4 gap-4 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
                        <Link href="/dashboard/admin/classroom">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{classData.name}</h1>
                        <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Class Management Dashboard</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="hidden xs:flex">
                        <span className="hidden sm:inline">Preview as Intern</span>
                        <span className="sm:hidden text-xs">Preview</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Tabs Navigation */}
            <div className="lg:hidden border-b bg-card overflow-x-auto no-scrollbar scroll-smooth shrink-0">
                <div className="flex px-2 items-center h-12 w-max">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 h-full text-xs font-medium whitespace-nowrap transition-all border-b-2",
                                    isActive
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-1 gap-0 lg:gap-6 overflow-hidden pt-4 lg:pt-0">
                {/* Desktop Sidebar Navigation */}
                <Card className="hidden lg:flex w-64 shrink-0 flex-col overflow-y-auto border-r-0 rounded-none lg:border-r lg:rounded-xl">
                    <nav className="flex flex-col p-2 gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    activeTab === tab.id
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </Card>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
                    <Card className="min-h-full border-0 lg:border rounded-none lg:rounded-xl bg-transparent lg:bg-card">
                        {renderTabContent()}
                    </Card>
                </div>
            </div>
        </div>
    );
}
