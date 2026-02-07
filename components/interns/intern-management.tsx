"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  MoreVertical,
  Eye,
  Mail,
  MessageSquare,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  FileText,
  Activity,
  Wifi,
  WifiOff,
  Chrome,
  Facebook,
  Smartphone,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useRouter } from "next/navigation";
import { usePresence } from "ably/react";
import { useAbly, useOnlineUsers } from "@/providers/ably-provider";

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalReports: number;
  approvedReports: number;
  pendingReports: number;
  avgProductivity: number;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  department: string | null;
  phone: string | null;
  bio: string | null;
  start_date: string | null;
  end_date: string | null;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  online_status: string;
  last_seen_at: string | null;
  last_active_at: string | null;
  auth_provider: string | null;
  created_at: string;
  updated_at: string;
}

interface InternManagementProps {
  users: UserProfile[];
  userStats: Record<string, UserStats>;
  currentUserId: string;
}

// Helper to check if user was active recently (fallback when Ably presence is unavailable)
function isRecentlyActive(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  const lastActive = new Date(lastActiveAt).getTime();
  const now = Date.now();
  // Consider online if active within 90 seconds (allowing for heartbeat skew)
  return (now - lastActive) < 90000;
}

export function InternManagement({
  users: initialUsers,
  userStats,
  currentUserId,
}: InternManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [filter, setFilter] = useState<"all" | "online" | "offline" | "interns" | "admins">("all");

  // Use global online users context from Ably provider
  const ablyOnlineUsers = useOnlineUsers();
  const { isConfigured, client: ablyClient } = useAbly();
  const supabase = createClient();
  const router = useRouter();

  // HYBRID ONLINE DETECTION: Use Ably presence first, fall back to database last_active_at
  const isUserOnline = useCallback((user: UserProfile): boolean => {
    // 1. Check Ably real-time presence first (most accurate)
    if (ablyOnlineUsers.has(user.id)) {
      return true;
    }

    // 2. Fallback to database last_active_at (updated every 30 seconds by heartbeat)
    // This catches cases where Ably isn't configured or user's connection is delayed
    return isRecentlyActive(user.last_active_at);
  }, [ablyOnlineUsers]);

  // Presence is now handled by the AblyPresenceSync sub-component below
  // which is only rendered if Ably is configured.

  // Secondary subscription for profile data updates (names, points, etc.)
  // We use BOTH Supabase Realtime (if available) and Ably (for guaranteed delivery)
  useEffect(() => {
    // 1. Supabase Postgres Changes
    const profileSubscription = supabase
      .channel("profile-management-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === payload.new.id ? { ...u, ...payload.new } : u
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          // Handle new profile insertions from Supabase
          setUsers((prev) => {
            if (prev.find((u) => u.id === payload.new.id)) return prev;
            return [payload.new as UserProfile, ...prev];
          });
        }
      )
      .subscribe();

    // 2. Ably Global Updates (Bypasses RLS issues)
    let ablyChannel: any = null;
    if (ablyClient) {
      ablyChannel = ablyClient.channels.get("global-updates");

      // Listen for profile updates
      ablyChannel.subscribe("profile-updated", (message: any) => {
        const { userId, ...updates } = message.data;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, ...updates } : u
          )
        );
      });

      // CRITICAL: Listen for new intern signups (real-time admin sync)
      ablyChannel.subscribe("new-intern", (message: any) => {
        const newIntern = message.data;
        console.log("[InternManagement] New intern via Ably:", newIntern.id);
        setUsers((prev) => {
          // Prevent duplicates
          if (prev.find((u) => u.id === newIntern.id)) return prev;
          // Add to top of list
          return [{
            ...newIntern,
            role: newIntern.role || "intern",
            total_points: 0,
            current_streak: 0,
            longest_streak: 0,
            online_status: "online",
            last_seen_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
          } as UserProfile, ...prev];
        });
      });
    }

    return () => {
      profileSubscription.unsubscribe();
      if (ablyChannel) ablyChannel.unsubscribe();
    };
  }, [supabase, ablyClient]);

  // Filter users
  const filteredUsers = users.filter((user) => {
    const isActuallyOnline = isUserOnline(user);
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case "online":
        return isActuallyOnline;
      case "offline":
        return !isActuallyOnline;
      case "interns":
        return user.role === "intern";
      case "admins":
        return user.role === "admin";
      default:
        return true;
    }
  });

  // Stats
  const totalUsers = users.length;
  const onlineUsersCount = users.filter((u) => isUserOnline(u)).length;
  const totalInterns = users.filter((u) => u.role === "intern").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;

  const getAuthProviderIcon = (provider: string | null) => {
    switch (provider) {
      case "google":
        return <Chrome className="h-4 w-4 text-red-500" />;
      case "facebook":
        return <Facebook className="h-4 w-4 text-blue-600" />;
      case "tiktok":
        return <Smartphone className="h-4 w-4 text-black" />;
      default:
        return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getOnlineStatusBadge = (isOnline: boolean, lastSeen: string | null) => {
    if (isOnline) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Online
        </Badge>
      );
    }
    // Not online - show last seen time
    return (
      <Badge variant="secondary" className="text-muted-foreground">
        <span className="mr-1.5 h-2 w-2 rounded-full bg-gray-400" />
        {lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}` : "Offline"}
      </Badge>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="space-y-6">
      {/* AblyPresenceSync no longer needed - using global useOnlineUsers hook */}
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage all users in the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalInterns} interns, {totalAdmins} admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineUsersCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((onlineUsersCount / totalUsers) * 100) || 0}% of users active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers - onlineUsersCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently not active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => {
                const created = new Date(u.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return created > weekAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Joined in the last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or department..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "All" },
            { value: "online", label: "Online" },
            { value: "offline", label: "Offline" },
            { value: "interns", label: "Interns" },
            { value: "admins", label: "Admins" },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value as typeof filter)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[300px]">User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auth Method</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const stats = userStats[user.id];
                  const taskProgress = stats?.totalTasks
                    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                    : 0;

                  return (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>
                                {user.first_name?.[0] || user.full_name?.[0] || user.email[0].toUpperCase()}
                                {user.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            {isUserOnline(user) && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.first_name || user.last_name
                                ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                : user.full_name || "No name"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getOnlineStatusBadge(isUserOnline(user), user.last_seen_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAuthProviderIcon(user.auth_provider)}
                          <span className="text-sm capitalize">
                            {user.auth_provider || "Email"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === "admin" ? "default" : "secondary"}
                        >
                          {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span>{stats?.completedTasks || 0}/{stats?.totalTasks || 0}</span>
                            {stats?.overdueTasks ? (
                              <Badge variant="destructive" className="text-xs">
                                {stats.overdueTasks} overdue
                              </Badge>
                            ) : null}
                          </div>
                          <Progress value={taskProgress} className="h-1.5 w-20" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {stats?.approvedReports || 0}/{stats?.totalReports || 0}
                          {stats?.pendingReports ? (
                            <span className="text-muted-foreground ml-1">
                              ({stats.pendingReports} pending)
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{user.total_points || 0}</span>
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/messages?user=${user.id}`);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `mailto:${user.email}`;
                              }}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <UserX className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No users found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Profile</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={selectedUser.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {selectedUser.first_name?.[0] || selectedUser.full_name?.[0] || selectedUser.email[0].toUpperCase()}
                        {selectedUser.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {isUserOnline(selectedUser) && (
                      <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {selectedUser.first_name || selectedUser.last_name
                        ? `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim()
                        : selectedUser.full_name || "No name"}
                    </h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getOnlineStatusBadge(isUserOnline(selectedUser), selectedUser.last_seen_at)}
                      <Badge variant={selectedUser.role === "admin" ? "default" : "secondary"}>
                        {selectedUser.role}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getAuthProviderIcon(selectedUser.auth_provider)}
                        <span className="capitalize">{selectedUser.auth_provider || "Email"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                          <div className="text-2xl font-bold">
                            {userStats[selectedUser.id]?.completedTasks || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Tasks Done</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                          <div className="text-2xl font-bold">
                            {userStats[selectedUser.id]?.inProgressTasks || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">In Progress</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <FileText className="h-6 w-6 mx-auto text-primary mb-2" />
                          <div className="text-2xl font-bold">
                            {userStats[selectedUser.id]?.totalReports || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Reports</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <TrendingUp className="h-6 w-6 mx-auto text-green-500 mb-2" />
                          <div className="text-2xl font-bold">{selectedUser.total_points || 0}</div>
                          <div className="text-xs text-muted-foreground">Points</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Progress */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Task Completion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {userStats[selectedUser.id]?.totalTasks
                                ? Math.round(
                                  (userStats[selectedUser.id].completedTasks /
                                    userStats[selectedUser.id].totalTasks) *
                                  100
                                )
                                : 0}%
                            </span>
                          </div>
                          <Progress
                            value={
                              userStats[selectedUser.id]?.totalTasks
                                ? (userStats[selectedUser.id].completedTasks /
                                  userStats[selectedUser.id].totalTasks) *
                                100
                                : 0
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Streaks */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-orange-500" />
                            <div>
                              <div className="font-medium">{selectedUser.current_streak || 0} days</div>
                              <div className="text-xs text-muted-foreground">Current Streak</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <div>
                              <div className="font-medium">{selectedUser.longest_streak || 0} days</div>
                              <div className="text-xs text-muted-foreground">Longest Streak</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <div className="flex-1">
                              <div className="text-sm">Last seen</div>
                              <div className="text-xs text-muted-foreground">
                                {selectedUser.last_seen_at
                                  ? formatDate(selectedUser.last_seen_at)
                                  : "Never"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <div className="flex-1">
                              <div className="text-sm">Last active</div>
                              <div className="text-xs text-muted-foreground">
                                {selectedUser.last_active_at
                                  ? formatDate(selectedUser.last_active_at)
                                  : "Never"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <div className="flex-1">
                              <div className="text-sm">Account created</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(selectedUser.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">User ID</div>
                            <div className="text-sm font-mono truncate">{selectedUser.id}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Auth Method</div>
                            <div className="text-sm capitalize flex items-center gap-1">
                              {getAuthProviderIcon(selectedUser.auth_provider)}
                              {selectedUser.auth_provider || "Email"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Department</div>
                            <div className="text-sm">{selectedUser.department || "Not set"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Phone</div>
                            <div className="text-sm">{selectedUser.phone || "Not set"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Start Date</div>
                            <div className="text-sm">
                              {selectedUser.start_date
                                ? format(new Date(selectedUser.start_date), "MMM d, yyyy")
                                : "Not set"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">End Date</div>
                            <div className="text-sm">
                              {selectedUser.end_date
                                ? format(new Date(selectedUser.end_date), "MMM d, yyyy")
                                : "Not set"}
                            </div>
                          </div>
                        </div>
                        {selectedUser.bio && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Bio</div>
                            <div className="text-sm">{selectedUser.bio}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// AblyPresenceSync no longer needed - using global useOnlineUsers hook from ably-provider
