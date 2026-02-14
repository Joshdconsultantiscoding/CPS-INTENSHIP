"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Filter,
    FileCheck,
    FileQuestion,
    CheckCircle,
    Clock,
    ExternalLink,
    RefreshCw,
    UserCircle,
    Download
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminCompliancePage() {
    const [interns, setInterns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [refreshing, setRefreshing] = useState(false);

    const fetchComplianceData = async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            // Join profiles with intern_documents
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id, 
                    full_name, 
                    email, 
                    avatar_url,
                    role,
                    documents_completed,
                    intern_documents (
                        learning_plan_url,
                        expectation_plan_url,
                        earning_plan_url,
                        internship_plan_url,
                        submission_status,
                        verified_by_admin,
                        updated_at,
                        knowledge_indexed
                    )
                `)
                .eq('role', 'intern')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setInterns(data || []);
        } catch (error: any) {
            toast.error("Failed to fetch compliance data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchComplianceData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchComplianceData();
    };

    const filteredInterns = interns.filter(intern => {
        const matchesSearch =
            intern.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            intern.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "complete" && intern.documents_completed) ||
            (statusFilter === "incomplete" && !intern.documents_completed);

        return matchesSearch && matchesStatus;
    });

    const DocStatus = ({ url, label }: { url: string | null, label: string }) => (
        <div className="flex items-center gap-1.5 min-w-[120px]">
            {url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-green-600 hover:text-green-700 transition-colors"
                    title={`View ${label}`}
                >
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">View</span>
                    <ExternalLink className="h-3 w-3" />
                </a>
            ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground/50">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Pending</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Intern Document Compliance</h1>
                    <p className="text-muted-foreground">
                        Track and verify mandatory document submissions for all interns.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Status Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Interns</SelectItem>
                            <SelectItem value="complete">Complete Only</SelectItem>
                            <SelectItem value="incomplete">Incomplete Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Intern</TableHead>
                            <TableHead>Learning Plan</TableHead>
                            <TableHead>Expectation</TableHead>
                            <TableHead>Earning</TableHead>
                            <TableHead>Comprehensive</TableHead>
                            <TableHead>Compliance</TableHead>
                            <TableHead>AI Indexed</TableHead>
                            <TableHead>Last Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 8 }).map((_, j) => (
                                        <TableCell key={j}><div className="h-4 w-full bg-muted animate-pulse rounded" /></TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : filteredInterns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                    No interns found matching the criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInterns.map((intern) => {
                                const docs = intern.intern_documents?.[0] || {};
                                return (
                                    <TableRow key={intern.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {intern.avatar_url ? (
                                                    <img src={intern.avatar_url} className="h-8 w-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <UserCircle className="h-5 w-5 text-primary" />
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{intern.full_name || 'Unnamed Intern'}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">{intern.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><DocStatus url={docs.learning_plan_url} label="Learning Plan" /></TableCell>
                                        <TableCell><DocStatus url={docs.expectation_plan_url} label="Expectation Plan" /></TableCell>
                                        <TableCell><DocStatus url={docs.earning_plan_url} label="Earning Plan" /></TableCell>
                                        <TableCell><DocStatus url={docs.internship_plan_url} label="Comprehensive Plan" /></TableCell>
                                        <TableCell>
                                            <Badge variant={intern.documents_completed ? "success" : "secondary"}>
                                                {intern.documents_completed ? "Complete" : "Incomplete"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {docs.knowledge_indexed ? (
                                                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                                    Yes
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {docs.updated_at ? format(new Date(docs.updated_at), 'MMM d, p') : 'Never'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
