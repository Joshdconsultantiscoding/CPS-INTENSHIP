"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    FileText,
    Award
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { CertificateIssuer } from "./certificate-issuer";

interface PerformanceDashboardProps {
    attempts: any[];
}

export function PerformanceDashboard({ attempts: initialAttempts }: PerformanceDashboardProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [attempts, setAttempts] = useState(initialAttempts);

    const filteredAttempts = attempts.filter(a =>
        a.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attempts.length}</div>
                        <p className="text-xs text-muted-foreground">Across all courses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {attempts.length > 0
                                ? Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Overall intern performance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {attempts.length > 0
                                ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Success percentage</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Real-time Results</CardTitle>
                    <CardDescription>Monitor intern assessment performance as it happens.</CardDescription>
                    <div className="relative max-w-sm mt-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search interns or courses..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Intern</TableHead>
                                <TableHead>Course / Item</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAttempts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No assessment records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAttempts.map((attempt) => (
                                    <TableRow key={attempt.id}>
                                        <TableCell>
                                            <div className="font-medium">{attempt.profile?.full_name}</div>
                                            <div className="text-xs text-muted-foreground">{attempt.profile?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{attempt.course?.title}</div>
                                            <div className="text-xs text-muted-foreground capitalize">{attempt.context_type} Assessment</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {attempt.context_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-lg font-bold">{attempt.score}%</div>
                                        </TableCell>
                                        <TableCell>
                                            {attempt.passed ? (
                                                <Badge className="bg-green-500 hover:bg-green-600">
                                                    <CheckCircle2 className="mr-1 h-3 w-3" /> PASSED
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    <XCircle className="mr-1 h-3 w-3" /> FAILED
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground flex items-center gap-1.5 pt-4">
                                            <Clock className="h-3 w-3" />
                                            {new Date(attempt.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {attempt.context_type === 'course' && attempt.passed && (
                                                    <CertificateIssuer
                                                        userId={attempt.user_id}
                                                        courseId={attempt.course_id}
                                                        internName={attempt.profile?.full_name}
                                                        courseTitle={attempt.course?.title}
                                                    />
                                                )}
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            View Answers
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Assessment Details: {attempt.profile?.full_name}</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-6 pt-4">
                                                            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                                                                <div>
                                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Course</p>
                                                                    <p className="font-semibold">{attempt.course?.title}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Result</p>
                                                                    <p className={`font-bold ${attempt.passed ? 'text-green-600' : 'text-destructive'}`}>
                                                                        {attempt.score}% - {attempt.passed ? 'PASSED' : 'FAILED'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <h4 className="font-bold text-sm underline decoration-primary/30 underline-offset-4">Submitted Responses</h4>
                                                                {Object.entries(attempt.answers || {}).map(([qId, answer]: [any, any]) => (
                                                                    <div key={qId} className="p-4 rounded-lg bg-muted/30 border">
                                                                        <p className="text-xs text-muted-foreground mb-2 italic">Question ID: {qId}</p>
                                                                        <p className="text-sm font-medium">{answer}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
