"use client";

import type { Profile, Task, DailyReport, PerformanceScore } from "@/lib/types";
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
  interns,
  tasks,
  reports,
  performanceScores,
}: AdminAnalyticsProps) {
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
    { name: "Completed", value: completedTasks, fill: "var(--color-chart-2)" },
    { name: "In Progress", value: tasks.filter((t) => t.status === "in_progress").length, fill: "var(--color-chart-1)" },
    { name: "Pending", value: tasks.filter((t) => t.status === "pending").length, fill: "var(--color-chart-3)" },
    { name: "Overdue", value: overdueTasks, fill: "var(--color-chart-4)" },
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
    };
  }).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interns.length}</div>
            <p className="text-xs text-muted-foreground">
              Active in the program
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCompletionRate}%</div>
            <Progress value={taskCompletionRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports (30d)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingReports} pending review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Task Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Breakdown of all tasks by status</CardDescription>
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
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {taskStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reports Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Reports Trend</CardTitle>
            <CardDescription>Report submissions over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                reports: {
                  label: "Reports",
                  color: "var(--color-primary)",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportsOverTime}>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    interval={1}
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
                    dataKey="reports"
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
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Interns ranked by total points earned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((intern, index) => (
                <div
                  key={intern.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={intern.avatar_url || ""} />
                      <AvatarFallback>
                        {intern.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{intern.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {intern.department || "No department"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-chart-3" />
                    <span className="font-medium">{intern.total_points || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Average Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Average Daily Hours</CardTitle>
            <CardDescription>Average working hours per intern</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                hours: {
                  label: "Hours",
                  color: "var(--color-chart-2)",
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursByIntern} layout="vertical">
                  <XAxis type="number" domain={[0, 12]} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={60}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="hours"
                    fill="var(--color-chart-2)"
                    radius={4}
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
