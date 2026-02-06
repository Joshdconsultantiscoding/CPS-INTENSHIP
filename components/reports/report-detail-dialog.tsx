"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyReport } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Loader2,
  Star,
} from "lucide-react";
import { reviewDailyReport } from "@/app/actions/reports";

interface ReportDetailDialogProps {
  report: DailyReport | null;
  onClose: () => void;
  isAdmin: boolean;
  userId: string;
}

const moodLabels = {
  great: "Feeling Great",
  good: "Good Day",
  neutral: "Neutral",
  challenging: "Challenging",
  difficult: "Difficult Day",
};

export function ReportDetailDialog({
  report,
  onClose,
  isAdmin,
  userId,
}: ReportDetailDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(report?.admin_feedback || "");
  const [adminRating, setAdminRating] = useState(report?.admin_rating || 5);

  if (!report) return null;

  const handleSubmitFeedback = async () => {
    setLoading(true);

    const response = await reviewDailyReport({
      reportId: report.id,
      reviewerId: userId,
      feedback: feedback,
      rating: adminRating,
      internId: report.user_id,
      reportDate: report.report_date
    });

    if (!response.success) {
      toast.error(response.error || "Failed to submit feedback");
      setLoading(false);
      return;
    }

    toast.success("Feedback submitted successfully");
    setLoading(false);
    onClose();
    router.refresh();
  };

  const StarRating = ({ value, onChange, disabled }: { value: number, onChange?: (v: number) => void, disabled?: boolean }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(star)}
          title={`${star} Star${star > 1 ? 's' : ''}`}
          aria-label={`${star} Star${star > 1 ? 's' : ''}`}
          className={`${disabled ? 'cursor-default' : 'cursor-pointer'} transition-colors ${star <= value ? "text-yellow-400 fill-yellow-400" : "text-slate-300"
            }`}
        >
          <Star className={`h-5 w-5 ${star <= value ? 'fill-current' : ''}`} />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={!!report} onOpenChange={() => onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {report.user && (
              <Avatar className="h-10 w-10">
                <AvatarImage src={report.user.avatar_url || ""} />
                <AvatarFallback>
                  {report.user.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <DialogTitle>
                {isAdmin
                  ? `${report.user?.full_name || "Unknown"}'s Report`
                  : "Daily Report"}
              </DialogTitle>
              <DialogDescription>
                {format(new Date(report.report_date), "EEEE, MMMM d, yyyy")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline">
              <Clock className="mr-1 h-3 w-3" />
              {report.hours_worked} hours worked
            </Badge>
            <Badge variant="secondary">{moodLabels[report.mood]}</Badge>
            {report.status === "reviewed" && report.admin_rating && (
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                <StarRating value={report.admin_rating} disabled />
                <span className="text-xs font-bold text-yellow-700">{report.admin_rating}/5</span>
              </div>
            )}
            <Badge
              variant={report.status === "reviewed" ? "outline" : "default"}
            >
              {report.status}
            </Badge>
          </div>

          <Separator />

          {/* Tasks Completed */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <h4 className="font-medium">Tasks Completed</h4>
            </div>
            {report.tasks_completed && report.tasks_completed.length > 0 ? (
              <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                {report.tasks_completed.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tasks completed today
              </p>
            )}
          </div>

          {/* Tasks In Progress */}
          {report.tasks_in_progress && report.tasks_in_progress.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-chart-3" />
                <h4 className="font-medium">In Progress</h4>
              </div>
              <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                {report.tasks_in_progress.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Blockers */}
          {report.blockers && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h4 className="font-medium">Blockers</h4>
              </div>
              <p className="text-sm text-muted-foreground">{report.blockers}</p>
            </div>
          )}

          {/* Learnings */}
          {report.learnings && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Learnings</h4>
              </div>
              <p className="text-sm text-muted-foreground">{report.learnings}</p>
            </div>
          )}

          <Separator />

          {/* Admin Feedback Section */}
          {isAdmin && report.status === "submitted" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Performance Rating</Label>
                <div className="flex items-center gap-4">
                  <StarRating value={adminRating} onChange={setAdminRating} />
                  <span className="text-sm font-medium">{adminRating}/5 Stars</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback on this report..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Show existing feedback */}
          {report.admin_feedback && report.status === "reviewed" && (
            <div className="space-y-2 rounded-md bg-muted p-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Admin Feedback</h4>
                {report.admin_rating && (
                  <StarRating value={report.admin_rating} disabled />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {report.admin_feedback}
              </p>
              {report.reviewer && (
                <p className="text-xs text-muted-foreground">
                  Reviewed by {report.reviewer.full_name} on{" "}
                  {format(new Date(report.reviewed_at!), "MMM d, yyyy")}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isAdmin && report.status === "submitted" && (
            <Button onClick={handleSubmitFeedback} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
