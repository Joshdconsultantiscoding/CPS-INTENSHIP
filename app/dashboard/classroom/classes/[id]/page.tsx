import {
    getClassDetails,
    getStudentClasses,
    getClassAnnouncements,
    getClassMembers
} from "@/actions/classroom-student";
import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ClassroomSidebar } from "@/components/classroom/classroom-sidebar";
import { ClassDashboard } from "@/components/classroom/class-dashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default async function ClassPage({ params }: { params: { id: string } }) {
    const user = await getAuthUser();
    const classId = params.id;

    // Fetch details and all assigned classes (for the sidebar)
    const [classDetails, assignedClasses, announcements, members] = await Promise.all([
        getClassDetails(classId),
        getStudentClasses(),
        getClassAnnouncements(classId),
        getClassMembers(classId)
    ]);

    // Access Control Check
    if (!classDetails) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4 text-center">
                <div className="bg-destructive/10 p-6 rounded-full mb-6">
                    <ShieldAlert className="h-12 w-12 text-destructive" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Access Denied</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    You are not assigned to this class or the class does not exist.
                    Please contact your administrator if you believe this is an error.
                </p>
                <div className="flex gap-4">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/classroom">
                            View My Classes
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard">
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-4rem)]">
            <ClassroomSidebar
                assignedClasses={assignedClasses}
                activeClassId={classId}
                activeClassName={classDetails.name}
            />
            <div className="flex-1 overflow-auto bg-muted/5">
                <ClassDashboard
                    classDetails={classDetails}
                    announcements={announcements}
                    members={members}
                />
            </div>
        </div>
    );
}
