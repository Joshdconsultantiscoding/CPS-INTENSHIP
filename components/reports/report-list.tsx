"use client";

import { useState, useEffect } from "react";
import type { DailyReport } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle2,
  FileText,
  Eye,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ReportDetailDialog } from "./report-detail-dialog";

interface ReportListProps {
  reports: DailyReport[];
  isAdmin: boolean;
  userId: string;
}

const moodColors = {
  great: "bg-accent/20 text-accent",
  good: "bg-chart-2/20 text-chart-2",
  neutral: "bg-muted text-muted-foreground",
  challenging: "bg-chart-3/20 text-chart-3",
  difficult: "bg-destructive/20 text-destructive",
};

const statusBadge = {
  draft: { variant: "secondary" as const, label: "Draft" },
  submitted: { variant: "default" as const, label: "Submitted" },
  reviewed: { variant: "outline" as const, label: "Reviewed" },
};

export function ReportList({ reports, isAdmin, userId }: ReportListProps) {
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading reports...</p>
        </CardContent>
      </Card>
    );
  }

  const submittedReports = reports.filter((r) => r.status === "submitted");
  const reviewedReports = reports.filter((r) => r.status === "reviewed");
  const draftReports = reports.filter((r) => r.status === "draft");

  const ReportCard = ({ report }: { report: DailyReport }) => {
    const { variant, label } = statusBadge[report.status];
    const isToday = new Date(report.report_date).toDateString() === new Date().toDateString();

    return (
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md relative"
        onClick={() => setSelectedReport(report)}
      >
        {report.status === "draft" && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              router.push("/dashboard/reports/new");
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {isAdmin && report.user && (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={report.user.avatar_url || ""} />
                  <AvatarFallback>
                    {report.user.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                {isAdmin && (
                  <CardTitle className="text-base">
                    {report.user?.full_name || "Unknown User"}
                  </CardTitle>
                )}
                <CardDescription>
                  {format(new Date(report.report_date), "EEEE, MMMM d, yyyy")}
                </CardDescription>
              </div>
            </div>
            <Badge variant={variant}>{label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={moodColors[report.mood]}>
              {report.mood}
            </Badge>
            <Badge variant="outline">
              <Clock className="mr-1 h-3 w-3" />
              {report.hours_worked}h worked
            </Badge>
            <Badge variant="secondary">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {report.tasks_completed?.length || 0} tasks
            </Badge>
          </div>
          {report.learnings && (
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
              {report.learnings}
            </p>
          )}
          {report.admin_feedback && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-muted p-2">
              <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground line-clamp-2">
                {report.admin_feedback}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Tabs defaultValue={isAdmin ? "submitted" : "all"} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({reports.length})</TabsTrigger>
          {isAdmin ? (
            <>
              <TabsTrigger value="submitted">
                Pending Review ({submittedReports.length})
              </TabsTrigger>
              <TabsTrigger value="reviewed">
                Reviewed ({reviewedReports.length})
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="submitted">
                Submitted ({submittedReports.length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Drafts ({draftReports.length})
              </TabsTrigger>
            </>
          )}
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
                <p className="mt-2 text-center text-muted-foreground">
                  {isAdmin
                    ? "No reports have been submitted yet"
                    : "Start tracking your progress by submitting your first daily report"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="submitted" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {submittedReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="reviewed" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviewedReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="draft" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {draftReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ReportDetailDialog
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        isAdmin={isAdmin}
        userId={userId}
      />
    </>
  );
}
