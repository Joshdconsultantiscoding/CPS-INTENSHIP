"use client";

import React from "react"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReportMood } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Smile, Meh, Frown, ThumbsUp, ThumbsDown } from "lucide-react";
import { saveDailyReport } from "@/app/actions/reports";

interface ReportFormProps {
  userId: string;
  tasks: { id: string; title: string; status: string }[];
}

const moodOptions: { value: ReportMood; label: string; icon: React.ReactNode }[] = [
  { value: "great", label: "Great", icon: <ThumbsUp className="h-5 w-5" /> },
  { value: "good", label: "Good", icon: <Smile className="h-5 w-5" /> },
  { value: "neutral", label: "Neutral", icon: <Meh className="h-5 w-5" /> },
  { value: "challenging", label: "Challenging", icon: <Frown className="h-5 w-5" /> },
  { value: "difficult", label: "Difficult", icon: <ThumbsDown className="h-5 w-5" /> },
];

export function ReportForm({ userId, tasks }: ReportFormProps) {
  const router = useRouter();
  const [reportId, setReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [inProgressTaskIds, setInProgressTaskIds] = useState<string[]>([]);
  const [otherCompleted, setOtherCompleted] = useState("");
  const [blockers, setBlockers] = useState("");
  const [learnings, setLearnings] = useState("");
  const [mood, setMood] = useState<ReportMood>("good");
  const [hoursWorked, setHoursWorked] = useState("8");

  const supabase = createClient();

  // Load existing report for today if any
  useEffect(() => {
    async function loadTodayReport() {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("user_id", userId)
        .eq("report_date", today)
        .single();

      if (data && !error) {
        setReportId(data.id);
        setMood(data.mood || "good");
        setHoursWorked(data.hours_worked?.toString() || "8");
        setBlockers(data.blockers || "");
        setLearnings(data.learnings || "");

        // Match tasks
        if (data.tasks_completed) {
          const matchedIds = tasks
            .filter(t => data.tasks_completed.includes(t.title))
            .map(t => t.id);
          setCompletedTaskIds(matchedIds);

          // Other completed are ones not in our tasks list
          const taskTitles = tasks.map(t => t.title);
          const others = data.tasks_completed.filter((title: string) => !taskTitles.includes(title));
          setOtherCompleted(others.join("\n"));
        }

        if (data.tasks_in_progress) {
          const matchedProgressIds = tasks
            .filter(t => data.tasks_in_progress.includes(t.title))
            .map(t => t.id);
          setInProgressTaskIds(matchedProgressIds);
        }
      }
      setInitialLoading(false);
    }

    loadTodayReport();
  }, [userId, tasks, supabase]);

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const pendingTasks = tasks.filter((t) => t.status !== "completed");

  const handleSubmit = async (status: "draft" | "submitted") => {
    setLoading(true);

    const tasksCompletedList = [
      ...completedTaskIds.map((id) => tasks.find((t) => t.id === id)?.title || ""),
      ...otherCompleted.split("\n").filter(Boolean),
    ].filter(Boolean);

    const tasksInProgressList = inProgressTaskIds
      .map((id) => tasks.find((t) => t.id === id)?.title || "")
      .filter(Boolean);

    const reportData = {
      user_id: userId,
      report_date: new Date().toISOString().split("T")[0],
      tasks_completed: tasksCompletedList,
      tasks_in_progress: tasksInProgressList,
      blockers: blockers || null,
      learnings: learnings || null,
      mood,
      hours_worked: parseFloat(hoursWorked) || 8,
      status,
      submitted_at: status === "submitted" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    // Use Server Action instead of client-side upsert
    const response = await saveDailyReport({
      id: reportId,
      ...reportData
    });

    if (!response.success) {
      console.error("Report operation error:", response.error);
      toast.error(response.error || "Failed to save report");
      setLoading(false);
      return;
    }

    if (response.data) {
      setReportId(response.data.id);
    }

    toast.success(
      status === "submitted"
        ? "Report submitted successfully!"
        : "Draft saved successfully"
    );
    router.push("/dashboard/reports");
    router.refresh();
  };

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit("submitted");
      }}
    >
      <div className="space-y-6">
        {/* Mood Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How was your day?</CardTitle>
            <CardDescription>
              Let us know how you're feeling about today's work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={mood}
              onValueChange={(v) => setMood(v as ReportMood)}
              className="flex flex-wrap gap-4"
            >
              {moodOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    {option.icon}
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Tasks Completed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks Completed</CardTitle>
            <CardDescription>
              Select tasks you completed today or add additional items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedTasks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">From your task list:</Label>
                {completedTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`completed-${task.id}`}
                      checked={completedTaskIds.includes(task.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCompletedTaskIds([...completedTaskIds, task.id]);
                        } else {
                          setCompletedTaskIds(
                            completedTaskIds.filter((id) => id !== task.id)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`completed-${task.id}`}
                      className="cursor-pointer text-sm"
                    >
                      {task.title}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="otherCompleted">Other completed tasks:</Label>
              <Textarea
                id="otherCompleted"
                value={otherCompleted}
                onChange={(e) => setOtherCompleted(e.target.value)}
                placeholder="Enter each task on a new line..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tasks In Progress */}
        {pendingTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tasks In Progress</CardTitle>
              <CardDescription>
                What tasks are you currently working on?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`progress-${task.id}`}
                      checked={inProgressTaskIds.includes(task.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setInProgressTaskIds([...inProgressTaskIds, task.id]);
                        } else {
                          setInProgressTaskIds(
                            inProgressTaskIds.filter((id) => id !== task.id)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`progress-${task.id}`}
                      className="cursor-pointer text-sm"
                    >
                      {task.title}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blockers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blockers</CardTitle>
            <CardDescription>
              Any obstacles or challenges preventing progress?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Describe any blockers you're facing..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Learnings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Learnings</CardTitle>
            <CardDescription>
              What did you learn or discover today?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              placeholder="Share your learnings and insights..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Hours Worked */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hours Worked</CardTitle>
            <CardDescription>
              How many hours did you work today?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              className="w-24"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </div>
      </div>
    </form>
  );
}
