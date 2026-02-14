"use client";

import { useState } from "react";
import { Appeal } from "@/lib/services/appeals-service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Trash2, Clock, Ban, Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { reviewAppealAction } from "@/actions/appeals";
import { hardDeleteUserAction } from "@/actions/admin-controls";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AppealsManagementProps {
    appeals: any[]; // Using any because the join type is complex, but structurally it matches Appeal + user
}

export function AppealsManagement({ appeals }: AppealsManagementProps) {
    const [selectedAppeal, setSelectedAppeal] = useState<any | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | null>(null);
    const router = useRouter();

    const handleAction = async () => {
        if (!selectedAppeal || !actionType) return;
        setIsReviewing(true);

        try {
            if (actionType === 'delete') {
                // Hard Delete
                const result = await hardDeleteUserAction(selectedAppeal.user_id);
                if (result.success) {
                    toast.success("User permanently deleted.");
                    // Appeal is cascade deleted, no need to update status
                } else {
                    toast.error(result.error);
                }
            } else {
                // Approve or Reject
                const status = actionType === 'approve' ? 'approved' : 'rejected';
                const result = await reviewAppealAction(selectedAppeal.id, status, reviewNotes);
                if (result.success) {
                    toast.success(`Appeal ${status}.`);
                } else {
                    toast.error(result.error);
                }
            }

            router.refresh();
            setSelectedAppeal(null);
            setActionType(null);
            setReviewNotes("");
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setIsReviewing(false);
        }
    };

    const confirmAction = (appeal: any, type: 'approve' | 'reject' | 'delete') => {
        setSelectedAppeal(appeal);
        setActionType(type);
        setReviewNotes("");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
            case "rejected": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>;
            case "ignored": return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400">Ignored</Badge>;
            default: return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
        }
    };

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="px-0">
                <CardTitle>Appeal Requests</CardTitle>
                <CardDescription>Review and manage suspension appeals from users.</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Target Route</TableHead>
                            <TableHead>Appeal Date</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appeals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                    No appeals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            appeals.map((appeal) => (
                                <TableRow key={appeal.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={appeal.user?.avatar_url} />
                                                <AvatarFallback>{appeal.user?.full_name?.substring(0, 2) || "U"}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{appeal.user?.full_name}</span>
                                                <span className="text-xs text-slate-500">{appeal.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={appeal.appeal_type === 'route_block' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                                            {appeal.appeal_type === 'route_block' ? 'Route Block' : 'Suspension'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-mono text-slate-500">
                                        {appeal.target_route || "All Site Access"}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(appeal.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-[200px] truncate text-sm" title={appeal.reason}>
                                            {appeal.reason}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(appeal.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {appeal.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-900 dark:hover:bg-green-900/30"
                                                    onClick={() => confirmAction(appeal, 'approve')}
                                                    title="Approve & Restore"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-900 dark:hover:bg-amber-900/30"
                                                    onClick={() => confirmAction(appeal, 'reject')}
                                                    title="Reject & Keep Suspended"
                                                >
                                                    <Ban className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-900/30"
                                                    onClick={() => confirmAction(appeal, 'delete')}
                                                    title="Permanently Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        {appeal.status !== 'pending' && (
                                            <span className="text-xs text-slate-400 italic">
                                                Reviewed by admin
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={!!selectedAppeal} onOpenChange={(open) => !open && setSelectedAppeal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'approve' && (selectedAppeal?.appeal_type === 'route_block' ? "Unblock Access" : "Restore User Account")}
                            {actionType === 'reject' && "Reject Appeal"}
                            {actionType === 'delete' && "Permanently Delete User"}
                        </DialogTitle>
                        <DialogDescription>
                            Reviewing appeal from <strong>{selectedAppeal?.user?.full_name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 my-2">
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md border text-sm">
                            <span className="font-semibold block mb-1">User's Appeal {selectedAppeal?.appeal_type === 'route_block' ? `for ${selectedAppeal?.target_route}` : ''}:</span>
                            {selectedAppeal?.reason}
                        </div>

                        {actionType === 'delete' ? (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-md">
                                <p className="text-red-600 text-sm font-medium flex gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Warning: This action is irreversible.
                                </p>
                                <p className="text-red-500 text-xs mt-1">
                                    The user and all their data will be permanently removed.
                                </p>
                            </div>
                        ) : (
                            <Textarea
                                placeholder="Add optional notes for this decision..."
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                            />
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedAppeal(null)} disabled={isReviewing}>
                            Cancel
                        </Button>
                        <Button
                            variant={actionType === 'delete' ? 'destructive' : actionType === 'approve' ? 'default' : 'secondary'}
                            onClick={handleAction}
                            disabled={isReviewing}
                            className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            {isReviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {actionType === 'approve' && (selectedAppeal?.appeal_type === 'route_block' ? "Unblock Access" : "Restore Account")}
                            {actionType === 'reject' && "Reject Appeal"}
                            {actionType === 'delete' && "Delete Permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
