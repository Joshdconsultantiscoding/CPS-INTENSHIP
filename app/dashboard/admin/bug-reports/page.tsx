import { getBugReports } from "@/actions/bug-reports";
import { BugReportsList } from "@/components/bug-reports/admin/bug-reports-list";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Bug } from "lucide-react";

export default async function AdminBugReportsPage() {
    const reports = await getBugReports();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bug Reports & Feedback</h1>
                    <p className="text-muted-foreground">Monitor and manage site feedback from interns.</p>
                </div>
                <div className="bg-destructive/10 p-3 rounded-full">
                    <Bug className="h-6 w-6 text-destructive" />
                </div>
            </div>

            <BugReportsList initialReports={reports} />
        </div>
    );
}
