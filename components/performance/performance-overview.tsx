"use client";

import { useState, useEffect, useCallback } from "react";
import type { Profile, PerformanceScore, DailyReport } from "@/lib/types";
import { useAbly } from "@/providers/ably-provider";
import { getInternPerformanceData } from "@/app/actions/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Trophy,
  Flame,
  Target,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import { format, subDays } from "date-fns";

interface PerformanceOverviewProps {
  profile: Profile | null;
  scores: PerformanceScore[];
  tasks: { status: string; completed_at: string | null; created_at: string; points: number }[];
  reports: DailyReport[];
  completedTasks: number;
  totalTasks: number;
  totalPoints: number;
  submittedReports: number;
  userId: string; // Added for real-time refetch
}

export function PerformanceOverview({
  profile: initialProfile,
  scores: initialScores,
  tasks: initialTasks,
  reports: initialReports,
  completedTasks: initialCompletedTasks,
  totalTasks: initialTotalTasks,
  totalPoints: initialTotalPoints,
  submittedReports: initialSubmittedReports,
  userId,
}: PerformanceOverviewProps) {
  // State for real-time updates
  const [profile, setProfile] = useState(initialProfile);
  const [scores, setScores] = useState(initialScores);
  const [tasks, setTasks] = useState(initialTasks);
  const [reports, setReports] = useState(initialReports);
  const [completedTasks, setCompletedTasks] = useState(initialCompletedTasks);
  const [totalTasks, setTotalTasks] = useState(initialTotalTasks);
  const [totalPoints, setTotalPoints] = useState(initialTotalPoints);
  const [submittedReports, setSubmittedReports] = useState(initialSubmittedReports);

  const { client, isConfigured } = useAbly();

  // Refetch data from server
  const refetchData = useCallback(async () => {
    try {
      const data = await getInternPerformanceData(userId);
      setProfile(data.profile);
      setScores(data.scores);
      setTasks(data.tasks);
      setReports(data.reports);
      setCompletedTasks(data.completedTasks);
      setTotalTasks(data.totalTasks);
      setTotalPoints(data.totalPoints);
      setSubmittedReports(data.submittedReports);
    } catch (error) {
      console.error("Failed to refetch performance data:", error);
    }
  }, [userId]);

  // Subscribe to real-time events
  useEffect(() => {
    if (!client || !isConfigured) return;

    const channel = client.channels.get("global-updates");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpdate = (message: any) => {
      // Refetch if the event is for this user or is a global event
      const targetUserId = message?.data?.userId || message?.data?.task?.assigned_to;
      if (!targetUserId || targetUserId === userId) {
        refetchData();
      }
    };

    channel.subscribe("task-created", handleUpdate);
    channel.subscribe("task-updated", handleUpdate);
    channel.subscribe("report-submitted", handleUpdate);
    channel.subscribe("report-updated", handleUpdate);
    channel.subscribe("profile-updated", handleUpdate);

    return () => {
      channel.unsubscribe();
    };
  }, [client, isConfigured, userId, refetchData]);

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Prepare chart data for tasks over time
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const completed = tasks.filter(
      (t) =>
        t.completed_at &&
        format(new Date(t.completed_at), "yyyy-MM-dd") === dateStr
    ).length;
    return {
      date: format(date, "EEE"),
      completed,
    };
  });

  // Prepare mood distribution - Normalize to lowercase for reliable mapping
  const moodCounts = reports.reduce(
    (acc, r) => {
      const mood = (r.mood || "neutral").toLowerCase();
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const moodData = [
    { mood: "Great", count: moodCounts.great || 0, fill: "url(#grad-great)" },
    { mood: "Good", count: moodCounts.good || 0, fill: "url(#grad-good)" },
    { mood: "Neutral", count: moodCounts.neutral || 0, fill: "url(#grad-neutral)" },
    { mood: "Challenging", count: moodCounts.challenging || 0, fill: "url(#grad-challenging)" },
    { mood: "Difficult", count: moodCounts.difficult || 0, fill: "url(#grad-difficult)" },
  ];

  // Calculate average hours worked
  const avgHours =
    reports.length > 0
      ? (reports.reduce((sum, r) => sum + r.hours_worked, 0) / reports.length).toFixed(1)
      : "0";

  const latestScore = scores[0];

  return (
    <div className="space-y-6">
      {/* Header with Live Indicator */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Performance Statistics</h2>
          <p className="text-sm text-muted-foreground">Detailed metrics and live growth tracking.</p>
        </div>
        {isConfigured && (
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-2 py-1 px-3 animate-in fade-in slide-in-from-right-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] uppercase tracking-widest font-black">Live Sync Active</span>
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/5 hover:border-primary/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.total_points || totalPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {completedTasks} completed tasks
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/5 hover:border-orange-500/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.current_streak || 0} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Best: {profile?.longest_streak || 0} days
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/5 hover:border-green-500/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-3 h-1.5" />
          </CardContent>
        </Card>
        <Card className="border-blue-500/5 hover:border-blue-500/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hours/Day</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHours}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {submittedReports} reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tasks Completed Chart */}
        <Card className="overflow-hidden border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Productivity Trend</CardTitle>
            <CardDescription>Task completion over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer
              config={{
                completed: {
                  label: "Completed",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickMargin={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="var(--color-primary)"
                    fill="url(#colorCompleted)"
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Mood Distribution Chart */}
        <Card className="overflow-hidden border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Mood Distribution</CardTitle>
            <CardDescription>Frequency of mood reports in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer
              config={{
                count: { label: "Reports" },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodData} layout="vertical" margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="grad-great" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="grad-good" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="grad-neutral" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="grad-challenging" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                    </linearGradient>
                    <linearGradient id="grad-difficult" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="mood"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={100}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Scores */}
      {scores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Reviews</CardTitle>
            <CardDescription>
              Feedback and scores from your supervisors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scores.slice(0, 3).map((score) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {format(new Date(score.period_start), "MMM d")} -{" "}
                      {format(new Date(score.period_end), "MMM d, yyyy")}
                    </p>
                    {score.notes && (
                      <p className="text-sm text-muted-foreground">
                        {score.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Reviewed by {score.scorer?.full_name || "Admin"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-chart-3 text-chart-3" />
                        <span className="text-2xl font-bold">
                          {score.overall_score}
                        </span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Overall Score
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Score Breakdown */}
      {latestScore && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Review Breakdown</CardTitle>
            <CardDescription>
              Detailed scores from your most recent performance review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Task Completion</span>
                  <span className="font-medium">
                    {latestScore.task_completion_rate}%
                  </span>
                </div>
                <Progress value={latestScore.task_completion_rate} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Report Submission</span>
                  <span className="font-medium">
                    {latestScore.report_submission_rate}%
                  </span>
                </div>
                <Progress value={latestScore.report_submission_rate} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Quality Score</span>
                  <span className="font-medium">{latestScore.quality_score}%</span>
                </div>
                <Progress value={latestScore.quality_score} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Communication</span>
                  <span className="font-medium">
                    {latestScore.communication_score}%
                  </span>
                </div>
                <Progress value={latestScore.communication_score} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
