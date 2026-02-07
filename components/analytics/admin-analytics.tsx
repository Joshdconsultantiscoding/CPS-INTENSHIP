"use client";

import { useState, useEffect, useCallback } from "react";
import type { Profile, Task, DailyReport, PerformanceScore } from "@/lib/types";
import { useAbly } from "@/providers/ably-provider";
import { getAdminAnalyticsData } from "@/app/actions/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  CheckSquare,
  FileText,
  TrendingUp,
  Trophy,
  Clock,
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

interface AdminAnalyticsProps {
  interns: Profile[];
  tasks: (Task & { assignee?: { full_name: string | null } })[];
  reports: (DailyReport & { user?: { full_name: string | null } })[];
  performanceScores: (PerformanceScore & { user?: { full_name: string | null } })[];
}

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

export function AdminAnalytics({
  interns: initialInterns,
  tasks: initialTasks,
  reports: initialReports,
  performanceScores: initialPerformanceScores,
}: AdminAnalyticsProps) {
  // State for real-time updates
  const [interns, setInterns] = useState(initialInterns);
  const [tasks, setTasks] = useState(initialTasks);
  const [reports, setReports] = useState(initialReports);
  const [performanceScores, setPerformanceScores] = useState(initialPerformanceScores);

  const { client, isConfigured } = useAbly();

  // Refetch data from server
  const refetchData = useCallback(async () => {
    try {
      const data = await getAdminAnalyticsData();
      setInterns(data.interns);
      setTasks(data.tasks);
      setReports(data.reports);
      setPerformanceScores(data.performanceScores);
    } catch (error) {
      console.error("Failed to refetch admin analytics data:", error);
    }
  }, []);

  // Subscribe to real-time events
  useEffect(() => {
    if (!client || !isConfigured) return;

    const channel = client.channels.get("global-updates");

    const handleUpdate = () => {
      refetchData();
    };

    channel.subscribe("task-created", handleUpdate);
    channel.subscribe("task-updated", handleUpdate);
    channel.subscribe("report-submitted", handleUpdate);
    channel.subscribe("report-updated", handleUpdate);
    channel.subscribe("profile-updated", handleUpdate);

    return () => {
      channel.unsubscribe();
    };
  }, [client, isConfigured, refetchData]);

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < new Date()
  ).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const reviewedReports = reports.filter((r) => r.status === "reviewed").length;
  const pendingReports = reports.filter((r) => r.status === "submitted").length;

  // Task status distribution
  const taskStatusData = [
    { name: "Completed", value: completedTasks, fill: "url(#grad-completed)" },
    { name: "In Progress", value: tasks.filter((t) => t.status === "in_progress").length, fill: "url(#grad-inprogress)" },
    { name: "Pending", value: tasks.filter((t) => t.status === "pending").length, fill: "url(#grad-pending)" },
    { name: "Overdue", value: overdueTasks, fill: "url(#grad-overdue)" },
  ];

  // Reports over time (last 14 days)
  const reportsOverTime = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const count = reports.filter((r) => r.report_date === dateStr).length;
    return {
      date: format(date, "MMM d"),
      reports: count,
    };
  });

  // Top performers
  const topPerformers = [...interns]
    .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
    .slice(0, 5);

  // Average hours by intern
  const hoursByIntern = interns.map((intern) => {
    const internReports = reports.filter((r) => r.user_id === intern.id);
    const avgHours = internReports.length > 0
      ? internReports.reduce((sum, r) => sum + r.hours_worked, 0) / internReports.length
      : 0;
    return {
      name: intern.full_name?.split(" ")[0] || "Unknown",
      hours: parseFloat(avgHours.toFixed(1)),
      fill: "url(#grad-hours)"
    };
  }).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header with Live Indicator */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Admin Intelligence</h2>
          <p className="text-sm text-muted-foreground">Monitor real-time program performance and intern engagement.</p>
        </div>
        {isConfigured && (
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-2 py-1 px-3 animate-in fade-in slide-in-from-right-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] uppercase tracking-widest font-black">Real-time Stream</span>
          </Badge>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/5 hover:border-primary/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interns</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active in the program
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/5 hover:border-green-500/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCompletionRate}%</div>
            <Progress value={taskCompletionRate} className="mt-3 h-1.5" />
          </CardContent>
        </Card>
        <Card className="border-blue-500/5 hover:border-blue-500/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports (30d)</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingReports} pending review
            </p>
          </CardContent>
        </Card>
        <Card className="border-destructive/5 hover:border-destructive/20 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Task Distribution */}
        <Card className="overflow-hidden border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Task Health</CardTitle>
            <CardDescription>Breakdown of all program tasks by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Tasks" },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="grad-completed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="grad-inprogress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="grad-pending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="grad-overdue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {taskStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: item.fill }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reports Over Time */}
        <Card className="overflow-hidden border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Daily Submission Flow</CardTitle>
            <CardDescription>Reporting pipeline over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                reports: {
                  label: "Reports",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportsOverTime}>
                  <defs>
                    <linearGradient id="grad-reports" x1="0" y1="0" x2="0" y2="1">
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
                    interval={1}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    stroke="var(--color-primary)"
                    fill="url(#grad-reports)"
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performers */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Leaderboard</CardTitle>
            <CardDescription>Interns ranked by program points (all-time)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((intern, index) => (
                <div
                  key={intern.id}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted group-hover:bg-primary/20 group-hover:text-primary text-xs font-bold transition-colors">
                      {index + 1}
                    </span>
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                      <AvatarImage src={intern.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {intern.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold leading-none">{intern.full_name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black opacity-60">
                        {intern.department || "General"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-black text-primary">{intern.total_points || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Average Hours */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Resource Allocation</CardTitle>
            <CardDescription>Average productive hours per intern day</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                hours: {
                  label: "Average Hours",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursByIntern} layout="vertical" margin={{ left: -20 }}>
                  <defs>
                    <linearGradient id="grad-hours" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" domain={[0, 12]} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={80}
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Bar
                    dataKey="hours"
                    fill="url(#grad-hours)"
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
    </div>
  );
}
