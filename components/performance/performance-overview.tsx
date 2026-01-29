"use client";

import type { Profile, PerformanceScore, DailyReport } from "@/lib/types";
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
}

export function PerformanceOverview({
  profile,
  scores,
  tasks,
  reports,
  completedTasks,
  totalTasks,
  totalPoints,
  submittedReports,
}: PerformanceOverviewProps) {
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

  // Prepare mood distribution
  const moodCounts = reports.reduce(
    (acc, r) => {
      acc[r.mood] = (acc[r.mood] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const moodData = [
    { mood: "Great", count: moodCounts.great || 0, fill: "var(--color-chart-2)" },
    { mood: "Good", count: moodCounts.good || 0, fill: "var(--color-chart-1)" },
    { mood: "Neutral", count: moodCounts.neutral || 0, fill: "var(--color-muted)" },
    { mood: "Challenging", count: moodCounts.challenging || 0, fill: "var(--color-chart-3)" },
    { mood: "Difficult", count: moodCounts.difficult || 0, fill: "var(--color-chart-4)" },
  ];

  // Calculate average hours worked
  const avgHours =
    reports.length > 0
      ? (reports.reduce((sum, r) => sum + r.hours_worked, 0) / reports.length).toFixed(1)
      : "0";

  const latestScore = scores[0];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.total_points || totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              From {completedTasks} completed tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.current_streak || 0} days</div>
            <p className="text-xs text-muted-foreground">
              Best: {profile?.longest_streak || 0} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hours/Day</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHours}h</div>
            <p className="text-xs text-muted-foreground">
              Based on {submittedReports} reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tasks Completed Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks Completed</CardTitle>
            <CardDescription>Your task completion over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: {
                  label: "Completed",
                  color: "var(--color-primary)",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days}>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Mood Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Mood Distribution</CardTitle>
            <CardDescription>How you've been feeling during your internship</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Reports",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="mood"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={80}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={4} />
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
