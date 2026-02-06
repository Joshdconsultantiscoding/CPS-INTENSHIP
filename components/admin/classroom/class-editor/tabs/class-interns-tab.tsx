"use client";

import { useState } from "react";
import {
    Users,
    UserPlus,
    Search,
    Trash2,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { assignInternToClass, removeInternFromClass } from "@/actions/classroom-admin";


interface ClassInternsTabProps {
    classData: any;
    enrollments: any[];
    availableInterns: any[];
}

export function ClassInternsTab({ classData, enrollments, availableInterns }: ClassInternsTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAssigning, setIsAssigning] = useState<string | null>(null);


    // Filter available interns based on search (and exclude already enrolled)
    const enrolledIds = new Set(enrollments.map(e => e.user_id));
    const unassignedInterns = availableInterns.filter(i =>
        !enrolledIds.has(i.id) &&
        (i.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAssign = async (userId: string) => {
        setIsAssigning(userId);
        try {
            await assignInternToClass(classData.id, userId);
            toast.success("Intern assigned", {
                description: "The intern has been added to this class.",
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to assign intern", {
                description: "Please check your connection and try again.",
            });
        } finally {
            setIsAssigning(null);
        }
    };

    const handleRemove = async (userId: string) => {
        if (!confirm("Remove this intern from the class?")) return;

        try {
            await removeInternFromClass(classData.id, userId);
            toast.success("Intern removed", {
                description: "Enrollment has been cancelled.",
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove intern.");
        }

    };

    return (
        <div className="p-6 space-y-8">
            {/* Enrollment Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4 bg-muted/5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Total Interns</span>
                    </div>
                    <div className="text-2xl font-bold">{enrollments.length}</div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Active Enrollments */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Currently Enrolled</h3>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Intern</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrollments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                            No interns assigned yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    enrollments.map((enrollment) => (
                                        <TableRow key={enrollment.user_id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={enrollment.profiles?.avatar_url} />
                                                        <AvatarFallback>{enrollment.profiles?.full_name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{enrollment.profiles?.full_name}</span>
                                                        <span className="text-xs text-muted-foreground">{enrollment.profiles?.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleRemove(enrollment.user_id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Assignment Search */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Assign New Interns</h3>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search available interns..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="rounded-md border max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableBody>
                                {unassignedInterns.length === 0 ? (
                                    <TableRow>
                                        <TableCell className="h-24 text-center text-muted-foreground text-sm">
                                            {searchQuery ? "No matching interns found." : "All interns are assigned."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    unassignedInterns.map((intern) => (
                                        <TableRow key={intern.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={intern.avatar_url} />
                                                        <AvatarFallback>{intern.full_name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-foreground">{intern.full_name}</span>
                                                        <span className="text-xs text-muted-foreground">{intern.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAssign(intern.id)}
                                                    disabled={isAssigning === intern.id}
                                                >
                                                    {isAssigning === intern.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                    )}
                                                    Assign
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
