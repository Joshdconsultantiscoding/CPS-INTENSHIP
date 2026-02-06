import { Suspense } from "react";
import { getAuthUser } from "@/lib/auth";
import { getStudentClasses } from "@/actions/classroom-student";
import { ClassroomSidebar } from "@/components/classroom/classroom-sidebar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const metadata = {
    title: "Classroom | InternHub",
};

export default async function ClassroomPage() {
    const [user, assignedClasses] = await Promise.all([
        getAuthUser(),
        getStudentClasses()
    ]);

    if (user.role === "admin") {
        redirect("/dashboard/admin/classroom");
    }

    return (
        <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-4rem)]">
            {/* Dynamic Sidebar with Real Classes */}
            <ClassroomSidebar assignedClasses={assignedClasses} />

            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Welcome Section */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Welcome to the Classroom, {user.firstName || "Intern"}!</h1>
                        <p className="text-muted-foreground">
                            Access your private class assignments and collaboration spaces.
                        </p>
                    </div>

                    <Separator />

                    {/* My Classes Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-semibold">My Classes</h2>
                            </div>
                        </div>

                        {assignedClasses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50 bg-muted/5">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mt-4 text-xl font-semibold">You have not been assigned to any class yet.</h3>
                                <p className="mb-4 mt-2 text-muted-foreground max-w-sm">
                                    Please wait for your administrator to assign you to a cohort. In the meantime, you can browse available courses.
                                </p>
                                <Button asChild variant="outline">
                                    <Link href="/dashboard/classroom/courses">
                                        Browse Course Marketplace
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {assignedClasses.map((cls: any) => (
                                    <div key={cls.id} className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                                        <div>
                                            <h3 className="font-semibold text-lg">{cls.name}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                                                {cls.description || "No description provided."}
                                            </p>
                                            {cls.instructor && (
                                                <p className="text-xs text-muted-foreground mt-4">
                                                    Instructor: {cls.instructor.full_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-6">
                                            <Button asChild size="sm" className="w-full">
                                                <Link href={`/dashboard/classroom/classes/${cls.id}`}>
                                                    Enter Class
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
