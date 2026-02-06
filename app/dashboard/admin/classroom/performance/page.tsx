import { createAdminClient } from "@/utils/supabase/server";
import { PerformanceDashboard } from "@/components/admin/classroom/performance-dashboard";
import {
    LayoutDashboard,
    ArrowLeft,
    TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function adminPerformancePage() {
    const supabase = await createAdminClient();

    // Fetch all attempts with profiles and courses
    const { data: attempts, error } = await supabase
        .from("course_attempts")
        .select(`
            *,
            profile:profiles(id, full_name, email, avatar_url),
            course:courses(id, title)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching attempts:", error);
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" asChild className="-ml-3 h-8 text-muted-foreground">
                            <Link href="/dashboard/admin/classroom">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Classroom
                            </Link>
                        </Button>
                    </div>
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-bold tracking-tight">Performance Analytics</h2>
                    </div>
                    <p className="text-muted-foreground">
                        Track intern progress and assessment results in real-time.
                    </p>
                </div>
            </div>

            <PerformanceDashboard attempts={attempts || []} />
        </div>
    );
}
