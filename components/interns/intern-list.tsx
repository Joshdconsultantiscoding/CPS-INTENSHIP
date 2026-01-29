"use client";

import type { Profile } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  Users,
  Search,
  Trophy,
  Flame,
  CheckSquare,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface InternListProps {
  interns: Profile[];
  tasksByIntern: Record<string, { total: number; completed: number }>;
}

export function InternList({ interns, tasksByIntern }: InternListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInterns = interns.filter(
    (intern) =>
      intern.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search interns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="secondary">
          <Users className="mr-1 h-3 w-3" />
          {interns.length} interns
        </Badge>
      </div>

      {/* Interns Table */}
      {filteredInterns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No interns found</h3>
            <p className="mt-2 text-center text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "No interns have signed up yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intern</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Start Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInterns.map((intern) => {
                const tasks = tasksByIntern[intern.id] || {
                  total: 0,
                  completed: 0,
                };
                const completionRate =
                  tasks.total > 0
                    ? Math.round((tasks.completed / tasks.total) * 100)
                    : 0;

                return (
                  <TableRow key={intern.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={intern.avatar_url || ""} />
                          <AvatarFallback>
                            {getInitials(intern.full_name, intern.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {intern.full_name || "No name"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {intern.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {intern.department || "Unassigned"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          {tasks.completed}/{tasks.total}
                        </div>
                        <Progress value={completionRate} className="h-1.5 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-chart-3" />
                        <span className="font-medium">
                          {intern.total_points || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-chart-4" />
                        <span>{intern.current_streak || 0} days</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {intern.start_date ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(intern.start_date), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not set
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
