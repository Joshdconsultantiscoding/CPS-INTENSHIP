"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckCircle,
    ClipboardList,
    MessageSquare,
    Download,
    BarChart3,
    Award,
    BookOpen,
} from "lucide-react";
import type { Profile } from "@/lib/types/profile";
import Link from "next/link";

interface AdminProfileActionsProps {
    profile: Profile;
}

export function AdminProfileActions({ profile }: AdminProfileActionsProps) {
    return (
        <Card className="border-2 border-amber-500/30 shadow-lg bg-gradient-to-r from-amber-500/5 to-transparent">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                    <BarChart3 className="h-5 w-5" />
                    Admin Actions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                        variant="outline"
                        className="flex flex-col h-auto py-4 gap-2 hover:border-green-500 hover:text-green-500"
                    >
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-xs">Approve</span>
                    </Button>

                    <Link href={`/dashboard/tasks?assign=${profile.id}`}>
                        <Button
                            variant="outline"
                            className="w-full flex flex-col h-auto py-4 gap-2 hover:border-blue-500 hover:text-blue-500"
                        >
                            <ClipboardList className="h-5 w-5" />
                            <span className="text-xs">Assign Task</span>
                        </Button>
                    </Link>

                    <Link href={`/dashboard/messages?user=${profile.id}`}>
                        <Button
                            variant="outline"
                            className="w-full flex flex-col h-auto py-4 gap-2 hover:border-purple-500 hover:text-purple-500"
                        >
                            <MessageSquare className="h-5 w-5" />
                            <span className="text-xs">Message</span>
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        className="flex flex-col h-auto py-4 gap-2 hover:border-primary hover:text-primary"
                    >
                        <Download className="h-5 w-5" />
                        <span className="text-xs">Download CV</span>
                    </Button>
                </div>

                {/* Stats Summary */}
                <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-primary">
                            <Award className="h-4 w-4" />
                            <span className="text-xl font-bold">{profile.total_points || 0}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Points</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-500">
                            <BookOpen className="h-4 w-4" />
                            <span className="text-xl font-bold">0</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Courses</p>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-500">
                            <ClipboardList className="h-4 w-4" />
                            <span className="text-xl font-bold">0</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Tasks</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
