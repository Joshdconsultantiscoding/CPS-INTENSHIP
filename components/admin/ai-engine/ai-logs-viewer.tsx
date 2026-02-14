"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ScrollText,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Bot,
    FileText,
    AlertTriangle,
    BookOpen,
    Zap,
    Shield,
} from "lucide-react";

interface LogEntry {
    id: string;
    action_type: string;
    input_summary: string;
    output_summary: string;
    authority_layers_used: string[];
    intern_id: string | null;
    is_autonomous: boolean;
    model_used: string;
    token_count: number;
    created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    chat_response: { label: "Chat", icon: <Bot className="h-3 w-3" />, color: "bg-blue-500" },
    document_analysis: { label: "Analysis", icon: <FileText className="h-3 w-3" />, color: "bg-green-500" },
    warning_issued: { label: "Warning", icon: <AlertTriangle className="h-3 w-3" />, color: "bg-amber-500" },
    course_generated: { label: "Course", icon: <BookOpen className="h-3 w-3" />, color: "bg-purple-500" },
    autonomous_decision: { label: "Autonomous", icon: <Zap className="h-3 w-3" />, color: "bg-red-500" },
    enforcement_action: { label: "Enforcement", icon: <Shield className="h-3 w-3" />, color: "bg-orange-500" },
    submission_review: { label: "Review", icon: <FileText className="h-3 w-3" />, color: "bg-teal-500" },
    escalation: { label: "Escalation", icon: <AlertTriangle className="h-3 w-3" />, color: "bg-red-600" },
};

export default function AILogsViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState("all");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "15" });
            if (filter !== "all") params.append("action_type", filter);

            const res = await fetch(`/api/ai/logs?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
            }
        } catch (e) {
            console.error("Failed to fetch logs:", e);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    function formatDate(iso: string) {
        return new Date(iso).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <ScrollText className="h-5 w-5" />
                            AI Decision Logs
                        </CardTitle>
                        <CardDescription>{total} total decisions logged</CardDescription>
                    </div>
                    <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="chat_response">Chat</SelectItem>
                            <SelectItem value="document_analysis">Analysis</SelectItem>
                            <SelectItem value="warning_issued">Warnings</SelectItem>
                            <SelectItem value="course_generated">Courses</SelectItem>
                            <SelectItem value="autonomous_decision">Autonomous</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <ScrollText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p>No decision logs yet</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[500px]">
                        <div className="space-y-2">
                            {logs.map((log) => {
                                const actionInfo = ACTION_LABELS[log.action_type] || {
                                    label: log.action_type,
                                    icon: <Bot className="h-3 w-3" />,
                                    color: "bg-gray-500",
                                };

                                return (
                                    <div key={log.id} className="border rounded-lg p-3 text-sm space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge className={`${actionInfo.color} text-white text-[10px] gap-1`}>
                                                    {actionInfo.icon}
                                                    {actionInfo.label}
                                                </Badge>
                                                {log.is_autonomous && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        <Zap className="h-2.5 w-2.5 mr-0.5" />Auto
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                        {log.input_summary && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                <span className="font-medium">In:</span> {log.input_summary}
                                            </p>
                                        )}
                                        {log.output_summary && (
                                            <p className="text-xs truncate">
                                                <span className="font-medium">Out:</span> {log.output_summary}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {log.authority_layers_used?.map((layer, i) => (
                                                <span key={i} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    {layer}
                                                </span>
                                            ))}
                                            {log.token_count > 0 && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {log.token_count} tokens
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft className="h-4 w-4 mr-1" />Prev
                        </Button>
                        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                            Next<ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
