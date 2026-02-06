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
    User
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
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    {selectedReport && (
                        <div className="space-y-8">
                            <SheetHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={selectedReport.profile.avatar_url} />
                                        <AvatarFallback>{selectedReport.profile.full_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="text-left">
                                        <SheetTitle className="text-xl">{selectedReport.profile.full_name}</SheetTitle>
                                        <SheetDescription>{selectedReport.profile.email}</SheetDescription>
                                    </div>
                                    <div className="ml-auto">
                                        <Badge variant={getStatusVariant(selectedReport.status)} className="capitalize py-1 px-3">
                                            {selectedReport.status}
                                        </Badge>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="space-y-6">
                                <section className="space-y-3">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                                        <AlertCircle className="h-4 w-4" />
                                        Issue Description
                                    </h4>
                                    <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed border border-muted italic">
                                        "{selectedReport.description}"
                                    </div>
                                </section>

                                {selectedReport.screenshot_urls?.length > 0 && (
                                    <section className="space-y-3">
                                        <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                                            <Calendar className="h-4 w-4" />
                                            Attached Screenshots ({selectedReport.screenshot_urls.length})
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedReport.screenshot_urls.map((url: string, i: number) => (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="relative aspect-video rounded-lg overflow-hidden border border-muted hover:ring-2 hover:ring-primary transition-all group"
                                                >
                                                    <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ExternalLink className="h-6 w-6 text-white" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <section className="space-y-3 pt-4 border-t">
                                    <h4 className="text-sm font-semibold">Update Status</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant={selectedReport.status === 'pending' ? 'secondary' : 'outline'}
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusUpdate(selectedReport.id, 'pending')}
                                            className="gap-1.5"
                                        >
                                            <Clock className="h-3.5 w-3.5" />
                                            Set to Pending
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={selectedReport.status === 'reviewed' ? 'secondary' : 'outline'}
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusUpdate(selectedReport.id, 'reviewed')}
                                            className="gap-1.5"
                                        >
                                            <Filter className="h-3.5 w-3.5" />
                                            Mark Reviewed
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={selectedReport.status === 'fixed' ? 'default' : 'outline'}
                                            disabled={updatingStatus}
                                            onClick={() => handleStatusUpdate(selectedReport.id, 'fixed')}
                                            className={cn("gap-1.5", selectedReport.status === 'fixed' && "bg-green-600 hover:bg-green-700")}
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Mark as Fixed
                                        </Button>
                                    </div>
                                </section>
                            </div>

                            <div className="pt-8 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Report ID: {selectedReport.id}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Reported {format(new Date(selectedReport.created_at), "PPP p")}
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
