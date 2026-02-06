"use client";

import { useEffect, useState } from "react";
import {
    BarChart3,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    ExternalLink,
    FileText,
    Search,
    Download,
    Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getClassSubmissionsReport } from "@/actions/classroom-admin";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";

interface MonitoringTabProps {
    classId: string;
}

export function MonitoringTab({ classId }: MonitoringTabProps) {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedInternId, setSelectedInternId] = useState<string | null>(null);

    const fetchReport = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getClassSubmissionsReport(classId);
            setReport(data);
        } catch (error) {
            if (!silent) toast.error("Failed to load monitoring report");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();

        const supabase = createClient();
        const channel = supabase
            .channel(`class-submissions-${classId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'class_submissions'
                },
                (payload) => {
                    console.log('Submission update received:', payload);
                    fetchReport(true);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [classId]);

    if (loading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <BarChart3 className="h-12 w-12 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Generating live report...</p>
            </div>
        );
    }

    if (!report || report.tasks.length === 0) {
        return (
            <div className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No tasks found</h3>
                <p className="text-muted-foreground mt-2">Create some tasks first to start monitoring progress.</p>
            </div>
        );
    }

    const filteredReport = report.report.filter((r: any) =>
        r.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedIntern = report.report.find((i: any) => i.userId === selectedInternId);

    const totalTasks = report.tasks.length;
    const totalEnrollments = report.report.length;

    // Overall Stats
    const totalSubmissionsPossible = totalTasks * totalEnrollments;
    const totalSubmissionsActual = report.report.reduce((acc: number, r: any) => acc + r.stats.completed, 0);
    const overallCompletionRate = totalSubmissionsPossible > 0 ? (totalSubmissionsActual / totalSubmissionsPossible) * 100 : 0;

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Summary Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Overall Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(overallCompletionRate)}%</div>
                        <Progress value={overallCompletionRate} className="h-2 mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {totalSubmissionsActual} of {totalSubmissionsPossible} tasks completed across all interns.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            Active Interns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEnrollments}</div>
                        <p className="text-xs text-muted-foreground mt-2">Enrolled in this cohort.</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Assigned Tasks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTasks}</div>
                        <p className="text-xs text-muted-foreground mt-2">Active tasks and activities.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Intern Progress</h3>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => fetchReport()} className="gap-2">
                            <Clock className="h-4 w-4" />
                            Refresh
                        </Button>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter by name..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="border rounded-xl bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/50 border-b">
                                    <th className="p-4 font-semibold whitespace-nowrap">Intern</th>
                                    <th className="p-4 font-semibold whitespace-nowrap text-center">Completion</th>
                                    {report.tasks.map((task: any) => (
                                        <th key={task.id} className="p-4 font-semibold whitespace-nowrap min-w-[120px]">
                                            <div className="flex flex-col">
                                                <span className="truncate max-w-[150px]" title={task.title}>{task.title}</span>
                                                <span className="text-[10px] font-normal text-muted-foreground">
                                                    {task.deadline ? format(new Date(task.deadline), "MMM d") : "No deadline"}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReport.map((intern: any) => (
                                    <tr
                                        key={intern.userId}
                                        className="border-b hover:bg-muted/5 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedInternId(intern.userId)}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={intern.avatarUrl} />
                                                    <AvatarFallback>{intern.fullName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium group-hover:text-primary transition-colors">{intern.fullName}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {intern.stats.completed}/{intern.stats.total} Done
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <Progress
                                                value={(intern.stats.completed / intern.stats.total) * 100}
                                                className="w-24 h-2 inline-block"
                                            />
                                        </td>
                                        {intern.submissions.map((sub: any) => (
                                            <td key={sub.taskId} className="p-4">
                                                {sub.status === 'not_started' ? (
                                                    <Badge variant="secondary" className="bg-muted text-muted-foreground gap-1 font-normal opacity-50">
                                                        <Clock className="h-3 w-3" />
                                                        Pending
                                                    </Badge>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 gap-1">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Done
                                                        </Badge>
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Intern Detailed Submissions Sheet */}
            <Sheet open={!!selectedInternId} onOpenChange={(val) => !val && setSelectedInternId(null)}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader className="mb-8">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={selectedIntern?.avatarUrl} />
                                <AvatarFallback>{selectedIntern?.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                                <SheetTitle className="text-2xl font-bold">{selectedIntern?.fullName}</SheetTitle>
                                <SheetDescription>Detailed task submissions and status.</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="space-y-6 pb-20">
                        {selectedIntern?.submissions.map((sub: any) => (
                            <Card key={sub.taskId} className={cn(
                                "border-l-4 overflow-hidden",
                                sub.status === 'not_started' ? "border-l-muted" : "border-l-green-500 shadow-sm"
                            )}>
                                <CardHeader className="py-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold">{sub.taskTitle}</CardTitle>
                                        <Badge variant={sub.status === 'not_started' ? "secondary" : "default"} className={sub.status !== 'not_started' ? "bg-green-500" : ""}>
                                            {sub.status === 'not_started' ? "Pending" : "Completed"}
                                        </Badge>
                                    </div>
                                    {sub.submittedAt && (
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                            <Calendar className="h-3 w-3" />
                                            Submitted on {format(new Date(sub.submittedAt), "PPP p")}
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent className="py-4 border-t bg-muted/5">
                                    {sub.status === 'not_started' ? (
                                        <div className="py-4 text-center text-muted-foreground italic text-sm">
                                            No submission received yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {sub.content && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Response Text</Label>
                                                    <div className="p-3 rounded-lg bg-background border text-sm whitespace-pre-wrap leading-relaxed">
                                                        {sub.content}
                                                    </div>
                                                </div>
                                            )}
                                            {sub.fileUrl && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Submission Link/File</Label>
                                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                                        <div className="p-2 bg-primary/10 rounded-md">
                                                            <ExternalLink className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium truncate">{sub.fileUrl}</p>
                                                            <a
                                                                href={sub.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] text-primary hover:underline font-semibold"
                                                            >
                                                                Open Submission
                                                            </a>
                                                        </div>
                                                        <Button size="sm" variant="outline" asChild className="shrink-0 h-8 gap-1.5">
                                                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">
                                                                Open <ExternalLink className="h-3.5 w-3.5" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
