"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAbly } from "@/providers/ably-provider";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CertificatePreview } from "./certificate-preview";
import { Search, Trophy, Download, Smartphone, Share2, Filter } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AdminCertificatesListProps {
    initialCertificates: any[];
}

export function AdminCertificatesList({ initialCertificates }: AdminCertificatesListProps) {
    const router = useRouter();
    const { client } = useAbly();
    const [certificates, setCertificates] = useState(initialCertificates);
    const [searchQuery, setSearchQuery] = useState("");

    // Sync state with server props
    useEffect(() => {
        setCertificates(initialCertificates);
    }, [initialCertificates]);

    // Real-time updates
    useEffect(() => {
        if (!client) return;

        const channel = client.channels.get("global-updates");

        const handleCertificateIssued = () => {
            toast.success("New certificate issued!", {
                description: "Refreshing list...",
                icon: <Trophy className="h-4 w-4 text-amber-500" />,
            });
            router.refresh();
        };

        channel.subscribe("certificate-issued", handleCertificateIssued);

        return () => {
            channel.unsubscribe("certificate-issued", handleCertificateIssued);
        };
    }, [client, router]);

    // Filter logic
    const filteredCertificates = certificates.filter((cert) => {
        const query = searchQuery.toLowerCase();
        return (
            cert.intern_name?.toLowerCase().includes(query) ||
            cert.course_title?.toLowerCase().includes(query) ||
            cert.certificate_id?.toLowerCase().includes(query) ||
            cert.profiles?.email?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by intern, course, or ID..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1">
                        Total: {filteredCertificates.length}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => router.refresh()}>
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[250px]">Intern</TableHead>
                            <TableHead className="w-[200px]">Course</TableHead>
                            <TableHead>Issued Date</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCertificates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No certificates found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCertificates.map((cert) => (
                                <TableRow key={cert.id} className="group hover:bg-muted/5">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border">
                                                <AvatarImage src={cert.profiles?.avatar_url} />
                                                <AvatarFallback className="text-xs">
                                                    {cert.intern_name?.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{cert.intern_name}</span>
                                                <span className="text-xs text-muted-foreground">{cert.profiles?.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm line-clamp-1" title={cert.course_title}>
                                                {cert.course_title}
                                            </span>
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {cert.certificate_id}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(cert.completion_date).toLocaleDateString()}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {cert.final_score ? (
                                            <Badge variant="outline" className={cert.final_score >= 90 ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                                                {cert.final_score}%
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={cert.is_valid ? "default" : "destructive"}
                                            className={cert.is_valid ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200 shadow-none" : ""}
                                        >
                                            {cert.is_valid ? "Valid" : "Revoked"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <CertificatePreview certificate={cert} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
