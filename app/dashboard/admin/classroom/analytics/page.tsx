import { Suspense } from "react";
import { getAuthUser } from "@/lib/auth";
import { getLMSAnalytics } from "@/actions/lms-analytics";
import { redirect } from "next/navigation";
import { LMSAnalyticsDashboard } from "@/components/admin/lms-analytics-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default async function LMSAnalyticsPage() {
    const user = await getAuthUser();

    if (user.role !== "admin") {
        redirect("/dashboard");
    }

    const analytics = await getLMSAnalytics();

    return (
        <div className="container py-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">LMS Analytics</h1>
                <p className="text-muted-foreground mt-1">
                    Monitor intern learning progress, quiz performance, and course completion metrics
                </p>
            </div>

            <Suspense fallback={<AnalyticsSkeleton />}>
                <LMSAnalyticsDashboard analytics={analytics} />
            </Suspense>
        </div>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-28" />
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
            </div>
        </div>
    );
}
