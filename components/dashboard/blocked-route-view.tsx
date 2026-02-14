"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, HelpCircle } from "lucide-react";
import Link from "next/link";
import { AppealForm } from "@/components/appeals/appeal-form";

interface BlockedRouteViewProps {
    reason: string;
    route: string;
    routeName: string;
}

export function BlockedRouteView({ reason, route, routeName }: BlockedRouteViewProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4">
            <Card className="max-w-2xl w-full border-red-100 dark:border-red-900/30 overflow-hidden shadow-lg">
                <CardHeader className="bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl text-red-900 dark:text-red-100">Access Restricted</CardTitle>
                            <CardDescription className="text-red-700/70 dark:text-red-400/70">
                                You do not have permission to view {routeName}.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Reason Section */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Reason provided by Admin</h4>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 italic text-slate-700 dark:text-slate-300">
                            "{reason || "No specific reason provided."}"
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-1">
                        {/* Appeal Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-primary" />
                                <h4 className="font-medium">Think this is a mistake?</h4>
                            </div>
                            <AppealForm
                                type="route_block"
                                targetRoute={route}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t flex justify-center">
                        <Button variant="ghost" asChild>
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
