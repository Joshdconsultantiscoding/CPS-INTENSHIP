"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EventsWidget } from "@/components/dashboard/events-widget";
import type { Profile, Task, DailyReport, Notification, CalendarEvent } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  MessageSquare,
  Trophy,
  Flame,
  FileText,
  ArrowRight,
  Bell,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePortalSettings } from "@/hooks/use-portal-settings";

interface InternDashboardProps {
  profile: Profile | null;
  tasks: Task[];
  reports: DailyReport[];
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  unreadMessages: number;
  notifications: Notification[];
  events: CalendarEvent[];
}

export function InternDashboard({
  profile,
  tasks = [],
  reports = [],
  completedTasks = 0,
  pendingTasks = 0,
  overdueTasks = 0,
  unreadMessages = 0,
  notifications = [],
  events = [],
}: InternDashboardProps) {
  const { settings } = usePortalSettings();
  // No longer blocking initial render with mounted state for speed-of-light performance

  const totalTasks = completedTasks + pendingTasks + overdueTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const upcomingTasks = tasks
    .filter((t) => t.status !== "completed")
    .slice(0, 5);

  const todayReport = reports.find(
    (r) =>
      new Date(r.report_date).toDateString() === new Date().toDateString()
  );

  // Removed blocking mounted check

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section - Mobile Optimized */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-sm text-muted-foreground">
            {"Here's what's happening today."}
          </p>
        </div>
        {!todayReport && settings.reports_enabled && (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/reports/new">
              <Plus className="mr-2 h-4 w-4" />
              Submit Daily Report
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Grid - Mobile: 2 cols, Desktop: 4 cols */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {settings.tasks_enabled && (
          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-0 pt-2 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{completedTasks}</div>
              <Progress value={completionRate} className="mt-2 h-1.5 sm:h-2" />
              <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">
                {completionRate}% done
              </p>
            </CardContent>
          </Card>
        )}
        {settings.tasks_enabled && (
          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-0 pt-2 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{pendingTasks}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {overdueTasks > 0 ? (
                  <span className="text-destructive">{overdueTasks} overdue</span>
                ) : (
                  "On track"
                )}
              </p>
            </CardContent>
          </Card>
        )}
        {settings.rewards_enabled && (
          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Points</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-0 pt-2 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{profile?.total_points || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Keep earning!
              </p>
            </CardContent>
          </Card>
        )}
        {settings.reports_enabled && (
          <Card className="p-3 sm:p-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Streak</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent className="p-0 pt-2 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{profile?.current_streak || 0}d</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Best: {profile?.longest_streak || 0}d
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Events Widget - New Addition */}
      {settings.calendar_enabled && (
        <EventsWidget events={events} />
      )}

      {/* Quick Stats - Mobile Only */}
      <Card className="sm:hidden">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-2">
            {settings.messages_enabled && (
              <Link href="/dashboard/messages" className="flex-1">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">Messages</span>
                  {unreadMessages > 0 && (
                    <Badge variant="default" className="ml-auto h-5 w-5 p-0 justify-center text-[10px]">
                      {unreadMessages}
                    </Badge>
                  )}
                </div>
              </Link>
            )}
            <Link href="/dashboard/notifications" className="flex-1">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs">Alerts</span>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <Badge variant="default" className="ml-auto h-5 w-5 p-0 justify-center text-[10px]">
                    {notifications.filter(n => !n.is_read).length}
                  </Badge>
                )}
              </div>
            </Link>
            {settings.reports_enabled && (
              <div className="flex-1">
                <div className={`flex items-center gap-2 p-2 rounded-lg ${todayReport ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                  <FileText className={`h-4 w-4 ${todayReport ? 'text-green-600' : 'text-destructive'}`} />
                  <span className="text-xs">{todayReport ? 'Done' : 'Report'}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Upcoming Tasks */}
        {settings.tasks_enabled && (
          <Card className="lg:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6">
              <div>
                <CardTitle className="text-base sm:text-lg">Upcoming Tasks</CardTitle>
                <CardDescription className="text-xs sm:text-sm hidden sm:block">
                  Pending tasks by due date
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-8 px-2 sm:px-3">
                <Link href="/dashboard/tasks">
                  <span className="hidden sm:inline">View all</span>
                  <ArrowRight className="h-4 w-4 sm:ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              {upcomingTasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No pending tasks. Great job!
                </p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {upcomingTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/dashboard/tasks?id=${task.id}`}
                      className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3 hover:bg-muted/50 transition-colors active:scale-[0.99]"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium text-sm leading-none truncate pr-2">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <Badge
                            variant={
                              task.priority === "urgent"
                                ? "destructive"
                                : task.priority === "high"
                                  ? "default"
                                  : "secondary"
                            }
                            className="text-[10px] sm:text-xs px-1.5 py-0"
                          >
                            {task.priority}
                          </Badge>
                          {task.due_date && (
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(task.due_date), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={task.status === "in_progress" ? "outline" : "secondary"}
                        className="text-[10px] sm:text-xs shrink-0"
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Right Column - Hidden on mobile, shown in quick stats */}
        <div className="hidden sm:block space-y-4 lg:col-span-3">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.messages_enabled && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Unread Messages</span>
                  </div>
                  <Badge variant={unreadMessages > 0 ? "default" : "secondary"}>
                    {unreadMessages}
                  </Badge>
                </div>
              )}
              {settings.reports_enabled && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{"Today's Report"}</span>
                  </div>
                  <Badge variant={todayReport ? "outline" : "destructive"}>
                    {todayReport ? "Submitted" : "Pending"}
                  </Badge>
                </div>
              )}
              {settings.tasks_enabled && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Overdue Tasks</span>
                  </div>
                  <Badge variant={overdueTasks > 0 ? "destructive" : "secondary"}>
                    {overdueTasks}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Notifications</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </p>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-2 rounded-lg border p-2"
                    >
                      <Bell className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
