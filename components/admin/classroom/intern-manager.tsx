"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { assignInternToClass } from "@/actions/classroom-admin";

interface InternManagerProps {
    interns: any[];
    classes: any[];
}

export function InternManager({ interns, classes }: InternManagerProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [selectedIntern, setSelectedIntern] = useState<any>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [open, setOpen] = useState(false);

    const handleOpenAssign = (intern: any) => {
        setSelectedIntern(intern);
        setSelectedClassId(""); // Reset selection
        setOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedIntern || !selectedClassId) return;

        setIsAssigning(true);
        try {
            console.log("Assigning intern:", selectedIntern.id, "to class:", selectedClassId);
            const result = await assignInternToClass(selectedClassId, selectedIntern.id);
            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });
                setOpen(false);
                router.refresh();
            } else {
                toast({
                    variant: "destructive",
                    title: "Assignment Failed",
                    description: result.message,
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to assign intern.",
            });
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Intern</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {interns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No interns found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            interns.map((intern) => (
                                <TableRow key={intern.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={intern.avatar_url || ""} />
                                            <AvatarFallback>{intern.full_name?.charAt(0) || "?"}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{intern.full_name}</span>
                                    </TableCell>
                                    <TableCell>{intern.email}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleOpenAssign(intern)}>
                                            Assign Class
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Class to {selectedIntern?.full_name}</DialogTitle>
                        <DialogDescription>
                            Select a class to enroll this intern in. They will immediately gain access.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Select Class</label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a class..." />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleAssign} disabled={isAssigning || !selectedClassId}>
                            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Assignment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
