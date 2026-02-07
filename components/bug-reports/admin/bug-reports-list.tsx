"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Filter,
    Eye,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ExternalLink,
    User,
    ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { updateBugReportStatus } from "@/actions/bug-reports";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BugReportsListProps {
    initialReports: any[];
}

export function BugReportsList({ initialReports }: BugReportsListProps) {
    const [reports, setReports] = useState(initialReports);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const filteredReports = reports.filter(r => {
        const matchesSearch = r.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleStatusUpdate = async (reportId: string, newStatus: any) => {
        setUpdatingStatus(true);
        try {
            await updateBugReportStatus(reportId, newStatus);
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
            if (selectedReport?.id === reportId) {
                setSelectedReport({ ...selectedReport, status: newStatus });
            }
            toast.success(`Status updated to ${newStatus}`);
        } catch (error: any) {
            toast.error("Failed to update: " + error.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-3 w-3" />;
            case 'reviewed': return <Filter className="h-3 w-3" />;
            case 'fixed': return <CheckCircle2 className="h-3 w-3" />;
            default: return <AlertCircle className="h-3 w-3" />;
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'pending': return "secondary";
            case 'reviewed': return "outline";
            case 'fixed': return "default";
            default: return "secondary";
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search reports or interns..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={statusFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("all")}
                    >
                        All
                    </Button>
                    <Button
                        variant={statusFilter === "pending" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("pending")}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={statusFilter === "reviewed" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("reviewed")}
                    >
                        Reviewed
                    </Button>
                    <Button
                        variant={statusFilter === "fixed" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("fixed")}
                        className={cn(statusFilter === "fixed" && "bg-green-600 hover:bg-green-700")}
                    >
                        Fixed
                    </Button>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Intern</TableHead>
                            <TableHead className="w-[400px]">Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredReports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No reports found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredReports.map((report) => (
                                <TableRow key={report.id} className="group cursor-pointer" onClick={() => setSelectedReport(report)}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={report.profile.avatar_url} />
                                                <AvatarFallback>{report.profile.full_name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{report.profile.full_name}</span>
                                                <span className="text-[10px] text-muted-foreground">{report.profile.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="line-clamp-1 text-sm text-muted-foreground">{report.description}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(report.status)} className="gap-1 capitalize">
                                            {getStatusIcon(report.status)}
                                            {report.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(report.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Sheet open={!!selectedReport} onOpenChange={(val) => !val && setSelectedReport(null)}>
                <SheetContent className="sm:max-w-2xl overflow-y-auto bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl p-0 gap-0">
                    {selectedReport && (
                        <div className="flex flex-col h-full">
                            {/* Premium Header with Gradient Background */}
                            <div className="relative bg-gradient-to-b from-muted/50 to-background p-6 border-b border-border/50">
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className="relative">
                                            <Avatar className="h-16 w-16 border-2 border-background shadow-lg ring-2 ring-border/20">
                                                <AvatarImage src={selectedReport.profile.avatar_url} />
                                                <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                                                    {selectedReport.profile.full_name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
                                                <Badge variant={getStatusVariant(selectedReport.status)} className="h-5 px-1.5 text-[10px] uppercase tracking-wider font-bold border-0 shadow-sm">
                                                    {selectedReport.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-1 pt-1">
                                            <SheetTitle className="text-2xl font-bold tracking-tight">
                                                {selectedReport.profile.full_name}
                                            </SheetTitle>
                                            <SheetDescription className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <span className="bg-primary/5 px-2 py-0.5 rounded text-xs text-primary/80">
                                                    {selectedReport.profile.email}
                                                </span>
                                            </SheetDescription>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border/50">
                                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                                            <Calendar className="h-3.5 w-3.5 text-primary/70" />
                                            Reported Date
                                        </span>
                                        <span>{format(new Date(selectedReport.created_at), "PPP")}</span>
                                        <span className="text-[10px] opacity-70">{format(new Date(selectedReport.created_at), "p")}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-8 flex-1">
                                {/* Issue Description */}
                                <section className="space-y-3">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-primary" />
                                        Issue Description
                                    </h4>
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                                        <div className="relative bg-card p-5 rounded-xl text-sm leading-relaxed border border-border/50 shadow-sm">
                                            <span className="text-4xl absolute -top-3 -left-2 text-primary/10 font-serif">"</span>
                                            <p className="relative z-10 text-foreground/90 font-medium">
                                                {selectedReport.description}
                                            </p>
                                            <span className="text-4xl absolute -bottom-6 -right-1 text-primary/10 font-serif leading-none">"</span>
                                        </div>
                                    </div>
                                </section>

                                {/* Screenshots */}
                                {selectedReport.screenshot_urls?.length > 0 && (
                                    <section className="space-y-4">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-primary" />
                                            Attached Screenshots <span className="text-xs font-normal text-muted-foreground normal-case bg-muted px-2 py-0.5 rounded-full">{selectedReport.screenshot_urls.length}</span>
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedReport.screenshot_urls.map((url: string, i: number) => (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative aspect-video rounded-xl overflow-hidden border border-border/50 bg-muted/20 shadow-sm hover:shadow-md transition-all hover:ring-2 hover:ring-primary/50"
                                                >
                                                    <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white backdrop-blur-sm">
                                                        <ExternalLink className="h-6 w-6" />
                                                        <span className="text-xs font-medium">View Fullsize</span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Update Status */}
                                <section className="space-y-4 pt-4 border-t border-border/50 border-dashed">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        Action Required
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            size="default"
                                            variant={selectedReport.status === 'pending' ? 'secondary' : 'outline'}
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusUpdate(selectedReport.id, 'pending')}
                                            className={cn("gap-2 flex-1 h-11 border-dashed transition-all", selectedReport.status === 'pending' && "bg-secondary border-solid font-medium")}
                                        >
                                            <Clock className="h-4 w-4" />
                                            Mark Pending
                                        </Button>
                                        <Button
                                            size="default"
                                            variant={selectedReport.status === 'reviewed' ? 'secondary' : 'outline'}
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusUpdate(selectedReport.id, 'reviewed')}
                                            className={cn("gap-2 flex-1 h-11 border-dashed transition-all", selectedReport.status === 'reviewed' && "bg-blue-500/10 text-blue-600 border-blue-200 border-solid font-medium hover:bg-blue-500/20")}
                                        >
                                            <Filter className="h-4 w-4" />
                                            Mark Reviewed
                                        </Button>
                                        <Button
                                            size="default"
                                            variant={selectedReport.status === 'fixed' ? 'default' : 'outline'}
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusUpdate(selectedReport.id, 'fixed')}
                                            className={cn("gap-2 flex-1 h-11 transition-all shadow-sm", selectedReport.status === 'fixed'
                                                ? "bg-green-600 hover:bg-green-700 text-white font-bold ring-2 ring-green-600/20 ring-offset-2"
                                                : "hover:border-green-500/50 hover:text-green-600 hover:bg-green-500/5 border-dashed")}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Mark Resolved
                                        </Button>
                                    </div>
                                </section>
                            </div>

                            <div className="p-4 bg-muted/20 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between items-center">
                                <span className="font-mono opacity-50">ID: {selectedReport.id}</span>
                                <span className="flex items-center gap-1 opacity-70">
                                    <ShieldCheck className="h-3 w-3" />
                                    Secure Report
                                </span>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
