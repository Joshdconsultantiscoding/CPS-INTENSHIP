"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Layout,
    MessageSquare,
    FileText,
    GraduationCap,
    Users,
    Bell,
    ExternalLink,
    ChevronRight,
    Home
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ClassDashboardProps {
    classDetails: any;
    announcements: any[];
    members: any[];
}

export function ClassDashboard({ classDetails, announcements, members }: ClassDashboardProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get("tab") || "overview";

    const setTab = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "overview") {
            params.delete("tab");
        } else {
            params.set("tab", value);
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Link href="/dashboard/classroom" className="hover:text-primary transition-colors flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    Classroom
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-foreground truncate max-w-[200px]">
                    {classDetails.name}
                </span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{classDetails.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        {classDetails.description || "Class Workspace"}
                    </p>
                </div>
                {classDetails.instructor && (
                    <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg border">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {classDetails.instructor.full_name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Instructor</p>
                            <p className="font-medium">{classDetails.instructor.full_name}</p>
                        </div>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setTab} className="space-y-6">
                <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
                    <TabsList className="inline-flex h-12 items-center justify-start rounded-none border-b bg-transparent p-0 w-full md:w-auto">
                        {[
                            { value: "overview", label: "Overview", icon: Layout },
                            { value: "announcements", label: "Announcements", icon: Bell },
                            { value: "tasks", label: "Tasks", icon: FileText },
                            { value: "courses", label: "Courses", icon: GraduationCap },
                            { value: "chat", label: "Chat", icon: MessageSquare },
                            { value: "members", label: "Members", icon: Users },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="inline-flex items-center justify-center whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium ring-offset-background transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none"
                            >
                                <tab.icon className="mr-2 h-4 w-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="overview" className="animate-in fade-in-50 duration-300">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Class Overview</CardTitle>
                                <CardDescription>Basic information and rules for this class.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-1">Description</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {classDetails.description || "No description provided for this class."}
                                    </p>
                                </div>
                                <div className="pt-4 border-t">
                                    <h4 className="font-semibold mb-2">Class Expectations</h4>
                                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                        <li>Be respectful to classmates and mentors.</li>
                                        <li>Complete assignments before the deadline.</li>
                                        <li>Participate in group discussions.</li>
                                        <li>Reach out if you need help!</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Recent Progress</CardTitle>
                                    <CardDescription>Your activity in this class.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-6">
                                        <p className="text-sm text-muted-foreground italic">
                                            No recent activity tracked yet.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                    <Button variant="outline" className="justify-start shadow-none" onClick={() => setTab("chat")}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Open Class Chat
                                    </Button>
                                    <Button variant="outline" className="justify-start shadow-none" onClick={() => setTab("tasks")}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Assignments
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="announcements" className="animate-in fade-in-50 duration-300">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Class Feed</CardTitle>
                                <CardDescription>Important updates from your instructor and admin.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {announcements.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/5 rounded-lg border border-dashed">
                                        <Bell className="h-10 w-10 text-muted-foreground mb-4" />
                                        <h3 className="font-semibold text-lg">No announcements yet</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                            When your instructor posts an update, it will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {announcements.map((ann) => (
                                            <div key={ann.id} className="p-4 rounded-lg border bg-card space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold">{ann.title}</h4>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(ann.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                    {ann.content}
                                                </p>
                                                {ann.author && (
                                                    <div className="pt-2 flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                                            {ann.author.full_name.charAt(0)}
                                                        </div>
                                                        <span className="text-xs font-medium">{ann.author.full_name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="tasks" className="animate-in fade-in-50 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignments</CardTitle>
                            <CardDescription>Review and submit your coursework.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/5 rounded-lg border border-dashed">
                                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg">No tasks assigned</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                    Your instructor will post tasks for this class soon.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="courses" className="animate-in fade-in-50 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assigned Learning</CardTitle>
                            <CardDescription>Courses specifically curated for this class.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/5 rounded-lg border border-dashed">
                                <GraduationCap className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="font-semibold text-lg">No courses assigned yet</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                    Explore the course marketplace to find more learning resources.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="chat" className="animate-in fade-in-50 duration-300 h-[600px]">
                    <Card className="h-full flex flex-col overflow-hidden">
                        <CardHeader className="border-b">
                            <CardTitle>Class Communication</CardTitle>
                            <CardDescription>Real-time chat with your classmates and instructor.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <div className="bg-primary/5 p-8 rounded-full mb-6">
                                <MessageSquare className="h-12 w-12 text-primary" />
                            </div>
                            <h3 className="font-semibold text-xl">Class Chat Room</h3>
                            <p className="text-muted-foreground max-w-sm mt-2">
                                Connect with your cohort instantly. Chat features are coming soon to this private space!
                            </p>
                            <Button className="mt-6" variant="secondary">
                                Join Private Channel
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="members" className="animate-in fade-in-50 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle>Classmates</CardTitle>
                            <CardDescription>Learn which interns and mentors are in your group.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {members.map((member) => (
                                    <div key={member.user_id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {member.profile?.full_name?.charAt(0) || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{member.profile?.full_name || "Unknown User"}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{member.role || "intern"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
