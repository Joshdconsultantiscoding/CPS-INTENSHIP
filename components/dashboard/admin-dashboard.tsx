"use client";

import Link from "next/link";
import type { DailyReport, ActivityLog } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  CheckSquare,
  FileText,
  TrendingUp,
  ArrowRight,
  Clock,
  Plus,
  Settings,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AdminDashboardProps {
  totalInterns: number;
  pendingReports: DailyReport[];
  completedTasks: number;
  pendingTasks: number;
  recentActivity: ActivityLog[];
}

export function AdminDashboard({
  totalInterns,
  pendingReports,
  completedTasks,
  pendingTasks,
  recentActivity,
}: AdminDashboardProps) {
  const totalTasks = completedTasks + pendingTasks;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section - Mobile Optimized */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your intern management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none bg-transparent">
            <Link href="/dashboard/reports">
              <FileText className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Review</span> Reports
              {pendingReports.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                  {pendingReports.length}
                </Badge>
              )}
            </Link>
          </Button>
          <Button size="sm" asChild className="flex-1 sm:flex-none">
            <Link href="/dashboard/tasks/new">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Assign</span> Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid - Mobile: 2 cols */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="p-3 sm:p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Interns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-0 pt-2 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalInterns}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Active
            </p>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-0 pt-2 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{pendingReports.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              To review
            </p>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-0 pt-2 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{completedTasks}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              of {totalTasks} tasks
            </p>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-0 pt-2 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{taskCompletionRate}%</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Mobile Only */}
      <Card className="sm:hidden">
        <CardContent className="p-3">
          <div className="grid grid-cols-4 gap-2">
            <Link href="/dashboard/interns" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px]">Interns</span>
            </Link>
            <Link href="/dashboard/messages" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px]">Messages</span>
            </Link>
            <Link href="/dashboard/analytics" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px]">Analytics</span>
            </Link>
            <Link href="/dashboard/admin/portal-settings" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px]">Settings</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Pending Reports */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6">
            <div>
              <CardTitle className="text-base sm:text-lg">Pending Reports</CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden sm:block">
                Daily reports awaiting review
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 px-2 sm:px-3">
              <Link href="/dashboard/reports">
                <span className="hidden sm:inline">View all</span>
                <ArrowRight className="h-4 w-4 sm:ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {pendingReports.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No pending reports
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {pendingReports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-lg border p-2.5 sm:p-3"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                        <AvatarImage src={report.user?.avatar_url || ""} />
                        <AvatarFallback className="text-xs">
                          {report.user?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-medium text-sm leading-none truncate">
                          {report.user?.full_name || "Unknown"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(report.report_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 hidden sm:flex">
                        <Clock className="mr-1 h-3 w-3" />
                        {report.hours_worked}h
                      </Badge>
                      <Badge className="text-[10px] sm:text-xs px-1.5">
                        {report.tasks_completed?.length || 0} tasks
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
            <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm hidden sm:block">
              Latest platform actions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentActivity.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                      <AvatarImage src={activity.user?.avatar_url || ""} />
                      <AvatarFallback className="text-xs">
                        {activity.user?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs sm:text-sm">
                        <span className="font-medium">
                          {activity.user?.full_name?.split(" ")[0] || "Someone"}
                        </span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
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
  );
}
