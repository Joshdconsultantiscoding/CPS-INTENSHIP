import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap } from "lucide-react";
import { getClassesList, getInternsList, getCoursesList } from "@/actions/classroom-admin";
import { ClassManager } from "@/components/admin/classroom/class-manager";
import { InternManager } from "@/components/admin/classroom/intern-manager";
import { CourseManager } from "@/components/admin/classroom/course-manager";

export default async function AdminClassroomPage() {
    const classes = await getClassesList();
    const interns = await getInternsList();
    const courses = await getCoursesList();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classroom Control Center</h1>
                    <p className="text-muted-foreground">
                        Manage interns, assign classes, and create courses.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="classes" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="interns" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Manage Interns
                    </TabsTrigger>
                    <TabsTrigger value="classes" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Manage Classes
                    </TabsTrigger>
                    <TabsTrigger value="courses" className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Manage Courses
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="interns" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Intern Assignments</CardTitle>
                            <CardDescription>
                                Select interns to assign them to classes or specific courses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <InternManager interns={interns || []} classes={classes || []} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="classes" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Class Management</CardTitle>
                            <CardDescription>
                                Create and edit private classes for intern groups.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ClassManager initialClasses={classes || []} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="courses" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Course Library</CardTitle>
                            <CardDescription>
                                Create and manage courses and lessons.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CourseManager initialCourses={courses || []} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
